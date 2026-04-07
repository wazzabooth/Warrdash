import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Loader } from 'lucide-react';

async function fetchChannelName(channelId) {
  try {
    const r = await fetch(`/api/youtube/feed?channelId=${encodeURIComponent(channelId)}`);
    const xml = await r.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const name = doc.querySelector('author name')?.textContent || doc.querySelector('title')?.textContent;
    return name && name !== 'YouTube' ? name : null;
  } catch(e) { return null; }
}

export default function ChannelListEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [newId,    setNewId]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState('');

  const add = async () => {
    const raw = newId.trim();
    if (!raw) return;
    // Extract UC channel ID from URL or raw input
    const match = raw.match(/(UC[\w-]{22})/);
    const id = match ? match[1] : raw;
    if (items.find(i => i.id === id)) { setNewId(''); return; }

    setLoading(true); setErrMsg('');
    const name = await fetchChannelName(id);
    setLoading(false);

    if (!name) {
      setErrMsg('Could not find channel — check the ID');
      return;
    }
    onChange([...items, { id, name }]);
    setNewId('');
    setErrMsg('');
  };

  const remove     = i => onChange(items.filter((_, j) => j !== i));
  const updateName = (i, name) => { const next = [...items]; next[i] = { ...next[i], name }; onChange(next); };
  const reorder    = (from, to) => {
    const arr = [...items];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    onChange(arr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.length === 0 && (
        <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', fontStyle: 'italic' }}>No channels added yet</div>
      )}

      {items.map((ch, i) => (
        <div key={i} draggable
          onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', i); }}
          onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== i) reorder(from, i); }}
          onDragOver={e => e.preventDefault()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--border)', cursor: 'grab' }}>
          <GripVertical size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          {/* YouTube icon */}
          <div style={{ width: 20, height: 20, background: '#ff0000', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid white', marginLeft: 1 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input className="input" placeholder="Channel name" value={ch.name || ''}
              onChange={e => updateName(i, e.target.value)}
              style={{ fontSize: '0.83em', marginBottom: 2 }} />
            <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', paddingLeft: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ch.id}
            </div>
          </div>
          <button className="btn ghost btn-icon" onClick={() => remove(i)} style={{ flexShrink: 0 }}>
            <Trash2 size={13} style={{ color: 'var(--red)' }} />
          </button>
        </div>
      ))}

      {/* Add new channel */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input className="input" style={{ flex: 1, fontSize: '0.83em' }}
          placeholder="Channel ID (UCxxxxxx) or YouTube URL"
          value={newId}
          onChange={e => { setNewId(e.target.value); setErrMsg(''); }}
          onKeyDown={e => e.key === 'Enter' && !loading && add()}
          disabled={loading}
        />
        <button className="btn primary" style={{ flexShrink: 0, padding: '6px 12px', minWidth: 64, justifyContent: 'center' }}
          onClick={add} disabled={loading || !newId.trim()}>
          {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={13} /> Add</>}
        </button>
      </div>

      {errMsg && <div style={{ fontSize: '0.75em', color: 'var(--red)' }}>⚠ {errMsg}</div>}

      <div style={{ fontSize: '0.72em', color: 'var(--text-dim)' }}>
        Paste a full YouTube URL or UC channel ID — name is fetched automatically
      </div>
      {items.length > 1 && (
        <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', textAlign: 'center' }}>Drag ⠿ to reorder</div>
      )}
    </div>
  );
}
