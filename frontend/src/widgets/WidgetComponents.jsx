/**
 * WarrDash Shared Widget Components
 * Import from this file for consistent styling across all widgets.
 *
 * Usage:
 *   import { StatBox, StatRow, SectionLabel, ProgressBar } from '../components/WidgetComponents.jsx';
 *
 * Pattern:
 *   <SectionLabel title="CPU" />
 *   <StatBox>
 *     <StatRow label="Load" value="45%" bar barVal={45} />
 *     <StatRow label="Temp" value="62°C" bar barVal={62} barMax={100} barColor="var(--amber)" />
 *   </StatBox>
 */

import React from 'react';

// ── Bar ───────────────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const auto = pct > 85 ? 'var(--red)' : pct > 65 ? 'var(--amber)' : 'var(--accent)';
  return (
    <div className="stat-row-bar" style={{ flex: 1 }}>
      <div className="stat-row-bar-fill" style={{ width: `${pct}%`, background: color || auto }} />
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ title }) {
  return <div className="section-label">{title}</div>;
}

// ── Stat box ──────────────────────────────────────────────────────────────────
// Wraps a group of StatRows in a subtle surface2 box
export function StatBox({ children, style }) {
  return <div className="stat-box" style={style}>{children}</div>;
}

// ── Stat row ──────────────────────────────────────────────────────────────────
// label | [bar] | value [note]
export function StatRow({ label, value, bar, barVal, barMax = 100, barColor, note, color, icon }) {
  return (
    <div className="stat-row">
      {icon && <span style={{ fontSize: '0.9em', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>}
      <span className="stat-row-label">{label}</span>
      {bar && <ProgressBar value={barVal ?? 0} max={barMax} color={barColor} />}
      <span className="stat-row-value" style={color ? { color } : {}}>{value}</span>
      {note && <span className="stat-row-note">{note}</span>}
    </div>
  );
}

// ── Summary tiles row ─────────────────────────────────────────────────────────
// The 2-3 number tiles shown at the top of widgets
export function SummaryTiles({ tiles }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 6, marginBottom: 8 }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3em', color: t.color || 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{t.value}</div>
          {t.sub && <div style={{ fontSize: '0.65em', color: 'var(--text-dim)', marginTop: 1 }}>{t.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`btn ${active === t.key ? 'primary' : 'ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.75em', padding: '3px 4px' }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Widget loading / error states ─────────────────────────────────────────────
export function WidgetLoading() {
  return <div className="widget-loading"><div className="spinner" /></div>;
}

export function WidgetError({ message, sub }) {
  return (
    <div className="widget-loading" style={{ flexDirection: 'column', gap: 6 }}>
      <span style={{ color: 'var(--red)', fontSize: '0.85em' }}>⚠ {message}</span>
      {sub && <span style={{ color: 'var(--text-dim)', fontSize: '0.72em' }}>{sub}</span>}
    </div>
  );
}
