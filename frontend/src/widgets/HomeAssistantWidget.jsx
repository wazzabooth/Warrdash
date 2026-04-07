import React, { useState, useEffect, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function stateColor(state) {
  if (['on','home','playing','open','true','unlocked','heating','cooling','auto'].includes(state?.toLowerCase())) return 'var(--green)';
  if (['off','away','idle','closed','false','locked'].includes(state?.toLowerCase())) return 'var(--text-dim)';
  if (['unavailable','unknown'].includes(state?.toLowerCase())) return 'var(--red)';
  return 'var(--accent)';
}
function defaultIcon(id = '') {
  const icons = { light:'💡', switch:'🔌', sensor:'🌡', binary_sensor:'⚡', media_player:'🎵', climate:'🌀', cover:'🪟', lock:'🔒', camera:'📷', person:'👤', device_tracker:'📍', automation:'⚙️', fan:'🌬', vacuum:'🤖', weather:'🌤', input_boolean:'🔘', input_number:'🔢', input_select:'📋' };
  return icons[id.split('.')[0]] || '🏠';
}
function formatState(e) {
  if (e.attributes?.unit_of_measurement) return `${e.state} ${e.attributes.unit_of_measurement}`;
  if (e.state === 'unavailable') return '—';
  return e.state;
}
// cfg.icon === '' means "no icon"; undefined/null means use default
function resolveIcon(cfg, entityId) {
  if (cfg.icon === '') return null;
  return cfg.icon || defaultIcon(entityId);
}

// ── HA service call ───────────────────────────────────────────────────────────
async function callService(widgetId, domain, service, data) {
  return fetch(`/api/homeassistant/service?_widgetId=${widgetId}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, service, data }),
  });
}

// ── Control panels ────────────────────────────────────────────────────────────
function LightControls({ entity, widgetId, onRefresh }) {
  const attrs = entity.attributes || {};
  const isOn  = entity.state === 'on';
  const brightness = attrs.brightness ? Math.round(attrs.brightness / 2.55) : 0;
  const color = attrs.rgb_color ? `rgb(${attrs.rgb_color.join(',')})` : null;
  const supportsColor = attrs.supported_color_modes?.some(m => ['rgb','hs','xy','color_temp'].includes(m));
  const supportsColorTemp = attrs.color_temp != null;
  const supportsBrightness = attrs.supported_color_modes?.some(m => m !== 'onoff') || attrs.brightness != null;
  const toggle = async () => { await callService(widgetId, 'light', isOn ? 'turn_off' : 'turn_on', { entity_id: entity.entity_id }); setTimeout(onRefresh, 400); };
  const setBrightness = async val => { await callService(widgetId, 'light', 'turn_on', { entity_id: entity.entity_id, brightness: Math.round(val * 2.55) }); setTimeout(onRefresh, 400); };
  const setColorTemp  = async val => { await callService(widgetId, 'light', 'turn_on', { entity_id: entity.entity_id, color_temp: parseInt(val) }); setTimeout(onRefresh, 400); };
  const setRgb = async hex => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    await callService(widgetId, 'light', 'turn_on', { entity_id: entity.entity_id, rgb_color: [r,g,b] }); setTimeout(onRefresh, 600);
  };
  const hexFromRgb = rgb => rgb ? '#' + rgb.map(v => v.toString(16).padStart(2,'0')).join('') : '#ffffff';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'10px 0 4px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Power</span>
        <button onClick={toggle} className={`btn ${isOn?'primary':'ghost'}`} style={{ fontSize:'0.8em', padding:'4px 14px' }}>{isOn?'● ON':'○ OFF'}</button>
      </div>
      {isOn && supportsBrightness && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Brightness</span>
          <input type="range" min={1} max={100} defaultValue={brightness} style={{ flex:1, accentColor:'var(--accent)' }} onMouseUp={e=>setBrightness(e.target.value)} onTouchEnd={e=>setBrightness(e.target.value)} />
          <span style={{ fontSize:'0.8em', color:'var(--accent)', width:30, textAlign:'right' }}>{brightness}%</span>
        </div>
      )}
      {isOn && supportsColor && attrs.rgb_color && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Colour</span>
          <input type="color" defaultValue={hexFromRgb(attrs.rgb_color)} style={{ width:40, height:28, padding:2, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer' }} onBlur={e=>setRgb(e.target.value)} />
          <div style={{ width:20, height:20, borderRadius:'50%', background:color, border:'1px solid var(--border)', flexShrink:0 }} />
        </div>
      )}
      {isOn && supportsColorTemp && attrs.color_temp != null && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Warmth</span>
          <input type="range" min={attrs.min_color_temp_kelvin||2700} max={attrs.max_color_temp_kelvin||6500} step={100} defaultValue={attrs.color_temp_kelvin||4000} style={{ flex:1, accentColor:'var(--amber)' }} onMouseUp={e=>setColorTemp(e.target.value)} onTouchEnd={e=>setColorTemp(e.target.value)} />
          <span style={{ fontSize:'0.75em', color:'var(--amber)', width:36, textAlign:'right' }}>{attrs.color_temp_kelvin||'—'}K</span>
        </div>
      )}
    </div>
  );
}

function ClimateControls({ entity, widgetId, onRefresh }) {
  const attrs = entity.attributes || {};
  const temp = attrs.temperature, current = attrs.current_temperature, modes = attrs.hvac_modes || [], currentMode = entity.state;
  const setTemp = async delta => { await callService(widgetId,'climate','set_temperature',{entity_id:entity.entity_id,temperature:(temp||20)+delta}); setTimeout(onRefresh,400); };
  const setMode = async mode  => { await callService(widgetId,'climate','set_hvac_mode',{entity_id:entity.entity_id,hvac_mode:mode}); setTimeout(onRefresh,400); };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'10px 0 4px' }}>
      {current!=null && <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Current</span><span style={{ fontFamily:'var(--font-display)', fontSize:'1.3em', color:'var(--accent)', fontWeight:700 }}>{current}°</span></div>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Target</span>
        <button className="btn ghost btn-icon" onClick={()=>setTemp(-0.5)} style={{ padding:'3px 10px' }}>−</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.3em', color:'var(--text)', fontWeight:700, minWidth:48, textAlign:'center' }}>{temp??'—'}°</span>
        <button className="btn ghost btn-icon" onClick={()=>setTemp(0.5)} style={{ padding:'3px 10px' }}>+</button>
      </div>
      {modes.length>0 && <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}><span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Mode</span>{modes.map(m=><button key={m} onClick={()=>setMode(m)} className={`btn ${currentMode===m?'primary':'ghost'}`} style={{ fontSize:'0.75em', padding:'3px 8px', textTransform:'capitalize' }}>{m}</button>)}</div>}
    </div>
  );
}

function CoverControls({ entity, widgetId, onRefresh }) {
  const call = async svc => { await callService(widgetId,'cover',svc,{entity_id:entity.entity_id}); setTimeout(onRefresh,400); };
  const pos = entity.attributes?.current_position;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'10px 0 4px' }}>
      <div style={{ display:'flex', gap:8 }}>
        {[['open_cover','▲ Open'],['stop_cover','■ Stop'],['close_cover','▼ Close']].map(([svc,lbl])=>(
          <button key={svc} className="btn ghost" style={{ flex:1, justifyContent:'center', fontSize:'0.8em' }} onClick={()=>call(svc)}>{lbl}</button>
        ))}
      </div>
      {pos!=null && <div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Position</span><input type="range" min={0} max={100} defaultValue={pos} style={{ flex:1, accentColor:'var(--accent)' }} onMouseUp={async e=>{await callService(widgetId,'cover','set_cover_position',{entity_id:entity.entity_id,position:parseInt(e.target.value)});setTimeout(onRefresh,400);}} /><span style={{ fontSize:'0.8em', color:'var(--accent)', width:30, textAlign:'right' }}>{pos}%</span></div>}
    </div>
  );
}

function MediaControls({ entity, widgetId, onRefresh }) {
  const attrs = entity.attributes || {}, isPlaying = entity.state==='playing', vol = attrs.volume_level!=null ? Math.round(attrs.volume_level*100) : null;
  const call = async (svc, data={}) => { await callService(widgetId,'media_player',svc,{entity_id:entity.entity_id,...data}); setTimeout(onRefresh,400); };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'10px 0 4px' }}>
      {attrs.media_title && <div style={{ fontSize:'0.82em', color:'var(--text)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🎵 {attrs.media_title}{attrs.media_artist?` — ${attrs.media_artist}`:''}</div>}
      <div style={{ display:'flex', gap:6 }}>
        {[['media_previous_track','⏮'],['media_play_pause',isPlaying?'⏸':'▶'],['media_next_track','⏭'],['media_stop','⏹']].map(([svc,lbl])=>(
          <button key={svc} className={`btn ${svc==='media_play_pause'&&isPlaying?'primary':'ghost'}`} style={{ flex:1, justifyContent:'center', fontSize:'1em' }} onClick={()=>call(svc)}>{lbl}</button>
        ))}
      </div>
      {vol!=null && <div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:'0.8em', color:'var(--text-dim)', width:70 }}>Volume</span><input type="range" min={0} max={100} defaultValue={vol} style={{ flex:1, accentColor:'var(--accent)' }} onMouseUp={e=>call('volume_set',{volume_level:e.target.value/100})} /><span style={{ fontSize:'0.8em', color:'var(--accent)', width:30, textAlign:'right' }}>{vol}%</span></div>}
    </div>
  );
}

function AttributesReadOnly({ entity }) {
  const attrs = entity.attributes || {};
  const skip  = ['friendly_name','icon','entity_picture','supported_features','supported_color_modes','attribution'];
  const rows  = Object.entries(attrs).filter(([k]) => !skip.includes(k));
  if (!rows.length) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, padding:'8px 0 4px' }}>
      {rows.slice(0,8).map(([k,v]) => (
        <div key={k} style={{ display:'flex', gap:8, fontSize:'0.78em' }}>
          <span style={{ color:'var(--text-dim)', width:110, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</span>
          <span style={{ color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ isOn, onClick }) {
  return (
    <button onClick={onClick} style={{ width:36, height:20, borderRadius:10, border:'none', cursor:'pointer', flexShrink:0, background:isOn?'var(--green)':'var(--border)', position:'relative', transition:'background 0.2s' }}>
      <div style={{ position:'absolute', top:2, left:isOn?18:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

// ── Entity card ───────────────────────────────────────────────────────────────
const CONTROLLABLE = new Set(['light','switch','input_boolean','fan','automation','climate','cover','media_player','lock','input_number','input_select']);

function EntityCard({ entity, cfg, widgetId, onRefresh, compact, showDivider }) {
  const [expanded, setExpanded] = useState(false);
  const domain     = entity.entity_id.split('.')[0];
  const icon       = resolveIcon(cfg, entity.entity_id);
  const label      = cfg.label || entity.attributes?.friendly_name || entity.entity_id;
  const color      = stateColor(entity.state);
  const canControl = CONTROLLABLE.has(domain);
  const isToggle   = ['switch','input_boolean','fan','automation','light'].includes(domain);
  const isCard     = cfg.display === 'card';

  const toggle = async e => {
    e.stopPropagation();
    if (!isToggle) return;
    await callService(widgetId, domain, entity.state==='on'?'turn_off':'turn_on', { entity_id: entity.entity_id });
    setTimeout(onRefresh, 400);
  };

  const controls = () => {
    if (domain==='light')        return <LightControls entity={entity} widgetId={widgetId} onRefresh={onRefresh} />;
    if (domain==='climate')      return <ClimateControls entity={entity} widgetId={widgetId} onRefresh={onRefresh} />;
    if (domain==='cover')        return <CoverControls entity={entity} widgetId={widgetId} onRefresh={onRefresh} />;
    if (domain==='media_player') return <MediaControls entity={entity} widgetId={widgetId} onRefresh={onRefresh} />;
    return <AttributesReadOnly entity={entity} />;
  };

  // ── Card (stacked) display ──
  if (isCard) {
    return (
      <div style={{ borderBottom: showDivider ? '1px solid var(--border)' : 'none' }}>
        <div onClick={() => canControl && setExpanded(e => !e)}
          style={{ display:'flex', flexDirection:'column', padding: compact ? '0.4em 0.4em' : '0.65em 0.4em', cursor: canControl?'pointer':'default', borderRadius:6, transition:'background 0.1s', gap: '0.2em' }}
          onMouseEnter={canControl ? e => e.currentTarget.style.background='var(--surface2)' : undefined}
          onMouseLeave={canControl ? e => e.currentTarget.style.background='transparent' : undefined}>
          {/* Top row: icon + label + toggle/chevron */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5em' }}>
            {icon && <span style={{ fontSize: compact?'0.95em':'1.05em', flexShrink:0 }}>{icon}</span>}
            <span style={{ flex:1, fontSize: compact?'0.78em':'0.84em', color:'var(--text-dim)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
            {isToggle
              ? <ToggleSwitch isOn={entity.state==='on'} onClick={toggle} />
              : canControl && <span style={{ color:'var(--text-dim)', fontSize:10 }}>{expanded?'▲':'▼'}</span>
            }
          </div>
          {/* Big value row */}
          {!isToggle && (
            <div style={{ fontSize: compact?'1.3em':'1.6em', fontWeight:700, color, fontFamily:'var(--font-display)', lineHeight:1.1, paddingLeft: icon ? '1.6em' : 0 }}>
              {formatState(entity)}
            </div>
          )}
        </div>
        {expanded && canControl && (
          <div style={{ padding:'0 12px 10px', borderTop:'1px solid var(--border)', background:'var(--bg2)', borderRadius:'0 0 8px 8px' }}>
            {controls()}
          </div>
        )}
      </div>
    );
  }

  // ── Row (default) display ──
  return (
    <div style={{ borderBottom: showDivider ? '1px solid var(--border)' : 'none' }}>
      <div onClick={() => canControl && setExpanded(e => !e)}
        style={{ display:'flex', alignItems:'center', gap:'0.75em', padding: compact?'0.3em 0.4em':'0.55em 0.4em', cursor: canControl?'pointer':'default', borderRadius:6, transition:'background 0.1s' }}
        onMouseEnter={canControl ? e => e.currentTarget.style.background='var(--surface2)' : undefined}
        onMouseLeave={canControl ? e => e.currentTarget.style.background='transparent' : undefined}>
        {icon && <span style={{ fontSize: compact?'1em':'1.15em', width:'1.4em', textAlign:'center', flexShrink:0 }}>{icon}</span>}
        <span style={{ flex:1, fontSize: compact?'0.82em':'0.92em', color:'var(--text)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          paddingLeft: !icon ? '0.2em' : 0 }}>{label}</span>
        {isToggle
          ? <ToggleSwitch isOn={entity.state==='on'} onClick={toggle} />
          : <span style={{ fontSize:'0.9em', fontWeight:600, color, flexShrink:0, fontFamily:'var(--font-display)' }}>{formatState(entity)}</span>
        }
        {canControl && <span style={{ color:'var(--text-dim)', flexShrink:0, fontSize:10 }}>{expanded?'▲':'▼'}</span>}
      </div>
      {expanded && canControl && (
        <div style={{ padding:'0 12px 10px', borderTop:'1px solid var(--border)', background:'var(--bg2)', borderRadius:'0 0 8px 8px' }}>
          {controls()}
        </div>
      )}
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

export default function HomeAssistantWidget({ settings = {}, widgetId }) {
  const { sensorsJson } = settings || {};

  let sensorConfigs = [];
  try {
    if (sensorsJson) sensorConfigs = JSON.parse(sensorsJson) || [];
    else if (settings?.entities) sensorConfigs = settings.entities.split(',').map(s => ({ entity_id: s.trim() })).filter(s => s.entity_id);
  } catch {}
  if (!Array.isArray(sensorConfigs)) sensorConfigs = [];

  const entityIds = sensorConfigs.map(s => s?.entity_id).filter(Boolean);
  const configMap = {};
  sensorConfigs.forEach(s => { if (s?.entity_id) configMap[s.entity_id] = s; });

  const [entities, setEntities] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!settings?.url || !settings?.token) return;
    setLoading(true); setError(null);
    try {
      const param = entityIds.length ? `&entities=${entityIds.join(',')}` : '';
      const r     = await fetch(`/api/homeassistant/states?_widgetId=${widgetId}${param}`);
      const data  = await r.json();
      if (data.error) throw new Error(data.error);
      const arr   = Array.isArray(data) ? data : [];
      if (entityIds.length) {
        const map = Object.fromEntries(arr.map(e => [e.entity_id, e]));
        setEntities(entityIds.map(id => map[id]).filter(Boolean));
      } else {
        setEntities(arr.slice(0, 40));
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [settings?.url, settings?.token, settings?.entities, sensorsJson, widgetId]);

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);

  if (!settings?.url) return <div className="empty-state">Configure HA URL & long-lived token in settings</div>;
  if (loading && !entities.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color:'var(--red)' }}>{error}</div>;
  if (!entities.length) return <div className="empty-state">No sensors — add some in settings</div>;

  const layoutSetting = settings.layout || 'list';
  const cols     = layoutSetting==='3 columns' ? 3 : layoutSetting==='2 columns' ? 2 : 1;
  const multiCol = cols > 1;
  const compact  = settings.compact==='true' || settings.compact===true;
  const showDivider = settings.showDividers!=='false' && settings.showDividers!==false;

  return (
    <div style={{
      height:'100%', overflowY:'auto',
      display: multiCol ? 'grid' : 'block',
      gridTemplateColumns: multiCol ? `repeat(${cols}, 1fr)` : undefined,
      gap: multiCol ? 6 : undefined,
      alignContent: 'start',
      padding: multiCol ? 4 : 0,
    }}>
      {entities.map(e => (
        <EntityCard key={e.entity_id} entity={e} cfg={configMap[e.entity_id] || {}}
          widgetId={widgetId} onRefresh={load} compact={compact} showDivider={showDivider} />
      ))}
    </div>
  );
}
