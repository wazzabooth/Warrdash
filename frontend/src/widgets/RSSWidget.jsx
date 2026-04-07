import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// Strip HTML tags and decode entities
function cleanText(str) {
  if (!str) return '';
  // Decode HTML entities using a textarea trick via regex
  return str
    .replace(/<[^>]+>/g, '')           // strip tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')          // strip numeric entities
    .replace(/&[a-z]+;/g, ' ')        // strip remaining named entities
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

function parseFeed(xml, feedUrl, feedName) {
  const p = new DOMParser();
  const doc = p.parseFromString(xml, 'application/xml');
  const isAtom = !!doc.querySelector('feed');
  const feedTitle = feedName || cleanText(doc.querySelector('channel > title, feed > title')?.textContent) || feedUrl;

  const items = Array.from(doc.querySelectorAll(isAtom ? 'entry' : 'item'));

  return items.map(item => {
    const rawDesc = item.querySelector('description, summary, content')?.textContent || '';
    return {
      title:       cleanText(item.querySelector('title')?.textContent),
      url:         isAtom
                     ? (item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent || '')
                     : (item.querySelector('link')?.textContent || ''),
      description: cleanText(rawDesc).slice(0, 150),
      published:   item.querySelector('pubDate, published, updated')?.textContent || '',
      feedTitle,
    };
  }).filter(i => i.title && i.url);
}

function ArticleCard({ item, showDescription, showSource, index }) {
  const [hover, setHover] = useState(false);

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        background: hover ? 'var(--surface2)' : 'transparent',
        transition: 'background 0.12s',
        borderLeft: hover ? '3px solid var(--accent)' : '3px solid transparent',
      }}>
        {/* Title */}
        <div style={{
          fontSize: '0.88em',
          fontWeight: 600,
          color: 'var(--text)',
          lineHeight: 1.35,
          marginBottom: showDescription && item.description ? 4 : 3,
        }}>
          {item.title}
        </div>

        {/* Description */}
        {showDescription && item.description && (
          <div style={{
            fontSize: '0.78em',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            marginBottom: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72em' }}>
          {showSource && (
            <span style={{
              color: 'var(--accent)', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%',
            }}>
              {item.feedTitle}
            </span>
          )}
          {item.published && (
            <span style={{ color: 'var(--text-dim)', flexShrink: 0, marginLeft: 'auto' }}>
              {timeAgo(item.published)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}


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

export default function RSSWidget({ settings = {}, widgetId }) {
  const {
    showDescription = true,
    showSource      = true,
    maxItems        = 20,
  } = settings;

  const feeds = Array.isArray(settings.feeds) ? settings.feeds : [];

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    if (!feeds.length) return;
    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled(
        feeds.map(f =>
          fetch(`/api/rss/feed?url=${encodeURIComponent(f.url)}&_widgetId=${widgetId}`)
            .then(r => r.text())
            .then(xml => parseFeed(xml, f.url, f.name))
        )
      );
      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.published) - new Date(a.published))
        .slice(0, parseInt(maxItems) || 20);
      setItems(all);
      setLastUpdated(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [feeds.map(f => f.url).join(','), maxItems, widgetId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15 * 60000);
    return () => clearInterval(id);
  }, [load]);

  if (!feeds.length) return (
    <div className="empty-state" style={{ flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '1.5em' }}>📰</div>
      <div>Add RSS/Atom feed URLs in settings</div>
    </div>
  );

  if (loading && !items.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color: 'var(--red)', fontSize: '0.85em' }}>{error}</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '0 2px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        <span style={{ fontSize: '1em' }}>📰</span>
        <span style={{ fontWeight: 600, fontSize: '0.85em', color: 'var(--text)', flex: 1 }}>
          {feeds.length} feed{feeds.length !== 1 ? 's' : ''} · {items.length} articles
        </span>
        {lastUpdated && (
          <span style={{ fontSize: '0.68em', color: 'var(--text-dim)' }}>
            {timeAgo(lastUpdated.toISOString())}
          </span>
        )}
        <button className="btn ghost btn-icon" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Articles */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0
          ? <div className="empty-state">No articles found</div>
          : <div className="stat-box" style={{ padding: 0 }}>
              {items.map((item, i) => (
                <ArticleCard
                  key={`${item.url}-${i}`}
                  item={item}
                  showDescription={showDescription === true || showDescription === 'true'}
                  showSource={showSource === true || showSource === 'true'}
                  index={i}
                />
              ))}
            </div>
        }
      </div>
    </div>
  );
}
