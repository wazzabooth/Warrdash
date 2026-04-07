import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Camera snapshot image with auto-refresh ───────────────────────────────────
function CameraSnapshot({ url, name, onClick, refreshInterval = 5000 }) {
  const [src, setSrc]       = useState('');
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const timerRef = useRef(null);

  const refresh = useCallback(() => {
    setSrc(`${url}?t=${Date.now()}`);
  }, [url]);

  useEffect(() => {
    setLoaded(false);
    setErr(false);
    refresh();
    timerRef.current = setInterval(refresh, refreshInterval);
    return () => clearInterval(timerRef.current);
  }, [url, refreshInterval]);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 8, overflow: 'hidden',
        background: 'var(--bg2)', cursor: onClick ? 'pointer' : 'default',
        border: '1px solid var(--border)', aspectRatio: '16/9',
      }}
    >
      {/* Camera name badge */}
      <div style={{
        position: 'absolute', top: 6, left: 6, zIndex: 2,
        background: 'rgba(0,0,0,0.7)', borderRadius: 4,
        padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: err ? 'var(--red)' : 'var(--green)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.72em', color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{name}</span>
      </div>

      {/* Image */}
      {src && (
        <img
          src={src}
          alt={name}
          onLoad={() => { setLoaded(true); setErr(false); }}
          onError={() => setErr(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: loaded ? 'block' : 'none',
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Loading / error state */}
      {!loaded && !err && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
          <div className="spinner" style={{ width: 18, height: 18 }} />
        </div>
      )}
      {err && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80, gap: 6 }}>
          <span style={{ fontSize: '1.5em' }}>📷</span>
          <span style={{ fontSize: '0.75em', color: 'var(--text-dim)' }}>No feed</span>
        </div>
      )}
    </div>
  );
}

// ── Recent events list ────────────────────────────────────────────────────────
function EventsList({ events, cameraFilter }) {
  const filtered = cameraFilter
    ? events.filter(e => e.camera === cameraFilter)
    : events;

  if (!filtered.length) return (
    <div style={{ fontSize: '0.8em', color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0' }}>No recent events</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {filtered.slice(0, 10).map((ev, i) => (
        <div key={ev.id || i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 8px', background: 'var(--surface2)', borderRadius: 6,
          fontSize: '0.8em',
        }}>
          <span style={{ fontSize: '1.1em', flexShrink: 0 }}>
            {ev.label === 'person' ? '🚶' : ev.label === 'car' ? '🚗' : ev.label === 'dog' ? '🐕' : '⚡'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{ev.label || 'Detection'}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.88em' }}>{ev.camera}</div>
          </div>
          <div style={{ color: 'var(--text-dim)', flexShrink: 0, fontSize: '0.88em' }}>
            {ev.start_time ? new Date(ev.start_time * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
          {ev.end_time === null && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, boxShadow: '0 0 4px var(--red)', animation: 'pulse 1.5s infinite' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

// ── Shared layout components — inline styles ensure they work before CSS loads ──
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

function StatRow({ label, value, bar, barVal, barMax=100, barColor, note, color, icon }) {
  const pct = Math.min(Math.max(((barVal||0)/barMax)*100,0),100);
  const auto = pct>85?'var(--red)':pct>65?'var(--amber)':'var(--accent)';
  return (
    <div className="stat-row" style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
      {icon&&<span style={{fontSize:'0.9em',width:18,textAlign:'center',flexShrink:0}}>{icon}</span>}
      <span style={{fontSize:'0.75em',color:'var(--text-muted)',flexShrink:0,width:icon?68:90}}>{label}</span>
      {bar&&<div style={{flex:1,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,transition:'width 0.4s',width:`${pct}%`,background:barColor||auto}}/></div>}
      <span style={{fontSize:'0.82em',fontWeight:600,color:color||barColor||'var(--text)',flexShrink:0,minWidth:54,textAlign:'right'}}>{value}</span>
      {note&&<span style={{fontSize:'0.7em',color:'var(--text-dim)',flexShrink:0}}>{note}</span>}
    </div>
  );
}

export default function FrigateWidget({ settings = {}, widgetId }) {
  const [stats,    setStats]    = useState(null);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null); // active camera in single mode
  const [expanded, setExpanded] = useState(false); // fullscreen single cam

  const viewMode     = settings.viewMode || 'single';
  const gridCols     = parseInt(settings.gridCols || '2');
  const refreshSecs  = parseInt(settings.refreshInterval || '5');
  const showEvents   = settings.showEvents !== 'false' && settings.showEvents !== false;
  const showStats    = settings.showStats !== 'false' && settings.showStats !== false;

  const load = useCallback(async () => {
    if (!settings.url) return;
    setLoading(true); setError(null);
    try {
      const [stR, evR] = await Promise.all([
        fetch(`/api/frigate/stats?_widgetId=${widgetId}`),
        fetch(`/api/frigate/events?limit=30&_widgetId=${widgetId}`),
      ]);
      const [st, ev] = await Promise.all([stR.json(), evR.json()]);
      setStats(st);
      setEvents(Array.isArray(ev) ? ev : []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [settings.url, widgetId]);

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  if (!settings.url) return <div className="empty-state">Configure Frigate URL in settings</div>;
  if (loading && !stats) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color: 'var(--red)' }}>{error}</div>;

  const cameras = Object.keys(stats?.cameras || {});
  const activeCamera = selected || cameras[0] || null;

  const snapshotUrl = (cam) => `${settings.url}/api/${cam}/latest.jpg`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>

      {/* ── Stats bar ── */}
      {showStats && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { label: 'Cameras', value: cameras.length, color: 'var(--accent)' },
            { label: 'Events (24h)', value: events.length, color: 'var(--green)' },
            { label: 'Active', value: events.filter(e => !e.end_time).length, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
              <div style={{ fontSize: '0.7em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4em', color: s.color, fontWeight: 700, lineHeight: 1.2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Camera section ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 0 }}>

        {viewMode === 'grid' ? (
          /* ── Grid mode ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 8,
          }}>
            {cameras.map(cam => (
              <CameraSnapshot
                key={cam}
                url={snapshotUrl(cam)}
                name={cam}
                refreshInterval={refreshSecs * 1000}
              />
            ))}
          </div>

        ) : (
          /* ── Single / tabbed mode ── */
          <>
            {/* Camera tabs */}
            {cameras.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {cameras.map(cam => (
                  <button
                    key={cam}
                    onClick={() => setSelected(cam)}
                    className={`btn ${activeCamera === cam ? 'primary' : 'ghost'}`}
                    style={{ fontSize: '0.8em', padding: '4px 12px', textTransform: 'capitalize' }}
                  >
                    {cam}
                  </button>
                ))}
              </div>
            )}

            {/* Main camera view */}
            {activeCamera && (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <CameraSnapshot
                  url={snapshotUrl(activeCamera)}
                  name={activeCamera}
                  refreshInterval={refreshSecs * 1000}
                />
                {/* Expand button */}
                <button
                  onClick={() => setExpanded(true)}
                  style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 4,
                    color: '#fff', cursor: 'pointer', padding: '3px 6px', fontSize: '0.8em',
                  }}
                  title="Expand"
                >⤢</button>
              </div>
            )}
          </>
        )}

        {/* ── Events ── */}
        {showEvents && events.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Recent Events {viewMode === 'single' && activeCamera ? `— ${activeCamera}` : ''}
            </div>
            <EventsList
              events={events}
              cameraFilter={viewMode === 'single' ? activeCamera : null}
            />
          </div>
        )}
      </div>

      {/* ── Expanded / fullscreen overlay ── */}
      {expanded && activeCamera && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: 20,
          }}
        >
          {/* Camera switcher in expanded */}
          {cameras.length > 1 && (
            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              {cameras.map(cam => (
                <button
                  key={cam}
                  onClick={() => setSelected(cam)}
                  className={`btn ${activeCamera === cam ? 'primary' : 'ghost'}`}
                  style={{ fontSize: '0.85em' }}
                >
                  {cam}
                </button>
              ))}
            </div>
          )}
          <div style={{ width: '100%', maxWidth: 1200 }} onClick={e => e.stopPropagation()}>
            <CameraSnapshot
              url={snapshotUrl(activeCamera)}
              name={activeCamera}
              refreshInterval={refreshSecs * 1000}
            />
          </div>
          <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)' }}>Click anywhere to close</div>
        </div>
      )}
    </div>
  );
}
