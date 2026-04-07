import React, { useState, useEffect, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}
function fmtSpeed(bps) {
  if (!bps) return '0 B/s';
  if (bps < 1024) return `${bps.toFixed(0)} B/s`;
  if (bps < 1048576) return `${(bps/1024).toFixed(1)} KB/s`;
  return `${(bps/1048576).toFixed(1)} MB/s`;
}
function fmtUptime(secs) {
  if (!secs) return '—';
  const d = Math.floor(secs/86400), h = Math.floor((secs%86400)/3600), m = Math.floor((secs%3600)/60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function pct(val) { return typeof val === 'number' ? `${val.toFixed(1)}%` : '—'; }
function tempColor(t) { return t > 85 ? 'var(--red)' : t > 70 ? 'var(--amber)' : 'var(--green)'; }
function loadColor(v) { return v > 85 ? 'var(--red)' : v > 65 ? 'var(--amber)' : 'var(--green)'; }

// ── Bar ───────────────────────────────────────────────────────────────────────
function Bar({ value, max = 100, color }) {
  const p = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${p}%`, background: color || loadColor(p), borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, bar, barVal, barMax = 100, barColor, note }) {
  return (
    <div className="stat-row">
      {icon && <span style={{ fontSize: '0.9em', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>}
      <span className="stat-row-label" style={{ width: icon ? 68 : 90 }}>{label}</span>
      {bar && <Bar value={barVal ?? value} max={barMax} color={barColor} />}
      <span className="stat-row-value" style={{ color: barColor || 'var(--accent)' }}>{value}</span>
      {note && <span className="stat-row-note">{note}</span>}
    </div>
  );
}

function StatBox({ children }) {
  return (
    <div className="stat-box" style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 10px', marginBottom: 8,
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ title }) {
  return (
    <div className="section-label" style={{
      fontSize: '0.68em', color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.07em', fontWeight: 700, marginTop: 8, marginBottom: 4,
    }}>
      {title}
    </div>
  );
}

// ── Tab ───────────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`btn ${active ? 'primary' : 'ghost'}`}
      style={{ flex: 1, justifyContent: 'center', fontSize: '0.75em', padding: '3px 4px' }}>
      {label}
    </button>
  );
}

// ── CPU Core grid ─────────────────────────────────────────────────────────────
function CpuCoreGrid({ cores }) {
  if (!cores?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 4, marginTop: 4 }}>
      {cores.map((load, i) => (
        <div key={i} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65em', color: 'var(--text-dim)', marginBottom: 2 }}>C{i}</div>
          <div style={{ fontSize: '0.8em', fontWeight: 700, color: loadColor(load) }}>{load.toFixed(0)}%</div>
          <Bar value={load} color={loadColor(load)} />
        </div>
      ))}
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function WindowsStatsWidget({ settings = {}, widgetId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState(settings.defaultTab || 'overview');

  const showProcesses = settings.showProcesses !== 'false' && settings.showProcesses !== false;
  const showNetwork   = settings.showNetwork   !== 'false' && settings.showNetwork   !== false;
  const showDisks     = settings.showDisks     !== 'false' && settings.showDisks     !== false;
  const showGpu       = settings.showGpu       !== 'false' && settings.showGpu       !== false;
  const showCores     = settings.showCores     !== 'false' && settings.showCores     !== false;
  const maxProcs      = parseInt(settings.maxProcesses || '10');

  const load = useCallback(async () => {
    if (!settings.url) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/pcstats?_widgetId=${widgetId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [settings.url, widgetId]);

  useEffect(() => {
    load();
    const secs = parseInt(settings.refreshInterval || '5');
    const id = setInterval(load, secs * 1000);
    return () => clearInterval(id);
  }, [load, settings.refreshInterval]);

  const [discovered, setDiscovered] = useState([]);
  const [discovering, setDiscovering] = useState(false);

  const discover = async () => {
    setDiscovering(true);
    try {
      const r = await fetch(`/api/agents/discover?_widgetId=${widgetId}`);
      const data = await r.json();
      setDiscovered(Array.isArray(data) ? data : []);
    } catch(e) {}
    setDiscovering(false);
  };

  if (!settings.url) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ fontSize: '2em' }}>🖥</div>
      <div style={{ fontSize: '0.85em', fontWeight: 600, color: 'var(--text)' }}>No agent configured</div>
      <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', textAlign: 'center' }}>Install WarrDash Agent on your Windows PC, then discover it below or enter the URL manually in settings.</div>
      <button className="btn primary" onClick={discover} disabled={discovering} style={{ marginTop: 4 }}>
        {discovering ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Scanning…</> : '🔍 Discover Agents'}
      </button>
      {discovered.length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Found on network:</div>
          {discovered.map((a, i) => (
            <div key={i} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.82em', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>🖥 {a.hostname}</div>
              <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 6 }}>{a.url}</div>
              <div style={{ fontSize: '0.7em', color: 'var(--text-dim)' }}>Copy this URL into widget settings → Agent URL</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75em', color: 'var(--accent)', marginTop: 4, padding: '3px 6px', background: 'var(--bg)', borderRadius: 4, display: 'inline-block' }}>{a.url}</div>
            </div>
          ))}
        </div>
      )}
      {discovered.length === 0 && !discovering && (
        <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', textAlign: 'center' }}>
          Or enter URL manually in widget settings:<br/>
          <code style={{ color: 'var(--accent)' }}>http://192.168.1.x:61209</code>
        </div>
      )}
    </div>
  );
  if (loading && !data) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return (
    <div className="widget-loading" style={{ flexDirection: 'column', gap: 6 }}>
      <span style={{ color: 'var(--red)', fontSize: '0.85em' }}>⚠ {error}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.72em' }}>Agent running? ({settings.url})</span>
    </div>
  );
  if (!data) return null;

  const { cpu, temps, memory: mem, disks, network, gpu, processes, os, disk_io } = data;
  const hasGpu  = showGpu  && gpu?.length > 0;
  const hasTemp = temps?.main !== null && temps?.main !== undefined;

  const tabs = [
    { key: 'overview',   label: '📊' },
    showDisks     && { key: 'disks',     label: '💾' },
    showNetwork   && { key: 'network',   label: '🌐' },
    hasGpu        && { key: 'gpu',       label: '🎮' },
    showProcesses && { key: 'processes', label: '⚙️' },
  ].filter(Boolean);

  const netReal = (network || []).filter(n => n.rx_sec > 0 || n.tx_sec > 0 || n.rx_bytes > 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

      {/* Header: hostname + uptime */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexShrink: 0 }}>
        <span style={{ fontSize: '0.75em', color: 'var(--text-dim)', fontWeight: 600 }}>
          {settings.displayName || os?.hostname || 'PC'}
        </span>
        <span style={{ fontSize: '0.72em', color: 'var(--text-dim)' }}>⏱ {fmtUptime(os?.uptime)}</span>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginBottom: 6 }}>
          {tabs.map(t => <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />)}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <SectionLabel title="CPU" />
            <StatBox>
              <StatRow icon="⚡" label="Total Load" value={pct(cpu?.load)} bar barVal={cpu?.load} barColor={loadColor(cpu?.load || 0)} />
              <StatRow icon="" label="User" value={pct(cpu?.user)} bar barVal={cpu?.user} />
              <StatRow icon="" label="System" value={pct(cpu?.system)} bar barVal={cpu?.system} />
              {hasTemp && <StatRow icon="🌡" label="CPU Temp" value={`${temps.main?.toFixed(0)}°C`} bar barVal={temps.main} barMax={100} barColor={tempColor(temps.main)} />}
              {hasTemp && temps.max && temps.max !== temps.main && (
                <StatRow icon="" label="Max Core" value={`${temps.max?.toFixed(0)}°C`} bar barVal={temps.max} barMax={100} barColor={tempColor(temps.max)} />
              )}
            </StatBox>

            {showCores && cpu?.cores?.length > 0 && (
              <>
                <SectionLabel title={`CPU Cores (${cpu.core_count})`} />
                <CpuCoreGrid cores={cpu.cores} />
              </>
            )}

            <SectionLabel title="Memory" />
            <StatBox>
              <StatRow icon="💾" label="RAM" value={`${fmt(mem?.used, 0)} / ${fmt(mem?.total, 0)}`} bar barVal={mem?.percent} barColor={loadColor(mem?.percent || 0)} />
              {mem?.swap_total > 0 && <StatRow icon="" label="Page File" value={`${fmt(mem?.swap_used, 0)} / ${fmt(mem?.swap_total, 0)}`} bar barVal={mem?.swap_percent} barColor="var(--amber)" />}
            </StatBox>

            {hasGpu && gpu.map((g, i) => (
              <React.Fragment key={i}>
                <SectionLabel title={`GPU${gpu.length > 1 ? ` ${i}` : ''} — ${g.name}`} />
                <StatRow icon="🎮" label="GPU Load" value={pct(g.gpu_percent)} bar barVal={g.gpu_percent} barColor={loadColor(g.gpu_percent)} />
                <StatRow icon="" label="VRAM" value={`${g.mem_used_mb?.toFixed(0)} / ${g.mem_total_mb?.toFixed(0)} MB`} bar barVal={g.mem_percent} barColor="var(--amber)" />
                <StatRow icon="🌡" label="GPU Temp" value={`${g.temperature}°C`} bar barVal={g.temperature} barMax={100} barColor={tempColor(g.temperature)} />
                {g.power_draw_w > 0 && <StatRow icon="⚡" label="Power" value={`${g.power_draw_w?.toFixed(0)}W / ${g.power_limit_w?.toFixed(0)}W`} bar barVal={g.power_draw_w} barMax={g.power_limit_w} barColor="var(--accent)" />}
                {g.fan_percent > 0 && <StatRow icon="💨" label="Fan" value={pct(g.fan_percent)} bar barVal={g.fan_percent} barColor="var(--accent)" />}
              </React.Fragment>
            ))}

            <SectionLabel title="Network" />
            <StatBox>
              {netReal.slice(0,2).map((n, i) => (
                <React.Fragment key={i}>
                  <StatRow icon="⬇" label={`${n.iface} ↓`} value={fmtSpeed(n.rx_sec)} />
                  <StatRow icon="⬆" label={`${n.iface} ↑`} value={fmtSpeed(n.tx_sec)} />
                </React.Fragment>
              ))}
            </StatBox>

            <SectionLabel title="Top Disks" />
            <StatBox>
              {(disks || []).slice(0, 2).map((d, i) => (
                <StatRow key={i} icon="💿" label={d.mount} value={`${fmt(d.used, 0)} / ${fmt(d.size, 0)}`} bar barVal={d.percent} barColor={loadColor(d.percent)} />
              ))}
            </StatBox>
          </>
        )}

        {/* ── DISKS ── */}
        {tab === 'disks' && (
          <>
            <SectionLabel title="Disk Usage" />
            {(disks || []).map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.mount} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({d.type})</span></span>
                  <span style={{ color: 'var(--text-dim)' }}>{fmt(d.used, 1)} / {fmt(d.size, 1)}</span>
                </div>
                <Bar value={d.percent} color={loadColor(d.percent)} />
                <div style={{ fontSize: '0.7em', color: 'var(--text-dim)', marginTop: 2 }}>{pct(d.percent)} used · {fmt(d.free, 1)} free</div>
              </div>
            ))}
            {disk_io && (
              <>
                <SectionLabel title="Disk I/O" />
                <StatRow icon="📖" label="Read" value={fmtSpeed(disk_io.read_bytes_sec)} />
                <StatRow icon="✏️" label="Write" value={fmtSpeed(disk_io.write_bytes_sec)} />
              </>
            )}
          </>
        )}

        {/* ── NETWORK ── */}
        {tab === 'network' && (
          <>
            {(network || []).map((n, i) => (
              <div key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>🌐 {n.iface}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78em' }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Download</div>
                    <div style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmtSpeed(n.rx_sec)}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.85em' }}>Total: {fmt(n.rx_bytes)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Upload</div>
                    <div style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmtSpeed(n.tx_sec)}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.85em' }}>Total: {fmt(n.tx_bytes)}</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── GPU ── */}
        {tab === 'gpu' && (
          <>
            {!hasGpu && <div style={{ fontSize: '0.8em', color: 'var(--text-dim)', padding: 8 }}>No GPU data — is nvidia-smi accessible?</div>}
            {(gpu || []).map((g, i) => (
              <div key={i}>
                <SectionLabel title={g.name} />
                <StatRow icon="🎮" label="GPU Load"  value={pct(g.gpu_percent)}  bar barVal={g.gpu_percent}  barColor={loadColor(g.gpu_percent)} />
                <StatRow icon="💾" label="VRAM Used" value={`${g.mem_used_mb?.toFixed(0)} MB`}   bar barVal={g.mem_percent} barColor="var(--amber)" note={`/ ${g.mem_total_mb?.toFixed(0)} MB`} />
                <StatRow icon="🌡" label="Temp"      value={`${g.temperature}°C`}  bar barVal={g.temperature}  barMax={100} barColor={tempColor(g.temperature)} />
                {g.power_draw_w > 0 && <StatRow icon="⚡" label="Power Draw" value={`${g.power_draw_w?.toFixed(1)}W`} bar barVal={g.power_draw_w} barMax={g.power_limit_w || 300} barColor="var(--accent)" note={`/ ${g.power_limit_w?.toFixed(0)}W`} />}
                {g.fan_percent > 0 && <StatRow icon="💨" label="Fan Speed" value={pct(g.fan_percent)} bar barVal={g.fan_percent} barColor="var(--accent)" />}
                {g.clock_gpu_mhz > 0 && <StatRow icon="⚡" label="Core Clock" value={`${g.clock_gpu_mhz} MHz`} />}
                {g.clock_mem_mhz > 0 && <StatRow icon="💾" label="Mem Clock"  value={`${g.clock_mem_mhz} MHz`} />}
              </div>
            ))}
          </>
        )}

        {/* ── PROCESSES ── */}
        {tab === 'processes' && (
          <>
            <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 4 }}>
              {processes?.running || 0} running · {processes?.total || 0} total
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 8px', fontSize: '0.7em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
              <span>Process</span><span>CPU</span><span>RAM</span>
            </div>
            {(processes?.list || []).slice(0, maxProcs).map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 8px', fontSize: '0.78em', padding: '3px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: loadColor(p.cpu), fontFamily: 'var(--font-display)', fontWeight: 600, minWidth: 38, textAlign: 'right' }}>{p.cpu?.toFixed(1)}%</span>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', minWidth: 44, textAlign: 'right' }}>{fmt(p.mem_mb * 1024 * 1024, 0)}</span>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}
