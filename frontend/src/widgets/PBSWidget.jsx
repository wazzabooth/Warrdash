import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

function fmt(bytes, dec = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(dec)} ${s[i]}`;
}
function pct(used, total) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}
function fmtDaysUntil(ts) {
  if (!ts) return null;
  const days = Math.round((ts - Date.now()/1000) / 86400);
  if (days < 0) return 'Full';
  if (days < 30) return `${days}d until full`;
  if (days < 365) return `~${Math.round(days/30)}mo until full`;
  return `~${(days/365).toFixed(1)}yr until full`;
}
function loadColor(p) {
  return p > 85 ? 'var(--red)' : p > 65 ? 'var(--amber)' : 'var(--accent)';
}

function Bar({ value, max = 100, color }) {
  const p = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${p}%`, background: color || loadColor(p), borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
  );
}

function StatRow({ label, value, bar, barVal, barMax, color, note }) {
  return (
    <div className="stat-row">
      <span className="stat-row-label">{label}</span>
      {bar && <Bar value={barVal ?? 0} max={barMax ?? 100} color={color} />}
      <span className="stat-row-value" style={color ? { color } : {}}>{value}</span>
      {note && <span className="stat-row-note">{note}</span>}
    </div>
  );
}

function SectionLabel({ title }) {
  return <div className="section-label">{title}</div>;
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`btn ${active ? 'primary' : 'ghost'}`}
      style={{ flex: 1, justifyContent: 'center', fontSize: '0.72em', padding: '3px 4px' }}>
      {label}
    </button>
  );
}

function TaskRow({ task }) {
  const ok = task.status === 'OK';
  const warn = task.status?.startsWith('WARNINGS');
  const color = ok ? 'var(--green)' : warn ? 'var(--amber)' : 'var(--red)';
  const icon = task.worker_type?.includes('backup') ? '💾'
    : task.worker_type?.includes('verify') ? '🔍'
    : task.worker_type?.includes('prune') ? '✂️'
    : task.worker_type?.includes('gc') ? '🗑' : '⚙️';
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85em', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78em', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.worker_id || task.worker_type || 'Task'}
        </div>
        <div style={{ fontSize: '0.7em', color: 'var(--text-dim)' }}>{fmtDate(task.starttime)}</div>
      </div>
      <span style={{ fontSize: '0.72em', fontWeight: 600, color, flexShrink: 0, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>
        {task.status || '…'}
      </span>
    </div>
  );
}


// Uses global .stat-box CSS class (injected by GlassMode)
function StatBox({ children }) {
  return <div className="stat-box">{children}</div>;
}

export default function PBSWidget({ settings = {}, widgetId }) {
  const node = settings.node || 'pbs';
  const [tab,     setTab]    = useState('overview');
  const [usage,   setUsage]  = useState([]);
  const [snaps,   setSnaps]  = useState([]);
  const [tasks,   setTasks]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]  = useState(null);
  const [lastOk,  setLastOk] = useState(null);

  const load = useCallback(async () => {
    if (!settings.url || !settings.tokenId) return;
    setLoading(true); setError(null);
    try {
      const wid = `_widgetId=${widgetId}`;

      // Fetch all in parallel
      const [usageRes, storesRes, tasksRes] = await Promise.allSettled([
        fetch(`/api/pbs/status/datastore-usage?${wid}`).then(r => r.json()),
        fetch(`/api/pbs/admin/datastore?${wid}`).then(r => r.json()),
        fetch(`/api/pbs/nodes/${node}/tasks?limit=25&${wid}`).then(r => r.json()),
      ]);

      // Datastore usage (rich data from status/datastore-usage)
      const usageData = usageRes.status === 'fulfilled' ? (usageRes.value?.data || []) : [];

      // Store names from admin/datastore — merge with usage data
      const storeList = storesRes.status === 'fulfilled' ? (storesRes.value?.data || []) : [];

      // Fetch snapshots per store
      const allSnaps = [];
      for (const store of storeList) {
        try {
          const r = await fetch(`/api/pbs/admin/datastore/${store.store}/snapshots?${wid}`);
          const d = await r.json();
          const storeSnaps = (d.data || []).map(sn => ({ ...sn, storeName: store.store }));
          allSnaps.push(...storeSnaps);
        } catch {}
      }
      allSnaps.sort((a, b) => (b['backup-time'] || 0) - (a['backup-time'] || 0));

      // Merge usage data with store names
      const merged = storeList.map(store => {
        const u = usageData.find(u => u.store === store.store) || usageData[0] || {};
        return { ...store, ...u };
      });
      if (merged.length === 0 && usageData.length > 0) {
        // Usage data has store names too
        setUsage(usageData.map(u => ({ store: u.store || 'PBS', ...u })));
      } else {
        setUsage(merged);
      }

      setSnaps(allSnaps);
      setTasks(tasksRes.status === 'fulfilled' ? (tasksRes.value?.data || []) : []);
      setLastOk(new Date());
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [settings.url, settings.tokenId, widgetId, node]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  if (!settings.url) return <div className="empty-state">Configure PBS URL & API token in settings</div>;
  if (loading && !usage.length && !snaps.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error && !usage.length) return <div className="widget-loading" style={{ color: 'var(--red)', fontSize: '0.85em', flexDirection:'column', gap:4 }}>⚠ {error}</div>;

  const totalUsed  = usage.reduce((a, s) => a + (s.used  || 0), 0);
  const totalAvail = usage.reduce((a, s) => a + (s.avail || 0) + (s.used || 0), 0);
  const snapCount  = snaps.length;
  const okTasks    = tasks.filter(t => t.status === 'OK').length;
  const hasTasks   = tasks.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, flexShrink: 0, marginBottom: 8 }}>
        {[
          { label: 'Stores',    value: usage.length,  color: 'var(--accent)' },
          { label: 'Snapshots', value: snapCount,      color: 'var(--green)' },
          { label: 'Tasks',     value: hasTasks ? `${okTasks}/${tasks.length} OK` : '—',
            color: hasTasks && okTasks < tasks.length ? 'var(--amber)' : 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2em', color: s.color, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginBottom: 8 }}>
        <Tab label="📊 Overview" active={tab==='overview'} onClick={() => setTab('overview')} />
        <Tab label="💾 Stores"   active={tab==='stores'}   onClick={() => setTab('stores')} />
        <Tab label="📋 Tasks"    active={tab==='tasks'}    onClick={() => setTab('tasks')} />
        <Tab label="📸 Snaps"    active={tab==='snaps'}    onClick={() => setTab('snaps')} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <SectionLabel title="Storage" />
            <StatBox>
            {usage.map(s => {
              const used  = s.used  || 0;
              const total = (s.avail || 0) + used;
              const usedPct = pct(used, total);
              const estFull = fmtDaysUntil(s['estimated-full-date']);
              return (
                <div key={s.store} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.82em' }}>💾 {s.store}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{fmt(used, 1)} / {fmt(total, 1)}</span>
                  </div>
                  <Bar value={used} max={total} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>{usedPct}% used · {fmt(s.avail, 1)} free</span>
                    {estFull && <span style={{ color: usedPct > 80 ? 'var(--amber)' : 'var(--text-dim)' }}>{estFull}</span>}
                  </div>
                </div>
              );
            })}
            </StatBox>

            {/* GC status */}
            {usage[0]?.['gc-status'] && (
              <>
                <SectionLabel title="Garbage Collection" />
                <StatRow color='var(--text)' label="Disk data"   value={fmt(usage[0]['gc-status']['disk-bytes'])} />
                <StatRow color='var(--text)' label="Index data"  value={fmt(usage[0]['gc-status']['index-data-bytes'])} />
                <StatRow color='var(--text)' label="Chunks"      value={(usage[0]['gc-status']['disk-chunks'] || 0).toLocaleString()} />
                <StatRow color='var(--text)' label="Pending"     value={fmt(usage[0]['gc-status']['pending-bytes'])} />
                <StatRow color='var(--text)' label="Removed"     value={fmt(usage[0]['gc-status']['removed-bytes'])} />
              </>
            )}

            {/* Recent tasks */}
            {tasks.length > 0 && (
              <>
                <SectionLabel title="Recent Tasks" />
                <StatBox>
                  {tasks.slice(0, 4).map((t, i) => <TaskRow key={i} task={t} />)}
                </StatBox>
              </>
            )}

            {/* Recent snapshots */}
            {snaps.length > 0 && (
              <>
                <SectionLabel title="Latest Snapshots" />
                <StatBox>
                {snaps.slice(0, 4).map((sn, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: '0.78em' }}>
                    <span>{sn['backup-type'] === 'vm' ? '🖥' : sn['backup-type'] === 'ct' ? '📦' : '💾'}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', fontWeight: 600 }}>
                      {sn.comment || `${sn['backup-type']}/${sn['backup-id']}`}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{fmtDate(sn['backup-time'])}</span>
                  </div>
                ))}
                </StatBox>
              </>
            )}
          </>
        )}

        {/* ── STORES ── */}
        {tab === 'stores' && (
          <>
            {usage.length === 0 && <div className="empty-state">No datastores found</div>}
            {usage.map(s => {
              const used  = s.used  || 0;
              const total = (s.avail || 0) + used;
              const usedPct = pct(used, total);
              const storeSnaps = snaps.filter(sn => sn.storeName === s.store);
              const gc = s['gc-status'];
              return (
                <div key={s.store} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.9em', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>💾 {s.store}</div>
                  <Bar value={used} max={total} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: 'var(--text-dim)', marginTop: 3, marginBottom: 8 }}>
                    <span>{fmt(used)} used ({usedPct}%)</span>
                    <span>{fmt(s.avail)} free of {fmt(total)}</span>
                  </div>
                  <StatRow label="Snapshots" value={storeSnaps.length.toString()} />
                  {gc && <StatRow label="Chunks" value={(gc['disk-chunks'] || 0).toLocaleString()} />}
                  {s['estimated-full-date'] && (
                    <StatRow label="Est. Full" value={fmtDate(s['estimated-full-date'])}
                      note={fmtDaysUntil(s['estimated-full-date'])} />
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── TASKS ── */}
        {tab === 'tasks' && (
          <>
            {tasks.length === 0 && (
              <div className="empty-state" style={{ flexDirection: 'column', gap: 6 }}>
                <div>No tasks found</div>
                <div style={{ fontSize: '0.73em', color: 'var(--text-dim)', textAlign: 'center' }}>
                  Tasks require Sys.Audit permission on the PBS node
                </div>
              </div>
            )}
            {tasks.map((t, i) => <TaskRow key={i} task={t} />)}
          </>
        )}

        {/* ── SNAPSHOTS ── */}
        {tab === 'snaps' && (
          <>
            <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 6 }}>
              {snapCount} snapshots across {usage.length} store(s)
            </div>
            {snaps.slice(0, 50).map((sn, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85em', flexShrink: 0 }}>
                  {sn['backup-type'] === 'vm' ? '🖥' : sn['backup-type'] === 'ct' ? '📦' : '💾'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78em', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sn.comment || `${sn['backup-type']}/${sn['backup-id']}`}
                  </div>
                  <div style={{ fontSize: '0.7em', color: 'var(--text-dim)' }}>
                    {sn.storeName} · {fmtDate(sn['backup-time'])}
                  </div>
                </div>
                {sn.size > 0 && (
                  <span style={{ fontSize: '0.72em', color: 'var(--text-dim)', flexShrink: 0 }}>{fmt(sn.size)}</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, paddingTop: 5, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {lastOk && <span style={{ fontSize: '0.68em', color: 'var(--text-dim)' }}>Updated {lastOk.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</span>}
        <button className="btn ghost btn-icon" onClick={load} disabled={loading} style={{ padding: 3, opacity: 0.5 }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>
    </div>
  );
}
