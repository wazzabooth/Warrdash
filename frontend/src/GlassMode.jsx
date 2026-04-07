import { useEffect } from 'react';
import { useConfig } from './App.jsx';

// ── Always-on global utility CSS ─────────────────────────────────────────────
// Injected once on mount regardless of glass mode setting
const UTIL_CSS = `
  /* WarrDash stat-box — wraps groups of metric rows */
  .stat-box {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
  }
  .stat-box > .stat-row + .stat-row {
    border-top: 1px solid var(--border);
  }
  /* WarrDash stat-row — label / bar / value row inside a stat-box */
  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    min-height: 26px;
  }
  .stat-row-label {
    font-size: 0.75em;
    color: var(--text-muted);
    flex-shrink: 0;
    width: 90px;
  }
  .stat-row-bar {
    flex: 1;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .stat-row-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }
  .stat-row-value {
    font-size: 0.82em;
    font-weight: 600;
    color: var(--text);
    flex-shrink: 0;
    min-width: 54px;
    text-align: right;
  }
  .stat-row-note {
    font-size: 0.7em;
    color: var(--text-dim);
    flex-shrink: 0;
  }
  /* WarrDash section-label — uppercase header above a stat-box */
  .section-label {
    font-size: 0.68em;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 700;
    margin-top: 8px;
    margin-bottom: 4px;
    padding-left: 2px;
  }
  .section-label:first-child {
    margin-top: 0;
  }
`;

// Inject utility CSS at module load time — runs before any component renders
if (typeof document !== 'undefined' && !document.getElementById('warrdash-util')) {
  const s = document.createElement('style');
  s.id = 'warrdash-util';
  s.textContent = UTIL_CSS;
  document.head.appendChild(s);
}

export default function GlassMode() {
  const { config } = useConfig();
  const appearance = config?.appearance || {};

  // Glass mode CSS
  useEffect(() => {
    const existing = document.getElementById('warrdash-glass');
    if (existing) existing.remove();

    if (!appearance.glassMode) {
      document.body.classList.remove('glass-mode');
      return;
    }

    const blur    = appearance.glassBlur    || '10';
    const opacity = appearance.glassOpacity || '0.08';
    const tint    = appearance.glassTint    || 'white';

    const tintColor =
      tint === 'white'  ? `rgba(255,255,255,${opacity})` :
      tint === 'dark'   ? `rgba(0,0,0,${parseFloat(opacity) * 2})` :
      tint === 'accent' ? `color-mix(in srgb, var(--accent) ${Math.round(parseFloat(opacity) * 100)}%, transparent)` :
      `rgba(255,255,255,0)`;

    const borderColor = tint === 'dark' ? `rgba(255,255,255,0.1)` : `rgba(255,255,255,0.18)`;

    const css = `
      .glass-mode .widget-card {
        background: ${tintColor} !important;
        backdrop-filter: blur(${blur}px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(${blur}px) saturate(180%) !important;
        border: 1px solid ${borderColor} !important;
        box-shadow: 0 4px 32px rgba(0,0,0,0.18), 0 1.5px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.08) inset !important;
      }
      .glass-mode .widget-card:hover {
        border-color: rgba(255,255,255,0.28) !important;
        box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 1.5px 0 rgba(255,255,255,0.16) inset !important;
      }
      .glass-mode .widget-header {
        border-bottom-color: rgba(255,255,255,0.1) !important;
        background: rgba(255,255,255,0.04) !important;
      }
      .glass-mode .topbar {
        background: ${tintColor} !important;
        backdrop-filter: blur(${Math.max(parseInt(blur)*2,20)}px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(${Math.max(parseInt(blur)*2,20)}px) saturate(200%) !important;
        border-bottom-color: ${borderColor} !important;
      }
      .glass-mode .widget-title { color: rgba(255,255,255,0.75) !important; }
      .glass-mode .stat-box {
        background: rgba(255,255,255,0.05) !important;
        border-color: rgba(255,255,255,0.1) !important;
      }
      .glass-mode .btn {
        background: rgba(255,255,255,0.08) !important;
        border-color: rgba(255,255,255,0.14) !important;
        color: rgba(255,255,255,0.9) !important;
      }
      .glass-mode .btn:hover {
        background: rgba(255,255,255,0.16) !important;
        border-color: rgba(255,255,255,0.24) !important;
      }
      .glass-mode .btn.primary {
        background: var(--accent) !important;
        border-color: var(--accent) !important;
        color: #fff !important;
      }
      .glass-mode .input {
        background: rgba(255,255,255,0.08) !important;
        border-color: rgba(255,255,255,0.14) !important;
        color: rgba(255,255,255,0.95) !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'warrdash-glass';
    style.textContent = css;
    document.head.appendChild(style);
    document.body.classList.add('glass-mode');

    return () => {
      document.getElementById('warrdash-glass')?.remove();
      document.body.classList.remove('glass-mode');
    };
  }, [appearance.glassMode, appearance.glassBlur, appearance.glassOpacity, appearance.glassTint]);

  return null;
}
