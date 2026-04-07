# WarrDash Windows Agent

The Windows Agent exposes PC hardware stats over HTTP so the WindowsStatsWidget
can display CPU, RAM, GPU, disk and network data.

## Architecture

```
Windows PC (port 61209 HTTP)
    ↕ LAN
WarrDash Backend (proxies /api/pcstats → http://PC:61209/stats)
    ↕
WarrDash Frontend (WindowsStatsWidget)
```

## Building

**Requirements:** Python 3.10+ installed with "Add Python to PATH" checked

1. Copy the `windows-agent/` folder to a Windows machine
2. Double-click `build.bat`
3. Wait ~2 minutes — it installs Python deps and builds the EXE
4. Find the output in `installer/`

### The build.bat does:
1. `pip install pyinstaller psutil pystray pillow`
2. `PyInstaller --onefile --windowed agent.py`
3. Creates `installer/WarrDash Agent.exe`
4. Creates `installer/Install WarrDash Agent.bat`

## Installing on a PC

1. Copy the `installer/` folder to the target PC
2. Double-click `Install WarrDash Agent.bat`
3. Agent starts and appears in system tray (bottom-right)

## System Tray

Right-click the tray icon for:
- **View Status** — opens status page in browser with live stats
- **Copy URL** — copies `http://192.168.1.x:61209` to clipboard
- **Start with Windows** — toggle auto-start (enabled by default on first run)
- **Quit**

## CPU Temperatures

CPU temps require [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases):

1. Download and run as **Administrator**
2. Options → Web Server → Enable (port 8085)
3. Leave it running — the agent queries `http://localhost:8085/data.json`

Without LHM, CPU temps show as N/A. GPU temps work without LHM (via nvidia-smi).

## Ports

| Port | Protocol | Purpose |
|---|---|---|
| 61209 | TCP/HTTP | Stats API (`/stats`, `/health`) |
| 61210 | UDP | Auto-discovery broadcast every 10s |

## Firewall

The installer script adds a Windows Firewall rule automatically:
```
netsh advfirewall firewall add rule name="WarrDash Agent" dir=in action=allow protocol=TCP localport=61209
```

## API Endpoints

```
GET http://PC_IP:61209/stats   — full stats JSON
GET http://PC_IP:61209/health  — quick health check
```

## Backend Route

Add to `server.js` (already included in patched version):

```js
app.get('/api/pcstats', async (req, res) => {
  const settings = getWidgetSettings(req.query._widgetId, 'windowsstats');
  const url = settings.url || 'http://192.168.1.167:61209';
  const r = await homelabAxios.get(`${url}/stats`);
  res.json(r.data);
});
```
