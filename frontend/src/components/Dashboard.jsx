import React, { useState, useCallback, useRef, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import { Plus, Settings, LayoutDashboard, GripVertical, X, Pencil, Lock, Unlock, ChevronDown } from 'lucide-react';
import { useConfig } from '../App.jsx';
import THEMES from '../themes.js';
import WIDGET_REGISTRY from '../widgets/registry.js';
import WidgetSettingsModal from './WidgetSettingsModal.jsx';
import AddWidgetPanel from './AddWidgetPanel.jsx';
import DashboardSettingsModal from './DashboardSettingsModal.jsx';
import IconPickerModal from './IconPickerModal.jsx';
import GlassMode from '../GlassMode.jsx';
import ViewportScale from '../ViewportScale.jsx';

// ── Status dot — pings serviceUrl every 60s ──────────────────────────────────
function useServicePing(serviceUrl) {
  const [status, setStatus] = React.useState(null);
  React.useEffect(() => {
    if (!serviceUrl) return;
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch(`/api/ping?url=${encodeURIComponent(serviceUrl)}`);
        const d = await r.json();
        if (!cancelled) setStatus(d.ok);
      } catch { if (!cancelled) setStatus(false); }
    };
    check();
    const id = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [serviceUrl]);
  return status;
}

function StatusDot({ status }) {
  if (status === null) return null;
  return (
    <div title={status ? 'Online' : 'Offline'} style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      background: status ? 'var(--green)' : 'var(--red)',
      boxShadow: status ? '0 0 4px var(--green)' : '0 0 4px var(--red)',
      animation: status ? 'pulse 2s infinite' : 'none',
    }} />
  );
}

function ServiceIcon({ def, serviceUrl, widgetIcon, widgetIconUrl }) {
  const [err, setErr] = React.useState(false);
  let icon;
  if (widgetIconUrl) {
    icon = <img src={widgetIconUrl} alt={def.label} style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3 }} onError={e => { e.target.style.display = 'none'; }} />;
  } else if (widgetIcon) {
    icon = <span style={{ fontSize: 14, lineHeight: 1 }}>{widgetIcon}</span>;
  } else if (!def.iconUrl || err) {
    icon = <span style={{ fontSize: 14, lineHeight: 1 }}>{def.icon}</span>;
  } else {
    icon = <img src={def.iconUrl} alt={def.label} style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3 }} onError={() => setErr(true)} />;
  }
  if (serviceUrl) {
    return (
      <a href={serviceUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} title={`Open ${def.label}`}
        style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.8, transition: 'opacity 0.15s, transform 0.15s', textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity='0.8'; e.currentTarget.style.transform='scale(1)'; }}>
        {icon}
      </a>
    );
  }
  return <span style={{ flexShrink: 0 }}>{icon}</span>;
}

function WidgetWrapper({ widget, onSettingsClick, onCollapse, locked }) {
  const def = WIDGET_REGISTRY[widget.type];
  const pingUrl = widget.settings?.serviceUrl || widget.settings?.url || widget.settings?.adminUrl;
  const pingStatus = useServicePing(pingUrl);
  const fontSizes = { small: '10px', medium: '12px', large: '14px', xl: '16px' };
  const wBase = fontSizes[widget.settings?.textSize || 'medium'];
  const isCollapsed = !!widget.settings?.collapsed;

  if (!def) {
    return (
      <div className="widget-card">
        <div className="widget-loading" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
          Unknown widget type: <code>{widget.type}</code>
        </div>
      </div>
    );
  }
  const Component = def.component;
  return (
    <div className="widget-card">
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {!locked && (
            <GripVertical size={12} style={{ color: 'var(--text-dim)', cursor: 'grab', flexShrink: 0 }} />
          )}
          <ServiceIcon
            def={def}
            serviceUrl={widget.settings?.serviceUrl || widget.settings?.url || widget.settings?.adminUrl}
            widgetIcon={widget.settings?.widgetIcon}
            widgetIconUrl={widget.settings?.widgetIconUrl}
          />
          <span className="widget-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {widget.settings?.widgetTitle || widget.title || def.label}
          </span>
          <StatusDot status={pingStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* Collapse toggle — always visible */}
          <button
            className="btn ghost btn-icon"
            style={{ padding: 4 }}
            onClick={() => onCollapse(widget.id)}
            onMouseDown={e => e.stopPropagation()}
            title={isCollapsed ? 'Expand widget' : 'Collapse widget'}
          >
            <ChevronDown
              size={13}
              style={{
                color: 'var(--text-dim)',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
          {/* Settings — only when unlocked */}
          {!locked && (
            <button
              className="btn ghost btn-icon"
              style={{ padding: 4 }}
              onClick={() => onSettingsClick(widget)}
              onMouseDown={e => e.stopPropagation()}
              title="Widget settings"
            >
              <Settings size={12} style={{ color: 'var(--text-dim)' }} />
            </button>
          )}
        </div>
      </div>
      {/* Body — hidden when collapsed, but component gets collapsed prop for summary */}
      {!isCollapsed ? (
        <div className="widget-body" style={{ fontSize: wBase }}>
          <Component settings={widget.settings || {}} widgetId={widget.id} collapsed={false} />
        </div>
      ) : (
        <div className="widget-body" style={{ fontSize: wBase, padding: '6px 14px', flexShrink: 0 }}>
          <Component settings={widget.settings || {}} widgetId={widget.id} collapsed={true} />
        </div>
      )}
    </div>
  );
}

// ─── Editable Page Tab ────────────────────────────────────────────────────────
function PageTab({ page, isActive, onClick, onRename, onDelete, isOnly, onIconClick }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(page.label);
  const inputRef = useRef(null);

  const startEdit = (e) => { e.stopPropagation(); setDraft(page.label); setEditing(true); };
  const commit    = () => { setEditing(false); if (draft.trim()) onRename(page.id, draft.trim()); };
  const onKey     = (e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); };

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 14px', height: '100%', cursor: 'pointer',
      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'color 0.15s ease',
      flexShrink: 0, userSelect: 'none',
    }}>
      <span
        onClick={e => { e.stopPropagation(); onIconClick(page.id); }}
        onMouseDown={e => e.stopPropagation()}
        title="Change icon"
        style={{ cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.25)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >
        {page.serviceSlug
          ? <img src={`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${page.serviceSlug}.png`} alt={page.serviceSlug} style={{ width:18, height:18, objectFit:'contain', borderRadius:3 }} onError={e => e.target.style.display='none'} />
          : (page.emoji || page.icon || '📄')
        }
      </span>
      {editing ? (
        <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey}
          onClick={e => e.stopPropagation()}
          style={{ width: Math.max(60, draft.length * 8), background: 'var(--bg2)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--text)', padding: '1px 4px', fontFamily: 'var(--font-ui)', fontSize: 12, outline: 'none' }}
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>{page.label}</span>
      )}
      {isActive && !editing && (
        <>
          <button className="btn ghost btn-icon" style={{ padding: 2, opacity: 0.5 }} onClick={startEdit} onMouseDown={e => e.stopPropagation()} title="Rename page">
            <Pencil size={10} />
          </button>
          {!isOnly && (
            <button className="btn ghost btn-icon" style={{ padding: 2, opacity: 0.4 }} onMouseDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} title="Delete page">
              <X size={10} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

const PAGE_ICONS = ['🏠','📺','🖥','🎮','🌐','📡','🔧','📊','🎵','☁️','🔒','📦','🏎','🛡'];

function PageNav({ pages, activePage, setActivePage, onAddPage, onRenamePage, onDeletePage, onIconClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 40, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', overflowY: 'hidden', flexShrink: 0 }}>
      {pages.map(page => (
        <PageTab key={page.id} page={page} isActive={page.id === activePage} onClick={() => setActivePage(page.id)}
          onRename={onRenamePage} onDelete={onDeletePage} isOnly={pages.length === 1} onIconClick={onIconClick} />
      ))}
      <button className="btn ghost" style={{ padding: '0 12px', height: '100%', borderRadius: 0, borderLeft: '1px solid var(--border)', flexShrink: 0, fontSize: 11, gap: 4 }} onClick={onAddPage}>
        <Plus size={13} /> Add page
      </button>
    </div>
  );
}

function EmptyPage({ onAdd }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', gap: 20 }}>
      <div style={{ fontSize: 56 }}>📐</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Empty page</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>This page has no widgets yet. Add your first one to get started.</div>
      <button className="btn primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={onAdd}><Plus size={16} /> Add widget</button>
    </div>
  );
}

let _counter = Date.now();
const uid = () => `w-${++_counter}`;
const pid = () => `p-${++_counter}`;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { config, saveConfig } = useConfig();
  const [activePage, setActivePage]             = useState(() => config.pages?.[0]?.id || 'home');
  const [showAdd, setShowAdd]                   = useState(false);
  const [iconPickingPage, setIconPickingPage]   = useState(null);
  const [showDashSettings, setShowDashSettings] = useState(false);
  const [editingWidget, setEditingWidget]       = useState(null);
  const [containerWidth, setContainerWidth]     = useState(window.innerWidth - 40);

  useEffect(() => {
    const fn = () => setContainerWidth(window.innerWidth - 40);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    const ids = (config.pages || []).map(p => p.id);
    if (ids.length && !ids.includes(activePage)) setActivePage(ids[0]);
  }, [config.pages]);

  const pages = config.pages || [];
  const currentPage = pages.find(p => p.id === activePage) || pages[0] || { id: 'fallback', label: 'Home', layout: [], widgets: {} };
  const pageWidgets = Object.values(currentPage.widgets || {});
  const pageLayout  = currentPage.layout || [];

  const updatePage = useCallback((pageId, updater) => {
    saveConfig({ ...config, pages: config.pages.map(p => p.id === pageId ? updater(p) : p) });
  }, [config, saveConfig]);

  const onLayoutChange = useCallback((newLayout) => {
    // Don't stomp collapsed heights when grid reports layout changes
    updatePage(activePage, p => {
      const collapsedIds = new Set(
        Object.values(p.widgets || {}).filter(w => w.settings?.collapsed).map(w => w.id)
      );
      const merged = newLayout.map(item => {
        if (collapsedIds.has(item.i)) return item; // keep collapsed h=1
        return item;
      });
      return { ...p, layout: merged };
    });
  }, [activePage, updatePage]);

  // ── Collapse / expand ───────────────────────────────────────────────────────
  const toggleCollapse = useCallback((widgetId) => {
    updatePage(activePage, p => {
      const widget = (p.widgets || {})[widgetId];
      if (!widget) return p;
      const layout = p.layout || [];
      const layoutItem = layout.find(l => l.i === widgetId);
      if (!layoutItem) return p;

      const isCollapsed = !!widget.settings?.collapsed;

      if (isCollapsed) {
        // Expand — restore original height
        const originalH = widget.settings?.originalH || 4;
        return {
          ...p,
          layout: layout.map(l => l.i === widgetId
            ? { ...l, h: originalH, minH: l.minH === 1 ? 2 : l.minH }
            : l
          ),
          widgets: {
            ...p.widgets,
            [widgetId]: {
              ...widget,
              settings: { ...widget.settings, collapsed: false, originalH: undefined },
            },
          },
        };
      } else {
        // Collapse — save current height, shrink to 1
        return {
          ...p,
          layout: layout.map(l => l.i === widgetId
            ? { ...l, h: 1, minH: 1 }
            : l
          ),
          widgets: {
            ...p.widgets,
            [widgetId]: {
              ...widget,
              settings: { ...widget.settings, collapsed: true, originalH: layoutItem.h },
            },
          },
        };
      }
    });
  }, [activePage, updatePage]);

  const addWidget = useCallback((type) => {
    const def = WIDGET_REGISTRY[type];
    if (!def) return;
    const id = uid();
    const item = { i: id, x: 0, y: Infinity, w: def.defaultSize.w, h: def.defaultSize.h, minW: 2, minH: 2 };
    const widget = { id, type, title: def.label, settings: { ...(def.defaultSettings || {}) } };
    updatePage(activePage, p => ({
      ...p,
      layout:  [...(p.layout  || []), item],
      widgets: { ...(p.widgets || {}), [id]: widget },
    }));
  }, [activePage, updatePage]);

  const updateWidget = useCallback((w) => {
    updatePage(activePage, p => ({ ...p, widgets: { ...(p.widgets || {}), [w.id]: w } }));
  }, [activePage, updatePage]);

  const moveWidget = useCallback((widget, targetPageId) => {
    if (targetPageId === activePage) return;
    const def = WIDGET_REGISTRY[widget.type];
    const original = pageLayout.find(l => l.i === widget.id) || { w: def?.defaultSize?.w || 4, h: def?.defaultSize?.h || 4 };
    saveConfig({
      ...config,
      pages: config.pages.map(p => {
        if (p.id === activePage) {
          const w = { ...(p.widgets || {}) };
          delete w[widget.id];
          return { ...p, layout: (p.layout || []).filter(l => l.i !== widget.id), widgets: w };
        }
        if (p.id === targetPageId) {
          return {
            ...p,
            layout:  [...(p.layout  || []), { ...original, i: widget.id, y: Infinity }],
            widgets: { ...(p.widgets || {}), [widget.id]: widget },
          };
        }
        return p;
      }),
    });
  }, [activePage, config, saveConfig, pageLayout]);

  const cloneWidget = useCallback((widget) => {
    const id  = uid();
    const def = WIDGET_REGISTRY[widget.type];
    const original = pageLayout.find(l => l.i === widget.id) || { w: def?.defaultSize?.w || 4, h: def?.defaultSize?.h || 4 };
    const cloned = { ...widget, id, title: `${widget.title || def?.label || widget.type} (Copy)` };
    const item   = { ...original, i: id, y: Infinity };
    updatePage(activePage, p => ({
      ...p,
      layout:  [...(p.layout  || []), item],
      widgets: { ...(p.widgets || {}), [id]: cloned },
    }));
  }, [activePage, updatePage, pageLayout]);

  const removeWidget = useCallback((id) => {
    updatePage(activePage, p => {
      const w = { ...(p.widgets || {}) };
      delete w[id];
      return { ...p, layout: (p.layout || []).filter(l => l.i !== id), widgets: w };
    });
  }, [activePage, updatePage]);

  const addPage = useCallback(() => {
    const existing = config.pages || [];
    const used = existing.map(p => p.icon);
    const icon = PAGE_ICONS.find(i => !used.includes(i)) || '📄';
    const p = { id: pid(), label: `Page ${existing.length + 1}`, icon, layout: [], widgets: {} };
    saveConfig({ ...config, pages: [...existing, p] });
    setActivePage(p.id);
  }, [config, saveConfig]);

  const renamePage = useCallback((pageId, label) => {
    saveConfig({ ...config, pages: config.pages.map(p => p.id === pageId ? { ...p, label } : p) });
  }, [config, saveConfig]);

  const deletePage = useCallback((pageId) => {
    const pages = config.pages || [];
    if (pages.length <= 1) return;
    const remaining = pages.filter(p => p.id !== pageId);
    if (remaining.length === 0) return;
    saveConfig({ ...config, pages: remaining });
    if (activePage === pageId) setActivePage(remaining[0].id);
  }, [config, saveConfig, activePage]);

  const setPageIcon = useCallback((pageId, iconData) => {
    const icon = iconData.type === 'service'
      ? { emoji: null, serviceSlug: iconData.slug }
      : { emoji: iconData.value, serviceSlug: null };
    saveConfig({ ...config, pages: config.pages.map(p => p.id === pageId ? { ...p, ...icon } : p) });
  }, [config, saveConfig]);

  const toggleLock = useCallback(() => {
    updatePage(activePage, p => ({ ...p, locked: !p.locked }));
  }, [activePage, updatePage]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlassMode />
      <ViewportScale />
      {/* Top bar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LayoutDashboard size={18} style={{ color: 'var(--accent)' }} />
          <span className="topbar-title">{config.dashboardTitle || 'WarrDash'}</span>
        </div>
        <div className="topbar-actions">
          {!currentPage?.locked && (
            <button className="btn" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Widget</button>
          )}
          <button className="btn"
            style={{
              borderColor: currentPage?.locked ? 'var(--amber)' : 'var(--border)',
              color: currentPage?.locked ? 'var(--amber)' : 'var(--text-muted)',
              background: currentPage?.locked ? 'rgba(246,173,85,0.08)' : 'var(--surface2)',
            }}
            onClick={toggleLock}
            title={currentPage?.locked ? 'Unlock page' : 'Lock page layout'}
          >
            {currentPage?.locked ? <><Lock size={13} /> Locked</> : <><Unlock size={13} /> Lock</>}
          </button>
          <button className="btn ghost btn-icon" onClick={() => setShowDashSettings(true)} title="Dashboard settings">
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Page tab nav */}
      <PageNav
        pages={config.pages || []}
        activePage={activePage}
        setActivePage={setActivePage}
        onAddPage={addPage}
        onRenamePage={renamePage}
        onDeletePage={deletePage}
        onIconClick={(pageId) => setIconPickingPage(pageId)}
      />

      {/* Grid */}
      <div style={{ flex: 1, padding: '16px 20px' }}>
        {pageWidgets.length === 0 ? (
          <EmptyPage onAdd={() => setShowAdd(true)} />
        ) : (
          <GridLayout
            className="layout"
            layout={pageLayout}
            cols={24}
            rowHeight={60}
            width={containerWidth}
            onLayoutChange={onLayoutChange}
            isDraggable={!currentPage?.locked}
            isResizable={!currentPage?.locked}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            draggableHandle=".widget-header"
          >
            {pageWidgets.map(widget => (
              <div key={widget.id}>
                <WidgetWrapper
                  widget={widget}
                  onSettingsClick={setEditingWidget}
                  onCollapse={toggleCollapse}
                  locked={!!currentPage?.locked}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* Modals */}
      {showAdd && !currentPage?.locked && <AddWidgetPanel onAdd={addWidget} onClose={() => setShowAdd(false)} />}
      {showDashSettings && <DashboardSettingsModal onClose={() => setShowDashSettings(false)} />}
      {iconPickingPage && (
        <IconPickerModal
          current={config.pages?.find(p => p.id === iconPickingPage)}
          onSelect={(iconData) => setPageIcon(iconPickingPage, iconData)}
          onClose={() => setIconPickingPage(null)}
        />
      )}
      {editingWidget && (
        <WidgetSettingsModal
          widget={editingWidget}
          onSave={updateWidget}
          onDelete={removeWidget}
          onClone={(widget) => { cloneWidget(widget); setEditingWidget(null); }}
          onMove={(widget, targetPageId) => { moveWidget(widget, targetPageId); setEditingWidget(null); }}
          pages={config.pages || []}
          currentPageId={activePage}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
}
