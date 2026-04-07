import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react';


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

export default function ShoppingListWidget({ settings = {}, widgetId }) {
  const { url, listId = 'default', listName, showAddBar = true, showDoneByDefault = false } = settings;

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [newItem, setNewItem]   = useState('');
  const [adding, setAdding]     = useState(false);
  const [showDone, setShowDone] = useState(showDoneByDefault);
  const inputRef = useRef(null);

  const apiBase = `/api/shopping?_widgetId=${widgetId}&listId=${encodeURIComponent(listId)}`;

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(apiBase);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setItems(Array.isArray(data) ? data : (data.items || []));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [url, apiBase]);

  useEffect(() => { load(); }, [load]);

  // ── Add item ──
  const addItem = async () => {
    const name = newItem.trim();
    if (!name) return;
    setAdding(true);
    try {
      await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, listId }),
      });
      setNewItem('');
      await load();
    } catch (e) { console.error(e); }
    finally { setAdding(false); inputRef.current?.focus(); }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') addItem();
    if (e.key === 'Escape') setNewItem('');
  };

  // ── Toggle checked — uses authenticated route ──
  const toggle = async (item) => {
    const id = item.id || item._id;
    setItems(prev => prev.map(i => (i.id === id || i._id === id) ? { ...i, checked: !i.checked } : i));
    try {
      await fetch(`/api/shopping/item/${id}?_widgetId=${widgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !item.checked }),
      });
    } catch (e) {
      setItems(prev => prev.map(i => (i.id === id || i._id === id) ? { ...i, checked: item.checked } : i));
    }
  };

  // ── Delete item — uses authenticated route ──
  const deleteItem = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id && i._id !== id));
    try {
      const r = await fetch(`/api/shopping/item/${id}?_widgetId=${widgetId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) { load(); }
  };

  // ── Clear all checked ──
  const clearChecked = async () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id || i._id);
    setItems(prev => prev.filter(i => !i.checked));
    try {
      await Promise.all(
        checkedIds.map(id =>
          fetch(`/api/shopping/item/${id}?_widgetId=${widgetId}`, { method: 'DELETE' })
        )
      );
    } catch (e) { load(); }
  };

  if (!url) return (
    <div className="empty-state">
      <ShoppingCart size={28} style={{ color: 'var(--text-dim)' }} />
      Configure your shopping list URL in settings
    </div>
  );

  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i => i.checked);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {showAddBar && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={inputRef}
            className="input"
            placeholder="Add item…"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={adding}
            style={{ flex: 1 }}
          />
          <button className="btn primary btn-icon" onClick={addItem}
            disabled={adding || !newItem.trim()} style={{ flexShrink: 0 }}>
            <Plus size={14} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.83em', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '1.17em' }}>{unchecked.length}</span>
          {' '}remaining
          {checked.length > 0 && <span style={{ marginLeft: 8 }}>· {checked.length} done</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {checked.length > 0 && (
            <>
              <button className="btn ghost" style={{ fontSize: '0.75em', padding: '3px 8px', opacity: 0.7 }}
                onClick={() => setShowDone(s => !s)}>
                {showDone ? 'Hide' : 'Show'} done
              </button>
              <button className="btn ghost danger" style={{ fontSize: '0.75em', padding: '3px 8px' }}
                onClick={clearChecked}>
                <Trash2 size={10} /> Clear done
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="widget-error">{error}</div>}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && items.length === 0 ? (
          <div className="widget-loading"><div className="spinner" /></div>
        ) : unchecked.length === 0 && checked.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 20 }}>
            <ShoppingCart size={24} style={{ color: 'var(--text-dim)' }} />
            List is empty — add something above
          </div>
        ) : (
          <>
            <div className="stat-box" style={{ padding: 0 }}>
            {unchecked.map(item => (
              <ItemRow key={item.id || item._id} item={item} onToggle={toggle} onDelete={deleteItem} />
            ))}
            </div>
            {showDone && checked.length > 0 && (
              <>
                <div className="divider" style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Done</div>
                <div className="stat-box" style={{ padding: 0, opacity: 0.6 }}>
                {checked.map(item => (
                  <ItemRow key={item.id || item._id} item={item} onToggle={toggle} onDelete={deleteItem} dimmed />
                ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete, dimmed = false }) {
  const [hovering, setHovering] = useState(false);
  const id = item.id || item._id;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderBottom: '1px solid var(--border)', opacity: dimmed ? 0.45 : 1, transition: 'opacity 0.2s' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button onClick={() => onToggle(item)} style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `1.5px solid ${item.checked ? 'var(--green)' : 'var(--border-h)'}`,
        background: item.checked ? 'var(--green)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease',
      }}>
        {item.checked && <Check size={11} style={{ color: 'var(--bg)' }} strokeWidth={3} />}
      </button>

      <span style={{ flex: 1, fontSize: '1em', color: 'var(--text)', textDecoration: item.checked ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
        {item.addedBy && <span style={{ marginLeft: 6, fontSize: '0.75em', color: 'var(--text-dim)' }}>· {item.addedBy}</span>}
      </span>

      <button className="btn ghost btn-icon" onClick={() => onDelete(id)}
        style={{ padding: 3, opacity: hovering ? 0.7 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <Trash2 size={11} style={{ color: 'var(--red)' }} />
      </button>
    </div>
  );
}
