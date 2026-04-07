import React, { useState, useRef } from 'react';
import { X, Save, Download, Upload, Image, Search } from 'lucide-react';
import { useConfig } from '../App.jsx';
import THEMES from '../themes.js';
import FONT_PAIRS, { FONTS, FONT_CATEGORIES, GRADIENT_PRESETS } from '../fonts.js';

const GROUPED_THEMES = Object.entries(THEMES).reduce((acc, [key, def]) => {
  const cat = def.category || 'Dark';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push([key, def]);
  return acc;
}, {});

const SECTIONS = [
  { key: 'theme',      icon: '🎨', label: 'Theme' },
  { key: 'typography', icon: '🔤', label: 'Fonts' },
  { key: 'appearance', icon: '✨', label: 'Style' },
  { key: 'background', icon: '🖼', label: 'Background' },
  { key: 'backup',     icon: '💾', label: 'Backup' },
];

function SectionHeader({ icon, title, description }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: '1em', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{icon} {title}</div>
      {description && <div style={{ fontSize: '0.78em', color: 'var(--text-dim)', lineHeight: 1.4 }}>{description}</div>}
    </div>
  );
}

function SettingRow({ label, description, children, vertical }) {
  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: vertical ? 6 : 12, alignItems: vertical ? 'stretch' : 'flex-start' }}>
      <div style={{ minWidth: vertical ? undefined : 130, flexShrink: 0 }}>
        <div style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', lineHeight: 1.3 }}>{description}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function ButtonGroup({ options, value, onChange, size = 'normal' }) {
  const pad = size === 'small' ? '3px 6px' : '5px 10px';
  const fs  = size === 'small' ? '0.72em' : '0.8em';
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(([val, label]) => (
        <button key={val}
          className={`btn ${value === val ? 'primary' : 'ghost'}`}
          style={{ fontSize: fs, padding: pad, justifyContent: 'center' }}
          onClick={() => onChange(val)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function DashboardSettingsModal({ onClose }) {
  const { config, saveConfig } = useConfig();
  const [title,      setTitle]      = useState(config.dashboardTitle || 'WarrDash');
  const [theme,      setTheme]      = useState(config.theme      || 'nebula');
  const [font,       setFont]       = useState(config.font       || 'inter');
  const [background, setBackground] = useState(config.background || { type: 'default', value: '' });
  const [appearance, setAppearance] = useState(config.appearance || {});
  const [section,    setSection]    = useState('theme');
  const [importErr,  setImportErr]  = useState(null);
  const [imported,   setImported]   = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const importRef  = useRef(null);
  const imgInputRef = useRef(null);

  const setBg  = patch => setBackground(b => ({ ...b, ...patch }));
  const setApp = patch => setAppearance(a => ({ ...a, ...patch }));

  const handleSave = () => {
    saveConfig({ ...config, dashboardTitle: title, theme, font, background, appearance });
    onClose();
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `warrdash-config-${new Date().toISOString().slice(0,10)}.json` });
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = e => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.pages && !parsed.layout) throw new Error("Doesn't look like a WarrDash config");
        saveConfig(parsed); setImported(true);
        setTimeout(() => { setImported(false); onClose(); }, 1200);
      } catch(err) { setImportErr(err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImageUpload = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBg({ type: 'image', value: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter fonts by search
  const filteredFonts = fontSearch
    ? Object.entries(FONTS).filter(([k, f]) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
    : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="modal-header" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            <span className="modal-title" style={{ marginRight: 8, fontSize: '1em' }}>⚙️ Dashboard Settings</span>
          </div>
          <button className="btn ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Section nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 8px', overflowX: 'auto', flexShrink: 0 }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              style={{
                padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.8em', fontWeight: section === s.key ? 700 : 400,
                color: section === s.key ? 'var(--accent)' : 'var(--text-dim)',
                borderBottom: section === s.key ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ gap: 20 }}>

          {/* Dashboard title — always visible */}
          <div className="input-group">
            <label className="input-label">Dashboard Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="WarrDash" />
          </div>

          {/* ── THEME ── */}
          {section === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionHeader icon="🎨" title="Colour Theme" description="Choose a colour palette for the whole dashboard. Your accent colour overrides can be set in Style." />
              {Object.entries(GROUPED_THEMES).map(([cat, entries]) => (
                <div key={cat}>
                  <div style={{ fontSize: '0.7em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 5 }}>
                    {entries.map(([key, def]) => (
                      <button key={key}
                        className={`btn ${theme === key ? 'primary' : 'ghost'}`}
                        style={{ justifyContent: 'flex-start', fontSize: '0.82em', padding: '6px 10px',
                          borderLeft: `3px solid ${def.vars?.['--accent'] || 'var(--accent)'}` }}
                        onClick={() => setTheme(key)}>
                        {def.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FONTS ── */}
          {section === 'typography' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionHeader icon="🔤" title="Font" description="One font applied everywhere — headings, labels, numbers and UI." />

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input className="input" style={{ paddingLeft: 30 }} placeholder="Search fonts…"
                  value={fontSearch} onChange={e => setFontSearch(e.target.value)} />
              </div>

              {/* Font grid — filtered or by category */}
              {filteredFonts ? (
                <div>
                  {filteredFonts.length === 0
                    ? <div style={{ fontSize: '0.8em', color: 'var(--text-dim)' }}>No fonts matching "{fontSearch}"</div>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {filteredFonts.map(([k, f]) => (
                          <button key={k} className={`btn ${font === k ? 'primary' : 'ghost'}`}
                            style={{ fontSize: '0.83em', padding: '5px 10px', fontFamily: f.family }}
                            onClick={() => setFont(k)}>{f.label}</button>
                        ))}
                      </div>
                  }
                </div>
              ) : (
                Object.entries(FONT_CATEGORIES).map(([cat, keys]) => (
                  <div key={cat}>
                    <div style={{ fontSize: '0.7em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {keys.map(k => (
                        <button key={k} className={`btn ${font === k ? 'primary' : 'ghost'}`}
                          style={{ fontSize: '0.83em', padding: '5px 10px', fontFamily: FONTS[k]?.family }}
                          onClick={() => setFont(k)}>{FONTS[k]?.label}</button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Live preview */}
              <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontFamily: FONTS[font]?.family }}>
                <div style={{ fontSize: '1.3em', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>The quick brown fox</div>
                <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789</div>
                <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', marginTop: 4 }}>Currently: {FONTS[font]?.label}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <SectionHeader icon="📐" title="Sizing" description="Scale up or down to suit your screen and viewing distance." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SettingRow label="Text size" description="Base size for all text in widgets">
                    <ButtonGroup
                      options={[['12','XS'],['13','S'],['14','M'],['15','L'],['16','XL'],['17','2XL'],['18','3XL']]}
                      value={appearance.baseFontSize || '14'}
                      onChange={v => setApp({ baseFontSize: v })} />
                  </SettingRow>
                  <SettingRow label="Grid cards" description="Min width of cards inside widgets (more = fewer columns)">
                    <ButtonGroup
                      options={[['80','XS'],['110','S'],['140','M'],['180','L'],['220','XL'],['280','2XL'],['340','3XL']]}
                      value={appearance.cardMinWidth || '140'}
                      onChange={v => setApp({ cardMinWidth: v })} />
                  </SettingRow>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <SectionHeader icon="🏷" title="Widget Title Style" description="How the label at the top of each widget looks." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 5 }}>SIZE (px)</div>
                    <ButtonGroup size="small"
                      options={['8','9','10','11','12','13','14','16'].map(s=>[s,s])}
                      value={appearance.titleSize || '11'}
                      onChange={v => setApp({ titleSize: v })} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 5 }}>WEIGHT</div>
                    <ButtonGroup size="small"
                      options={[['400','Reg'],['500','Med'],['600','Semi'],['700','Bold'],['800','XB']]}
                      value={appearance.titleWeight || '700'}
                      onChange={v => setApp({ titleWeight: v })} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 5 }}>CASE</div>
                    <ButtonGroup size="small"
                      options={[['uppercase','UPPER'],['capitalize','Title'],['none','none']]}
                      value={appearance.titleCase || 'uppercase'}
                      onChange={v => setApp({ titleCase: v })} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 5 }}>LETTER SPACING</div>
                    <ButtonGroup size="small"
                      options={[['0','None'],['0.06','Sm'],['0.12','Md'],['0.18','Lg'],['0.25','XL']]}
                      value={appearance.titleSpacing || '0.12'}
                      onChange={v => setApp({ titleSpacing: v })} />
                  </div>
                </div>
                {/* Preview */}
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: `${appearance.titleSize || 11}px`, fontWeight: appearance.titleWeight || '700', textTransform: appearance.titleCase || 'uppercase', letterSpacing: `${appearance.titleSpacing || '0.12'}em`, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                    ⊞ Widget Title Preview
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STYLE ── */}
          {section === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Glass mode */}
              <div style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: appearance.glassMode ? 14 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9em', color: 'var(--text)', marginBottom: 2 }}>🪟 Glass Mode</div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-dim)' }}>Frosted glass widgets — set a background image first for best results</div>
                  </div>
                  <button onClick={() => setApp({ glassMode: !appearance.glassMode })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, background: appearance.glassMode ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: appearance.glassMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
                {appearance.glassMode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <SettingRow label="Blur" description="How much the background is blurred through the glass">
                      <ButtonGroup options={[['4','Subtle'],['10','Medium'],['16','Strong'],['24','Max']]} value={appearance.glassBlur || '10'} onChange={v => setApp({ glassBlur: v })} />
                    </SettingRow>
                    <SettingRow label="Opacity" description="How opaque the glass tint is (Ghost = most transparent)">
                      <ButtonGroup options={[['0.04','Ghost'],['0.08','Light'],['0.14','Medium'],['0.22','Solid']]} value={appearance.glassOpacity || '0.08'} onChange={v => setApp({ glassOpacity: v })} />
                    </SettingRow>
                    <SettingRow label="Tint colour" description="The colour cast of the glass panel">
                      <ButtonGroup options={[['white','White'],['dark','Dark'],['accent','Accent'],['none','Clear']]} value={appearance.glassTint || 'white'} onChange={v => setApp({ glassTint: v })} />
                    </SettingRow>
                  </div>
                )}
              </div>

              {/* Viewport scaling */}
              <div style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: appearance.viewportScale ? 14 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9em', color: 'var(--text)', marginBottom: 2 }}>📐 Viewport Scaling</div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-dim)' }}>Scale the whole dashboard to fit any screen size — like a TV display</div>
                  </div>
                  <button onClick={() => setApp({ viewportScale: !appearance.viewportScale })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, background: appearance.viewportScale ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: appearance.viewportScale ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
                {appearance.viewportScale && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <SettingRow label="Design width" description="The resolution you designed your layout for — scales down to fit smaller screens">
                      <ButtonGroup
                        options={[['1280','1280'],['1440','1440'],['1920','1920'],['2560','2560']]}
                        value={appearance.scaleTargetWidth || '1920'}
                        onChange={v => setApp({ scaleTargetWidth: v })} />
                    </SettingRow>
                    <div style={{ marginTop: 10, fontSize: '0.75em', color: 'var(--text-dim)', background: 'var(--bg2)', padding: '8px 10px', borderRadius: 8 }}>
                      💡 Set this to your fullscreen browser width. The dashboard will never scale up, only down.
                    </div>
                  </div>
                )}
              </div>

              {/* Widget shape */}
              <div>
                <SectionHeader icon="🔲" title="Widget Shape" description="Corners and spacing between widgets on the grid." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SettingRow label="Corner radius" description="Rounded corners — None is sharp, Pill is very round">
                    <ButtonGroup options={[['0','None'],['6','Sm'],['10','Md'],['14','Lg'],['20','XL'],['28','Pill']]} value={appearance.widgetRadius || '14'} onChange={v => setApp({ widgetRadius: v })} />
                  </SettingRow>
                  <SettingRow label="Gap between widgets" description="Space between each widget card on the grid">
                    <ButtonGroup options={[['6','XS'],['10','Sm'],['14','Md'],['18','Lg'],['24','XL']]} value={appearance.gridGap || '14'} onChange={v => setApp({ gridGap: v })} />
                  </SettingRow>
                </div>
              </div>

              {/* Accent colours */}
              <div>
                <SectionHeader icon="🎨" title="Accent Colours" description="Override the theme's default accent colours. Used for highlights, buttons and charts." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'accentColor',  label: 'Primary',   default: '#6366f1', swatches: ['#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316','#84cc16'] },
                    { key: 'accentColor2', label: 'Secondary', default: '#a855f7', swatches: ['#a855f7','#c084fc','#e879f9','#f472b6','#fb7185','#34d399','#38bdf8','#fbbf24','#a3e635','#f87171'] },
                  ].map(col => (
                    <div key={col.key}>
                      <div style={{ fontSize: '0.78em', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{col.label}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <input type="color" value={appearance[col.key] || col.default} onChange={e => setApp({ [col.key]: e.target.value })}
                          style={{ width: 40, height: 32, padding: 2, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                        <input className="input" value={appearance[col.key] || ''} placeholder="Theme default" onChange={e => setApp({ [col.key]: e.target.value })}
                          style={{ flex: 1, fontSize: '0.8em', fontFamily: 'monospace' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {col.swatches.map(c => (
                          <div key={c} onClick={() => setApp({ [col.key]: c })} title={c}
                            style={{ width: 18, height: 18, borderRadius: 4, background: c, cursor: 'pointer', border: appearance[col.key] === c ? '2px solid white' : '2px solid transparent', transition: 'transform 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn ghost" style={{ fontSize: '0.75em', marginTop: 10 }} onClick={() => setApp({ accentColor: null, accentColor2: null })}>
                  ↩ Reset to theme defaults
                </button>
              </div>
            </div>
          )}

          {/* ── BACKGROUND ── */}
          {section === 'background' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionHeader icon="🖼" title="Background" description="Set a background for the whole dashboard. For the glass effect, choose Image then enable Glass Mode in Style." />

              <div style={{ display: 'flex', gap: 6 }}>
                {[['default','🎨 Theme'],['gradient','🌈 Gradient'],['image','🖼 Image'],['color','🟦 Colour']].map(([t, l]) => (
                  <button key={t} className={`btn ${background.type === t ? 'primary' : 'ghost'}`}
                    style={{ fontSize: '0.82em', flex: 1, justifyContent: 'center' }}
                    onClick={() => setBg({ type: t })}>{l}</button>
                ))}
              </div>

              {background.type === 'default' && (
                <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.82em', color: 'var(--text-dim)' }}>
                  Using the colour from your selected theme. Switch to Colour to override it.
                </div>
              )}

              {background.type === 'gradient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 5 }}>
                    {GRADIENT_PRESETS.filter(g => g.value).map(g => (
                      <button key={g.value}
                        className={`btn ${background.value === g.value ? 'primary' : 'ghost'}`}
                        style={{ fontSize: '0.75em', padding: '5px 8px', backgroundImage: background.value !== g.value ? g.value : undefined, backgroundSize: 'cover' }}
                        onClick={() => setBg({ value: g.value })}>{g.label}</button>
                    ))}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Custom CSS gradient</label>
                    <input className="input" value={background.value || ''} placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      onChange={e => setBg({ value: e.target.value })} />
                  </div>
                  {background.value && (
                    <div style={{ height: 60, borderRadius: 8, background: background.value, border: '1px solid var(--border)' }} />
                  )}
                </div>
              )}

              {background.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => imgInputRef.current?.click()}>
                      <Image size={14} /> Upload from device
                    </button>
                    <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Or paste an image URL</label>
                    <input className="input" value={background.value?.startsWith('data:') ? '' : (background.value || '')}
                      placeholder="https://unsplash.com/..." onChange={e => setBg({ value: e.target.value })} />
                  </div>
                  {background.value && (
                    <div style={{ height: 140, borderRadius: 10, backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)' }} />
                  )}
                  <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', background: 'var(--surface2)', padding: '8px 10px', borderRadius: 8 }}>
                    💡 After setting an image, go to <strong>Style → Glass Mode</strong> to enable the frosted glass effect
                  </div>
                </div>
              )}

              {background.type === 'color' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={background.value || '#070709'} onChange={e => setBg({ value: e.target.value })}
                      style={{ width: 48, height: 38, padding: 2, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                    <input className="input" value={background.value || ''} placeholder="#070709" onChange={e => setBg({ value: e.target.value })} style={{ flex: 1, fontFamily: 'monospace' }} />
                  </div>
                  {background.value && (
                    <div style={{ height: 60, borderRadius: 8, background: background.value, border: '1px solid var(--border)' }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── BACKUP ── */}
          {section === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionHeader icon="💾" title="Backup & Restore" description="Export your entire dashboard config as a JSON file, or import a previously saved backup." />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={exportConfig}>
                  <Download size={14} /> Export Config
                </button>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => importRef.current?.click()}>
                  <Upload size={14} /> Import Config
                </button>
                <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </div>
              {importErr && <div style={{ color: 'var(--red)', fontSize: '0.83em', padding: '8px 10px', background: 'rgba(252,129,129,0.1)', borderRadius: 8 }}>⚠ {importErr}</div>}
              {imported  && <div style={{ color: 'var(--green)', fontSize: '0.83em', padding: '8px 10px', background: 'rgba(104,211,145,0.1)', borderRadius: 8 }}>✓ Config imported — reloading…</div>}
              <div style={{ fontSize: '0.82em', color: 'var(--text-muted)', lineHeight: 1.7, background: 'var(--surface2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                <strong>Export</strong> saves all pages, widgets, settings, theme and layout to a single JSON file.<br />
                <strong>Import</strong> replaces your entire config — useful for restoring a backup or copying your setup to another device.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSave}><Save size={14} /> Save Changes</button>
        </div>
      </div>
    </div>
  );
}
