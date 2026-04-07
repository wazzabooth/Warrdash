import React, { useState } from 'react';
import { X, Save, Trash2, Wifi, WifiOff, Copy, ArrowRight } from 'lucide-react';
import WIDGET_REGISTRY from '../widgets/registry.js';
import ServiceListEditor from './ServiceListEditor.jsx';
import ChannelListEditor from './ChannelListEditor.jsx';
import FeedListEditor from './FeedListEditor.jsx';
import ACServerListEditor from './ACServerListEditor.jsx';
import HASensorListEditor from './HASensorListEditor.jsx';
import PackageListEditor from './PackageListEditor.jsx';
import FuelStationsEditor from './FuelStationsEditor.jsx';
import ServiceIconPicker from './ServiceIconPicker.jsx';

// Widget types that have a testable API connection
export default function WidgetSettingsModal({ widget, onSave, onDelete, onClone, onMove, pages = [], currentPageId, onClose }) {
  const def = WIDGET_REGISTRY[widget.type];
  const [settings, setSettings] = useState({ ...(def?.defaultSettings || {}), ...(widget.settings || {}) });
  const [title,    setTitle]    = useState(widget.title || def?.label || '');
  const [textSize, setTextSize] = useState(widget.settings?.textSize || 'medium');
  const [testState, setTestState] = useState(null); // null | 'loading' | { ok, detail }

  const fields = def?.settingsFields || [];
  const canTest = !!(def?.testConnection);

  const set = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
    setTestState(null);
  };

  const handleSave = () => {
    onSave({ ...widget, title, settings: { ...settings, textSize } });
    onClose();
  };

  const testConnection = async () => {
    setTestState('loading');
    try {
      const r = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: widget.type, settings }),
      });
      const data = await r.json();
      setTestState(data);
    } catch (e) {
      setTestState({ ok: false, detail: 'Could not reach WarrDash backend' });
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{def?.icon} {title || def?.label} Settings</span>
          <button className="btn ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Widget title */}
          <div className="input-group">
            <label className="input-label">Widget Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={def?.label} />
          </div>

          {/* Universal: Text Size */}
          <div className="input-group">
            <label className="input-label">Text Size</label>
            <div style={{ display:'flex', gap:6 }}>
              {[['small','Small'],['medium','Medium'],['large','Large'],['xl','XL']].map(([val,label])=>(
                <button
                  key={val}
                  className={`btn ${textSize===val?'primary':'ghost'}`}
                  style={{ flex:1, justifyContent:'center', fontSize:11 }}
                  onClick={()=>setTextSize(val)}
                >{label}</button>
              ))}
            </div>
          </div>

          {fields.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '1em' }}>No settings for this widget.</p>
          )}

          {fields.filter(field => !field.showIf || field.showIf(settings)).map(field => (
            <div key={field.key} className="input-group">
              {field.type !== 'authtoggle' && <label className="input-label">{field.label}</label>}
              {field.hint && field.type !== 'authtoggle' && (
                <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', marginBottom: 4 }}>{field.hint}</div>
              )}

              {field.type === 'textarea' ? (
                <textarea
                  className="input"
                  style={{ resize: 'vertical', minHeight: 80, fontFamily: 'var(--font-ui)' }}
                  value={settings[field.key] !== undefined
                    ? (typeof settings[field.key] === 'object' ? JSON.stringify(settings[field.key], null, 2) : settings[field.key])
                    : ''}
                  onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!settings[field.key]}
                    onChange={e => set(field.key, e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: '1em', color: 'var(--text-muted)' }}>{field.label}</span>
                </label>
              ) : field.type === 'select' ? (
                <select
                  className="input"
                  value={settings[field.key] || ''}
                  onChange={e => set(field.key, e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === 'authtoggle' ? (
                <div>
                  <label className="input-label" style={{ marginBottom: 8, display:'block' }}>{field.label}</label>
                  <div style={{ display:'flex', gap:6, marginBottom: field.hint ? 6 : 0 }}>
                    {[['credentials','🔑 Username & Password'],['apitoken','🔐 API Token']].map(([val, lbl]) => (
                      <button
                        key={val}
                        className={`btn ${(settings[field.key]||'credentials')===val ? 'primary' : 'ghost'}`}
                        style={{ flex:1, justifyContent:'center', fontSize:'0.92em' }}
                        onClick={() => set(field.key, val)}
                      >{lbl}</button>
                    ))}
                  </div>
                  {field.hint && <div style={{ fontSize:'0.75em', color:'var(--text-dim)', marginTop:4 }}>{field.hint}</div>}
                </div>
              ) : field.type === 'packagelist' ? (
                <PackageListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ) : field.type === 'fuelstations' ? (
                <FuelStationsEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ) : field.type === 'feedlist' ? (
                <FeedListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                  urlPlaceholder={field.urlPlaceholder || 'https://...'}
                  namePlaceholder={field.namePlaceholder || 'Feed name'}
                />
              ) : field.type === 'hasensorlist' ? (
                <HASensorListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                  widgetSettings={settings}
                />
              ) : field.type === 'acserverlist' ? (
                <ACServerListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ) : field.type === 'toggle' ? (
                <div style={{ display:'flex', gap:6 }}>
                  {[['true','✓ Enabled'],['false','Disabled']].map(([val, lbl]) => (
                    <button key={val}
                      className={`btn ${String(settings[field.key] ?? 'true') === val ? 'primary' : 'ghost'}`}
                      style={{ flex:1, justifyContent:'center', fontSize:'0.92em' }}
                      onClick={() => set(field.key, val === 'true')}>
                      {lbl}
                    </button>
                  ))}
                </div>
              ) : field.type === 'channellist' ? (
                <ChannelListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ) : field.type === 'servicelist' ? (
                <ServiceListEditor
                  value={settings[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ) : field.type === 'serviceiconsearch' ? (
                <ServiceIconPicker
                  value={settings[field.key] || ''}
                  onChange={v => set(field.key, v)}
                />
              ) : (
                <input
                  className="input"
                  type={field.type || 'text'}
                  value={settings[field.key] || ''}
                  onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  autoComplete="off"
                />
              )}
            </div>
          ))}

          {/* Test Connection */}
          {canTest && (
            <div style={{
              marginTop: 4, padding: '12px 14px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.92em', fontWeight: 600, color: 'var(--text)' }}>Test Connection</div>
                  <div style={{ fontSize: '0.83em', color: 'var(--text-muted)', marginTop: 2 }}>
                    Verify credentials before saving
                  </div>
                </div>
                <button
                  className="btn"
                  onClick={testConnection}
                  disabled={testState === 'loading'}
                  style={{ flexShrink: 0, minWidth: 120, justifyContent: 'center' }}
                >
                  {testState === 'loading' ? (
                    <><div className="spinner" style={{ width: 12, height: 12 }} /> Testing…</>
                  ) : (
                    <><Wifi size={13} /> Test Connection</>
                  )}
                </button>
              </div>
              {testState && testState !== 'loading' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, fontSize: '1em',
                  background: testState.ok ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)',
                  border: `1px solid ${testState.ok ? 'var(--green)' : 'var(--red)'}`,
                  color: testState.ok ? 'var(--green)' : 'var(--red)',
                }}>
                  {testState.ok
                    ? <Wifi size={14} style={{ flexShrink: 0 }} />
                    : <WifiOff size={14} style={{ flexShrink: 0 }} />
                  }
                  <span>{testState.detail}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn danger" onClick={() => { onDelete(widget.id); onClose(); }}>
            <Trash2 size={14} /> Remove
          </button>
          <button className="btn" onClick={() => onClone && onClone(widget)} title="Duplicate widget with all settings">
            <Copy size={14} /> Clone
          </button>
          {pages.filter(p => p.id !== currentPageId).length > 0 && (
            <div style={{ position: 'relative' }} className="move-page-wrap">
              <select
                className="input"
                style={{ fontSize: '0.83em', padding: '5px 10px', cursor: 'pointer', paddingRight: 28 }}
                defaultValue=""
                onChange={e => {
                  if (e.target.value && onMove) onMove(widget, e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="" disabled>↗ Move to…</option>
                {pages.filter(p => p.id !== currentPageId).map(p => (
                  <option key={p.id} value={p.id}>{p.emoji || p.icon || '📄'} {p.label}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSave}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
