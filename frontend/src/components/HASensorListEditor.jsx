import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Search, Loader, Pencil, Check, GripVertical, X } from 'lucide-react';

function parseSensors(val) {
  try { return JSON.parse(val) || []; } catch { return []; }
}

const ICON_GROUPS = {
  'Home':        ['🏠','🏡','🏘','🏗','🏢','🚪','🪟','🛋','🛏','🪑','🛁','🚿','🪠','🧹','🧺','🪣'],
  'Climate':     ['🌡','❄️','🔥','🌬','💨','☀️','🌤','⛅','🌧','🌨','🌩','🌪','🌫','💧','💦','🌊'],
  'Power':       ['⚡','🔌','🔋','🪫','🔦','💡','🕯','🔆','🌑','📡','⚙️','🔧','🔩','🛠','🧲','🔁'],
  'Security':    ['🔒','🔓','🔑','🗝','🔐','🛡','👁','📷','📹','🚨','🔔','🔕','🚫','⛔','🚧','🏴'],
  'Media':       ['🎵','🎶','📻','📺','🎮','🎧','🎤','📢','📣','🎸','🎹','🎻','🥁','🎬','🎙','📱'],
  'Transport':   ['🚗','🚙','🚌','🚎','🚐','🚑','🚒','🏍','🛵','🚲','✈️','🚂','🛳','⛵','🚁','⛽'],
  'Nature':      ['🌿','🌱','🌳','🌲','🍃','🌸','🌺','🌻','🌹','🍀','🌾','🍁','🍄','🌵','🎋','🌍'],
  'People':      ['👤','👥','🏃','🚶','🧑','👶','🐕','🐈','💪','🧘','🛌','🧑‍💻','👨‍🍳','🧹','🎒','🏆'],
  'Food':        ['☕','🍵','🥤','🍺','🍷','🍽','🥘','🍳','🧊','🫙','🧂','🥄','🫖','🧃','🍰','🛒'],
  'Data':        ['📊','📈','📉','📦','📬','🗑','⏱','⏰','🕐','📅','📌','📍','🔴','🟡','🟢','🔵'],
};

const inputStyle = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', padding: '6px 10px',
  fontSize: '0.85em', width: '100%', boxSizing: 'border-box',
};

const DISPLAY_OPTIONS = [
  { value: 'row',  label: '▬ Row',  title: 'Icon · Label · · · Value (single line)' },
  { value: 'card', label: '▪ Card', title: 'Label on top, large value below' },
];

function DisplayToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {DISPLAY_OPTIONS.map(opt => (
        <button key={opt.value} title={opt.title}
          onClick={() => onChange(opt.value)}
          className={`btn ${(value || 'row') === opt.value ? 'primary' : 'ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8em', padding: '4px 8px' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('Home');
  const [custom, setCustom] = useState('');

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Pick icon"
        style={{ ...inputStyle, width: 44, textAlign: 'center', cursor: 'pointer', padding: '5px 4px', fontSize: '1.3em', flexShrink: 0 }}>
        {value === '' ? '∅' : (value || '🔲')}
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 999, top: 48, left: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, width: 290, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {/* Group tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            {Object.keys(ICON_GROUPS).map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                style={{ fontSize: '0.7em', padding: '2px 7px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)',
                  background: activeGroup === g ? 'var(--accent)' : 'var(--surface2)', color: activeGroup === g ? '#fff' : 'var(--text-dim)' }}>
                {g}
              </button>
            ))}
          </div>
          {/* Icons grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {ICON_GROUPS[activeGroup].map(ic => (
              <button key={ic} onClick={() => { onChange(ic); setOpen(false); }}
                style={{ fontSize: '1.25em', padding: '4px 5px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${value === ic ? 'var(--accent)' : 'var(--border)'}`,
                  background: value === ic ? 'var(--accent-glow)' : 'var(--surface2)' }}>
                {ic}
              </button>
            ))}
          </div>
          {/* Custom + no-icon */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input placeholder="Custom emoji…" value={custom} onChange={e => setCustom(e.target.value)}
              style={{ ...inputStyle, flex: 1, fontSize: '0.8em' }} />
            <button className="btn primary btn-icon" title="Use custom" onClick={() => { if (custom) { onChange(custom); setCustom(''); setOpen(false); } }}><Check size={13} /></button>
            <button className="btn ghost btn-icon" title="No icon" onClick={() => { onChange(''); setOpen(false); }} style={{ fontSize: '0.75em', padding: '4px 6px' }}>∅</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SensorRow({ sensor, index, onRemove, onUpdate, onReorder }) {
  const [editing, setEditing] = useState(false);
  const [label,   setLabel]   = useState(sensor.label || '');
  const [icon,    setIcon]    = useState(sensor.icon ?? '');
  const [display, setDisplay] = useState(sensor.display || 'row');
  const dragRef = useRef(null);

  const save = () => { onUpdate(index, { ...sensor, label, icon, display }); setEditing(false); };

  const onDragStart = e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); };
  const onDrop      = e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== index) onReorder(from, index); };
  const onDragOver  = e => e.preventDefault();

  if (editing) return (
    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 10, border: '1px solid var(--accent)', marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.72em', color: 'var(--text-dim)' }}>{sensor.entity_id}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <IconPicker value={icon} onChange={setIcon} />
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Display name" value={label}
          onChange={e => setLabel(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
      </div>
      <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', marginBottom: -2 }}>Display style</div>
      <DisplayToggle value={display} onChange={setDisplay} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85em' }} onClick={save}><Check size={13} /> Save</button>
        <button className="btn ghost btn-icon" onClick={() => setEditing(false)}><X size={13} /></button>
      </div>
    </div>
  );

  return (
    <div ref={dragRef} draggable onDragStart={onDragStart} onDrop={onDrop} onDragOver={onDragOver}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--border)', marginBottom: 4, cursor: 'grab' }}>
      <GripVertical size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
      <span style={{ fontSize: '1.1em', flexShrink: 0, minWidth: 22, textAlign: 'center' }}>{sensor.icon === '' ? '∅' : (sensor.icon || '·')}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85em', color: 'var(--text)', marginBottom: 1 }}>{sensor.label || sensor.entity_id}</div>
        <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sensor.entity_id}</div>
      </div>
      <span style={{ fontSize: '0.7em', color: 'var(--text-dim)', flexShrink: 0, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>
        {sensor.display === 'card' ? '▪ Card' : '▬ Row'}
      </span>
      <button className="btn ghost btn-icon" onClick={() => setEditing(true)}><Pencil size={12} style={{ color: 'var(--text-dim)' }} /></button>
      <button className="btn ghost btn-icon" onClick={() => onRemove(index)}><Trash2 size={12} style={{ color: 'var(--red)' }} /></button>
    </div>
  );
}

export default function HASensorListEditor({ value, onChange, widgetSettings = {} }) {
  const sensors = parseSensors(value);
  const [adding,  setAdding]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [allStates, setAll]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSel]    = useState(null);
  const [custLabel, setLbl]   = useState('');
  const [custIcon,  setIco]   = useState('');
  const [custDisplay, setDisp] = useState('row');

  const fetchStates = useCallback(async () => {
    if (!widgetSettings.url || !widgetSettings.token) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/homeassistant/all-states?url=${encodeURIComponent(widgetSettings.url)}&token=${encodeURIComponent(widgetSettings.token)}`);
      const d = await r.json();
      if (Array.isArray(d)) setAll(d.sort((a, b) => a.entity_id.localeCompare(b.entity_id)));
    } catch {}
    finally { setLoading(false); }
  }, [widgetSettings.url, widgetSettings.token]);

  useEffect(() => { if (adding) fetchStates(); }, [adding]);
  useEffect(() => {
    if (selected) { setLbl(selected.attributes?.friendly_name || selected.entity_id); setIco(''); setDisp('row'); }
  }, [selected]);

  const emit    = arr => onChange(JSON.stringify(arr));
  const remove  = i => emit(sensors.filter((_, idx) => idx !== i));
  const update  = (i, s) => emit(sensors.map((x, idx) => idx === i ? s : x));
  const reorder = (from, to) => {
    const arr = [...sensors]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); emit(arr);
  };
  const add = () => {
    if (!selected) return;
    emit([...sensors, { entity_id: selected.entity_id, label: custLabel || selected.attributes?.friendly_name || selected.entity_id, icon: custIcon, display: custDisplay }]);
    setSel(null); setLbl(''); setIco(''); setDisp('row'); setSearch('');
    if (sensors.length >= 11) setAdding(false);
  };

  const filtered = allStates.filter(s =>
    s.entity_id.toLowerCase().includes(search.toLowerCase()) ||
    (s.attributes?.friendly_name || '').toLowerCase().includes(search.toLowerCase())
  ).slice(0, 80);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {sensors.map((s, i) => (
        <SensorRow key={i} sensor={s} index={i} onRemove={remove} onUpdate={update} onReorder={reorder} />
      ))}

      {sensors.length < 12 && (
        adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', marginTop: 4 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input style={{ ...inputStyle, paddingLeft: 26 }} placeholder="Search entities…" value={search}
                onChange={e => { setSearch(e.target.value); setSel(null); }} autoFocus />
            </div>

            {/* Entity list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-dim)', fontSize: '0.8em' }}><Loader size={12} /> Loading…</div>
            ) : (
              <div style={{ maxHeight: selected ? 110 : 190, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, transition: 'max-height 0.2s' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 8, fontSize: '0.8em', color: 'var(--text-dim)', textAlign: 'center' }}>
                    {widgetSettings.url ? 'No entities found' : 'Save HA URL & token first, then re-open settings'}
                  </div>
                ) : filtered.map(s => (
                  <div key={s.entity_id} onClick={() => setSel(s)} style={{
                    padding: '6px 10px', cursor: 'pointer', fontSize: '0.8em',
                    background: selected?.entity_id === s.entity_id ? 'var(--accent-glow)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: selected?.entity_id === s.entity_id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                    <div style={{ color: 'var(--text)', fontWeight: 500 }}>{s.attributes?.friendly_name || s.entity_id}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.88em' }}>
                      {s.entity_id} · <span style={{ color: 'var(--accent)' }}>{s.state}{s.attributes?.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customise panel — appears on selection */}
            {selected && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.75em', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Customise — {selected.attributes?.friendly_name || selected.entity_id}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <IconPicker value={custIcon} onChange={setIco} />
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Display name"
                    value={custLabel} onChange={e => setLbl(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                </div>
                <div style={{ fontSize: '0.75em', color: 'var(--text-dim)' }}>Display style</div>
                <DisplayToggle value={custDisplay} onChange={setDisp} />
                <button className="btn primary" style={{ justifyContent: 'center', fontSize: '0.85em' }} onClick={add}>
                  ＋ Add Sensor
                </button>
              </div>
            )}

            <button className="btn ghost" style={{ justifyContent: 'center', fontSize: '0.75em', color: 'var(--text-dim)' }}
              onClick={() => { setAdding(false); setSearch(''); setSel(null); setLbl(''); setIco(''); setDisp('row'); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn ghost" style={{ justifyContent: 'center', gap: 6, fontSize: '0.85em', marginTop: 4 }} onClick={() => setAdding(true)}>
            <Plus size={13} /> Add Sensor ({sensors.length}/12)
          </button>
        )
      )}
      {sensors.length > 1 && (
        <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', textAlign: 'center', marginTop: 2 }}>Drag ⠿ to reorder</div>
      )}
    </div>
  );
}
