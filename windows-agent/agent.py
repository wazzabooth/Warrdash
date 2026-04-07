"""
WarrDash Agent v2.1 - Python Edition
System tray stats service for WarrDash dashboard
"""

import sys
import os
import json
import time
import socket
import threading
import subprocess
import logging
import platform
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# ── Dependency check ──────────────────────────────────────────────────────────
def show_error(msg):
    if platform.system() == "Windows":
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, msg, "WarrDash Agent", 0x10)
        except:
            print(msg)
    else:
        print(msg)

try:
    import psutil
except ImportError:
    show_error("Missing: psutil\nRun build.bat to create the installer.")
    sys.exit(1)

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    show_error("Missing: pystray / pillow\nRun build.bat to create the installer.")
    sys.exit(1)

import winreg

# ── Constants ─────────────────────────────────────────────────────────────────
VERSION        = "2.2.0"
PORT           = 61209
DISCOVERY_PORT = 61210
COLLECT_INTERVAL = 4    # seconds between background collections
APP_NAME       = "WarrDash Agent"
REG_VALUE      = "WarrDashAgent"
REG_KEY        = r"Software\Microsoft\Windows\CurrentVersion\Run"
APPDATA_DIR    = os.path.join(os.environ.get("APPDATA", "C:\\Users\\Public"), "WarrDashAgent")

# ── Globals ───────────────────────────────────────────────────────────────────
stats_cache    = {}
cache_lock     = threading.Lock()
request_count  = 0
start_time     = time.time()
tray_icon      = None

# ── Logging ───────────────────────────────────────────────────────────────────
os.makedirs(APPDATA_DIR, exist_ok=True)
log_path = os.path.join(APPDATA_DIR, "agent.log")
logging.basicConfig(
    filename=log_path, level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("warrdash")

def safe(fn, default=None):
    """Run fn(), return default on any exception."""
    try:
        return fn()
    except Exception as e:
        log.debug(f"{fn.__name__ if hasattr(fn,'__name__') else 'fn'}: {e}")
        return default

# ── Local IP ──────────────────────────────────────────────────────────────────
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

# ── GPU via nvidia-smi ────────────────────────────────────────────────────────
def get_nvidia_gpu():
    try:
        result = subprocess.run(
            ["nvidia-smi",
             "--query-gpu=name,temperature.gpu,utilization.gpu,utilization.memory,"
             "memory.used,memory.total,power.draw,power.limit,fan.speed,"
             "clocks.current.graphics,clocks.current.memory",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=5,
            creationflags=subprocess.CREATE_NO_WINDOW if platform.system()=="Windows" else 0
        )
        if result.returncode != 0 or not result.stdout.strip():
            return []
        gpus = []
        for i, line in enumerate(result.stdout.strip().splitlines()):
            p = [x.strip() for x in line.split(",")]
            def fp(idx, default=0.0):
                try: return float(p[idx]) if len(p) > idx else default
                except: return default
            gpus.append({
                "id": i, "name": p[0] if p else "GPU",
                "temperature":   fp(1),  "gpu_percent":   fp(2),
                "mem_percent":   fp(3),  "mem_used_mb":   fp(4),
                "mem_total_mb":  fp(5),  "power_draw_w":  fp(6),
                "power_limit_w": fp(7),  "fan_percent":   fp(8),
                "clock_gpu_mhz": fp(9),  "clock_mem_mhz": fp(10),
            })
        return gpus
    except Exception as e:
        log.debug(f"nvidia-smi: {e}")
        return []


# ── CPU temps via LibreHardwareMonitor web server ────────────────────────────
# LHM must be running as Administrator with web server enabled (port 8085)
# Options → Web Server → Enable in LHM
LHM_URL = "http://localhost:8085/data.json"

def parse_lhm_tree(node, results=None):
    """Recursively walk LHM JSON tree, extract all temperature sensors."""
    if results is None:
        results = []
    # If this node is a temperature sensor
    if node.get("SensorType") == "Temperature" or (
        "°C" in str(node.get("Value", "")) and node.get("Text")
    ):
        val_str = node.get("Value", "")
        try:
            val = float(val_str.replace("°C", "").replace(",", ".").strip())
            if 0 < val < 150:  # sanity check
                results.append({"name": node.get("Text", ""), "value": val})
        except:
            pass
    for child in node.get("Children", []):
        parse_lhm_tree(child, results)
    return results

def get_cpu_temps_lhm():
    """Query LibreHardwareMonitor REST API for CPU temperatures."""
    try:
        import urllib.request
        req = urllib.request.urlopen(LHM_URL, timeout=1)
        data = json.loads(req.read().decode())
        sensors = parse_lhm_tree(data)
        # Filter to CPU temps only
        cpu_temps = [s for s in sensors if any(
            k in s["name"].lower() for k in ["cpu", "core", "package", "tctl", "tdie"]
        )]
        if not cpu_temps:
            # Fall back to all temps if no CPU-specific ones found
            cpu_temps = sensors
        if not cpu_temps:
            return None
        values = [s["value"] for s in cpu_temps]
        cores = [s for s in cpu_temps if "core" in s["name"].lower()]
        return {
            "main":   round(sum(values) / len(values), 1),
            "max":    round(max(values), 1),
            "cores":  [round(s["value"], 1) for s in cores],
            "source": "LibreHardwareMonitor",
            "sensors": cpu_temps,
        }
    except Exception as e:
        log.debug(f"LHM temps: {e}")
        return None

def get_cpu_temps_wmi():
    """Try WMI OpenHardwareMonitor/LibreHardwareMonitor namespace."""
    try:
        import wmi
        for ns in ["root\\LibreHardwareMonitor", "root\\OpenHardwareMonitor"]:
            try:
                w = wmi.WMI(namespace=ns)
                sensors = w.Sensor()
                cpu_temps = [
                    {"name": s.Name, "value": float(s.Value)}
                    for s in sensors
                    if s.SensorType == "Temperature" and any(
                        k in s.Name.lower() for k in ["cpu","core","package","tctl","tdie"]
                    ) and s.Value and 0 < float(s.Value) < 150
                ]
                if cpu_temps:
                    values = [s["value"] for s in cpu_temps]
                    cores = [s for s in cpu_temps if "core" in s["name"].lower()]
                    return {
                        "main":   round(sum(values)/len(values), 1),
                        "max":    round(max(values), 1),
                        "cores":  [round(s["value"],1) for s in cores],
                        "source": ns.split("\\")[-1],
                        "sensors": cpu_temps,
                    }
            except:
                continue
    except:
        pass
    return None

def get_cpu_temps():
    """Try all available methods for CPU temps."""
    # 1. LibreHardwareMonitor REST API (most reliable)
    result = get_cpu_temps_lhm()
    if result:
        return result
    # 2. WMI (requires LHM/OHM running)
    result = get_cpu_temps_wmi()
    if result:
        return result
    # 3. psutil (rarely works on Windows without LHM)
    try:
        raw = psutil.sensors_temperatures()
        if raw:
            all_t = [e.current for entries in raw.values() for e in entries if e.current and 0 < e.current < 150]
            if all_t:
                return {
                    "main":   round(sum(all_t)/len(all_t), 1),
                    "max":    round(max(all_t), 1),
                    "cores":  [round(t,1) for t in all_t],
                    "source": "psutil",
                }
    except:
        pass
    return None

# ── Background stats collector ────────────────────────────────────────────────
# Runs in its own thread — never blocks HTTP requests
_prev_net = {}
_prev_net_time = 0

def collect_stats():
    global _prev_net, _prev_net_time

    result = {
        "timestamp": int(time.time() * 1000),
        "version": VERSION,
        "hostname": socket.gethostname(),
    }

    # ── OS ──────────────────────────────────────────────────────────────────
    result["os"] = {
        "platform": "windows",
        "distro":   platform.system(),
        "release":  platform.release(),
        "hostname": socket.gethostname(),
        "uptime":   int(time.time() - psutil.boot_time()),
        "arch":     platform.machine(),
    }

    # ── CPU ──────────────────────────────────────────────────────────────────
    try:
        cpu_pct   = psutil.cpu_percent(interval=1)
        cpu_cores = psutil.cpu_percent(interval=None, percpu=True) or []
        cpu_times = psutil.cpu_times_percent()
        result["cpu"] = {
            "load":       round(cpu_pct, 1),
            "user":       round(getattr(cpu_times, "user",   0), 1),
            "system":     round(getattr(cpu_times, "system", 0), 1),
            "idle":       round(getattr(cpu_times, "idle",   0), 1),
            "cores":      [round(c, 1) for c in cpu_cores],
            "core_count": len(cpu_cores),
        }
    except Exception as e:
        log.warning(f"CPU: {e}")
        result["cpu"] = {"load": 0, "user": 0, "system": 0, "idle": 0, "cores": [], "core_count": 0}

    # ── CPU temps via LHM/WMI/psutil ─────────────────────────────────────────
    try:
        temps_data = get_cpu_temps()
        if temps_data:
            result["temps"] = {
                "main":   temps_data.get("main"),
                "max":    temps_data.get("max"),
                "cores":  temps_data.get("cores", []),
                "source": temps_data.get("source", "unknown"),
            }
        else:
            result["temps"] = {"main": None, "max": None, "cores": [], "source": None}
    except Exception as e:
        log.warning(f"Temps: {e}")
        result["temps"] = {"main": None, "max": None, "cores": [], "source": None}

    # ── Memory ───────────────────────────────────────────────────────────────
    try:
        mem  = psutil.virtual_memory()
        swap = psutil.swap_memory()
        result["memory"] = {
            "total":        mem.total,   "used":      mem.used,
            "free":         mem.free,    "available": mem.available,
            "percent":      round(mem.percent, 1),
            "swap_total":   swap.total,  "swap_used": swap.used,
            "swap_percent": round(swap.percent, 1),
        }
    except Exception as e:
        log.warning(f"Memory: {e}")
        result["memory"] = {"total":0,"used":0,"free":0,"available":0,"percent":0,"swap_total":0,"swap_used":0,"swap_percent":0}

    # ── Disks ─────────────────────────────────────────────────────────────────
    disks = []
    try:
        for part in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disks.append({
                    "fs": part.device, "mount": part.mountpoint, "type": part.fstype,
                    "size": usage.total, "used": usage.used, "free": usage.free,
                    "percent": round(usage.percent, 1),
                })
            except:
                pass
    except Exception as e:
        log.warning(f"Disks: {e}")
    result["disks"] = disks

    # ── Disk I/O ──────────────────────────────────────────────────────────────
    try:
        io = psutil.disk_io_counters()
        result["disk_io"] = {
            "read_bytes_sec":  getattr(io, "read_bytes",  0),
            "write_bytes_sec": getattr(io, "write_bytes", 0),
        }
    except:
        result["disk_io"] = {"read_bytes_sec": 0, "write_bytes_sec": 0}

    # ── Network (with per-second rates) ───────────────────────────────────────
    network = []
    try:
        now_net  = psutil.net_io_counters(pernic=True)
        now_time = time.time()
        elapsed  = now_time - _prev_net_time if _prev_net_time else 1

        for iface, stats in now_net.items():
            if any(x in iface.lower() for x in ["loopback", "pseudo", "isatap"]): continue
            prev = _prev_net.get(iface)
            rx_sec = max(0, (stats.bytes_recv - prev.bytes_recv) / elapsed) if prev else 0
            tx_sec = max(0, (stats.bytes_sent - prev.bytes_sent) / elapsed) if prev else 0
            network.append({
                "iface":    iface,
                "rx_bytes": stats.bytes_recv, "tx_bytes": stats.bytes_sent,
                "rx_sec":   round(rx_sec),    "tx_sec":   round(tx_sec),
            })

        _prev_net      = now_net
        _prev_net_time = now_time
    except Exception as e:
        log.warning(f"Network: {e}")
    result["network"] = network

    # ── GPU ───────────────────────────────────────────────────────────────────
    result["gpu"] = get_nvidia_gpu()

    # ── Processes ─────────────────────────────────────────────────────────────
    procs = []
    try:
        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info", "status"]):
            try:
                procs.append({
                    "pid":    p.info["pid"],
                    "name":   p.info["name"] or "",
                    "cpu":    round(p.info["cpu_percent"] or 0, 1),
                    "mem_mb": round((p.info["memory_info"].rss if p.info["memory_info"] else 0) / 1048576, 1),
                    "status": p.info["status"] or "",
                })
            except:
                pass
        procs.sort(key=lambda x: x["cpu"], reverse=True)
    except Exception as e:
        log.warning(f"Processes: {e}")
    result["processes"] = {
        "total":   len(procs),
        "running": sum(1 for p in procs if p.get("status") == "running"),
        "list":    procs[:20],
    }

    # ── Battery ───────────────────────────────────────────────────────────────
    try:
        bat = psutil.sensors_battery()
        result["battery"] = {
            "has_battery": True,
            "is_charging": bat.power_plugged,
            "percent":     bat.percent,
        } if bat else None
    except:
        result["battery"] = None

    return result

def stats_collector_loop():
    """Background thread — collects stats every COLLECT_INTERVAL seconds."""
    global stats_cache
    while True:
        try:
            data = collect_stats()
            with cache_lock:
                stats_cache = data
            log.debug("Stats collected OK")
        except Exception as e:
            log.error(f"Stats collection failed: {e}")
        time.sleep(COLLECT_INTERVAL)

# ── Threaded HTTP server ──────────────────────────────────────────────────────
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class StatsHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Silence access log

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        global request_count
        path = self.path.split("?")[0]

        if path == "/health":
            request_count += 1
            self.send_response(200)
            self.send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({
                "ok": True, "version": VERSION,
                "hostname": socket.gethostname(),
                "ip": get_local_ip(), "port": PORT,
                "uptime": int(time.time() - start_time),
                "requests": request_count,
            }).encode())
            return

        if path == "/stats":
            request_count += 1
            with cache_lock:
                data = dict(stats_cache)
            self.send_response(200)
            self.send_cors()
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        self.send_response(404)
        self.send_cors()
        self.end_headers()
        self.wfile.write(b'{"error":"Use /stats or /health"}')

# ── UDP discovery broadcast ───────────────────────────────────────────────────
def start_discovery():
    def loop():
        import socket as _s
        sock = _s.socket(_s.AF_INET, _s.SOCK_DGRAM)
        sock.setsockopt(_s.SOL_SOCKET, _s.SO_BROADCAST, 1)
        payload_base = {
            "type": "warrdash-agent", "version": VERSION,
            "hostname": _s.gethostname(), "port": PORT,
        }
        while True:
            try:
                payload_base["ip"] = get_local_ip()
                payload_base["ts"] = int(time.time())
                data = json.dumps(payload_base).encode()
                sock.sendto(data, ("255.255.255.255", DISCOVERY_PORT))
            except:
                pass
            time.sleep(10)
    threading.Thread(target=loop, daemon=True).start()

# ── Auto-start registry ───────────────────────────────────────────────────────
def get_auto_start():
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_KEY, 0, winreg.KEY_READ)
        winreg.QueryValueEx(key, REG_VALUE)
        winreg.CloseKey(key)
        return True
    except:
        return False

def set_auto_start(enabled):
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_KEY, 0, winreg.KEY_SET_VALUE)
        if enabled:
            exe = sys.executable if getattr(sys, "frozen", False) else os.path.abspath(sys.argv[0])
            winreg.SetValueEx(key, REG_VALUE, 0, winreg.REG_SZ, f'"{exe}"')
        else:
            try: winreg.DeleteValue(key, REG_VALUE)
            except: pass
        winreg.CloseKey(key)
        log.info(f"Auto-start {'enabled' if enabled else 'disabled'}")
    except Exception as e:
        log.error(f"Auto-start: {e}")

# ── Tray icon image ───────────────────────────────────────────────────────────
def create_tray_image(size=64):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        for x in range(size):
            dx, dy = x - size/2, y - size/2
            if (dx*dx + dy*dy) <= (size/2 - 1)**2:
                t = x / size
                img.putpixel((x, y), (
                    int(60 + t*40), int(30 + t*20), int(200 + t*55), 255
                ))
    pad = size * 0.18
    w = size - pad * 2
    h = size * 0.55
    top = size * 0.22
    lw = max(2, int(size / 14))
    draw.line([
        (pad,          top),
        (pad + w*0.2,  top + h),
        (pad + w*0.5,  top + h*0.4),
        (pad + w*0.8,  top + h),
        (pad + w,      top),
    ], fill=(255, 255, 255, 240), width=lw)
    return img

# ── Status page ───────────────────────────────────────────────────────────────
def show_status():
    import webbrowser
    ip = get_local_ip()
    with cache_lock:
        data = dict(stats_cache)

    cpu = data.get("cpu", {}).get("load", 0)
    mem = data.get("memory", {}).get("percent", 0)
    gpu_list = data.get("gpu", [])
    gpu = gpu_list[0] if gpu_list else None
    uptime_s = int(time.time() - start_time)
    up_str = f"{uptime_s//3600}h {(uptime_s%3600)//60}m" if uptime_s > 3600 else f"{uptime_s//60}m {uptime_s%60}s"
    url = f"http://{ip}:{PORT}"

    def bar(pct, color="#6366f1"):
        w = min(int(pct), 100)
        return f'''<span class="bar-wrap"><span class="bar-fill" style="width:{w}%;background:{color}"></span></span>'''

    temps = data.get("temps", {})
    temp_main = temps.get("main")
    temp_source = temps.get("source")
    temp_row = ""
    if temp_main:
        temp_row = f"<tr><td>CPU Temp</td><td class='v'>{bar(temp_main,'#f59e0b')} {temp_main:.0f}°C <span style='color:#555;font-size:11px'>({temp_source})</span></td></tr>"
    else:
        temp_row = "<tr><td>CPU Temp</td><td class='v dim'>N/A — install LibreHardwareMonitor</td></tr>"

    gpu_rows = ""
    if gpu:
        gpu_rows = f"""
        <tr><td>GPU</td><td class="v">{gpu['name']}</td></tr>
        <tr><td>GPU Load</td><td class="v">{bar(gpu['gpu_percent'],'#818cf8')} {gpu['gpu_percent']:.0f}%</td></tr>
        <tr><td>GPU Temp</td><td class="v">{bar(gpu['temperature'],'#f97316')} {gpu['temperature']:.0f}°C</td></tr>
        <tr><td>VRAM</td><td class="v">{gpu['mem_used_mb']:.0f} / {gpu['mem_total_mb']:.0f} MB</td></tr>
        """
    else:
        gpu_rows = "<tr><td>GPU</td><td class='v dim'>Not detected</td></tr>"

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>WarrDash Agent</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Segoe UI',sans-serif;background:#0f0f1a;color:#e0e0f0}}
.hdr{{background:linear-gradient(135deg,#4338ca,#7c3aed);padding:22px 28px}}
h1{{font-size:20px;font-weight:800;color:#fff;display:flex;align-items:center;gap:10px}}
.dot{{width:10px;height:10px;background:#4ade80;border-radius:50%;box-shadow:0 0 8px #4ade80;animation:p 2s infinite;flex-shrink:0}}
@keyframes p{{0%,100%{{opacity:1}}50%{{opacity:.4}}}}
.sub{{font-size:12px;color:rgba(255,255,255,.7);margin-top:5px}}
.body{{padding:20px 28px}}
table{{width:100%;border-collapse:collapse;font-size:13px}}
td{{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}}
td:first-child{{color:#888;width:140px;font-size:12px}}
.v{{font-weight:600}}
.dim{{color:#555;font-weight:400}}
.section td{{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#555;padding-top:18px;padding-bottom:4px;font-weight:400}}
.url{{color:#818cf8;font-family:monospace;cursor:pointer}}
.url:hover{{text-decoration:underline}}
.bar-wrap{{display:inline-block;width:80px;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;vertical-align:middle;margin-right:6px}}
.bar-fill{{display:block;height:100%;border-radius:3px;transition:width .3s}}
.footer{{padding:16px 28px;display:flex;gap:8px}}
button{{padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:opacity .15s}}
.p{{background:#4f46e5;color:#fff}}.g{{background:rgba(255,255,255,.08);color:#ccc}}
button:hover{{opacity:.8}}
</style></head><body>
<div class="hdr">
  <h1><span class="dot"></span>WarrDash Agent</h1>
  <div class="sub">v{VERSION} &nbsp;·&nbsp; Running &nbsp;·&nbsp; Up {up_str} &nbsp;·&nbsp; {request_count} requests</div>
</div>
<div class="body">
<table>
  <tr class="section"><td colspan=2>CONNECTION</td></tr>
  <tr><td>Hostname</td><td class="v">{socket.gethostname()}</td></tr>
  <tr><td>Agent URL</td><td class="v"><span class="url" onclick="navigator.clipboard.writeText('{url}');this.innerText='✓ Copied!'">{url}</span></td></tr>
  <tr class="section"><td colspan=2>SYSTEM</td></tr>
  <tr><td>CPU Load</td><td class="v">{bar(cpu)} {cpu:.1f}%</td></tr>
  <tr><td>RAM</td><td class="v">{bar(mem,'#0891b2')} {mem:.1f}%</td></tr>
  {temp_row}
  {gpu_rows}
  <tr class="section"><td colspan=2>STARTUP</td></tr>
  <tr><td>Start with Windows</td><td class="v">{"✓ Enabled" if get_auto_start() else "✗ Disabled — right-click tray icon to enable"}</td></tr>
  <tr><td>Log file</td><td class="v dim" style="font-size:11px;font-family:monospace">{log_path}</td></tr>
</table>
</div>
<div class="footer">
  <button class="p" onclick="window.close()">Close</button>
  <button class="g" onclick="navigator.clipboard.writeText('{url}');this.innerText='✓ Copied!'">Copy URL</button>
  <button class="g" onclick="window.open('{url}/stats','_blank')">Raw Stats JSON</button>
</div>
</body></html>"""

    tmp = os.path.join(os.environ.get("TEMP", APPDATA_DIR), "warrdash-status.html")
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(html)
        webbrowser.open(f"file:///{tmp.replace(os.sep, '/')}")
    except Exception as e:
        log.error(f"Status page: {e}")

# ── Tray menu ─────────────────────────────────────────────────────────────────
def on_toggle_autostart(icon, item):
    set_auto_start(not get_auto_start())
    icon.menu = pystray.Menu(*make_menu_items(icon))

def on_copy_url(icon, item):
    url = f"http://{get_local_ip()}:{PORT}"
    try:
        subprocess.run(["clip"], input=url.encode(), check=True,
                       creationflags=subprocess.CREATE_NO_WINDOW)
    except:
        pass

def make_menu_items(icon):
    ip = get_local_ip()
    return [
        pystray.MenuItem(f"WarrDash Agent v{VERSION}", lambda i,m: None, enabled=False),
        pystray.MenuItem(f"● Running on :{PORT}",      lambda i,m: None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("📊 View Status",
            lambda i,m: threading.Thread(target=show_status, daemon=True).start()),
        pystray.MenuItem(f"📋 Copy URL  ({ip}:{PORT})", on_copy_url),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("🚀 Start with Windows",
            on_toggle_autostart,
            checked=lambda item: get_auto_start()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ Quit", lambda i,m: i.stop()),
    ]

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    log.info(f"WarrDash Agent v{VERSION} starting")

    # Kick off background stats collection
    t = threading.Thread(target=stats_collector_loop, daemon=True)
    t.start()
    log.info("Stats collector started")

    # Warm up — wait for first collection before serving
    for _ in range(20):  # up to 10s
        with cache_lock:
            ready = bool(stats_cache)
        if ready:
            break
        time.sleep(0.5)

    # Start threaded HTTP server
    try:
        httpd = ThreadedHTTPServer(("0.0.0.0", PORT), StatsHandler)
    except OSError as e:
        show_error(f"Port {PORT} is already in use.\nIs another instance running?\n\n{e}")
        sys.exit(1)

    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    log.info(f"HTTP server on port {PORT}")

    # Discovery
    start_discovery()

    # Auto-start: enable on first run
    cfg_flag = os.path.join(APPDATA_DIR, ".configured")
    if not os.path.exists(cfg_flag):
        set_auto_start(True)
        open(cfg_flag, "w").close()
        log.info("First run — auto-start enabled")

    # System tray
    img = create_tray_image(64)
    icon = pystray.Icon(APP_NAME, icon=img,
                        title=f"WarrDash Agent — {get_local_ip()}:{PORT}",
                        menu=pystray.Menu(*make_menu_items(None)))
    log.info("Tray icon created — running")
    icon.run()

    httpd.shutdown()
    log.info("Agent stopped")

if __name__ == "__main__":
    main()
