import React, { useState, useEffect, useCallback, useRef } from 'react';

const TRANSITIONS = {
  fade:     { name: 'Fade' },
  slide:    { name: 'Slide' },
  zoom:     { name: 'Zoom' },
  flip:     { name: 'Flip' },
};

function getThumbUrl(plexUrl, token, path) {
  if (!path) return null;
  const base = plexUrl.replace(/\/$/, '');
  return `${base}${path}?X-Plex-Token=${token}`;
}

function dedupeByShow(items) {
  const seen = new Set();
  return items.filter(item => {
    if (item.type === 'episode') {
      // Dedupe by show using grandparentRatingKey (most reliable) or grandparentTitle
      const key = item.grandparentRatingKey || item.grandparentTitle || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    if (item.type === 'season') {
      // Dedupe by show using parentRatingKey (most reliable) or parentTitle
      const key = item.parentRatingKey || item.parentTitle || item.ratingKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    // Movies always show
    return true;
  });
}

function SlideItem({ item, plexUrl, token, active, direction, transition }) {
  const [expanded, setExpanded] = useState(false);
  const isEpisode = item.type === 'episode';
  const isSeason  = item.type === 'season';
  const isTV      = isEpisode || isSeason;

  const title     = isSeason  ? item.parentTitle
                  : isEpisode ? (item.grandparentTitle || item.title)
                  : item.title;
  const subtitle  = isSeason  ? item.title
                  : isEpisode ? `${item.parentTitle} · ${item.title}`
                  : item.year?.toString();
  const thumbPath = isSeason  ? (item.parentThumb || item.thumb)
                  : isEpisode ? (item.grandparentThumb || item.thumb)
                  : item.thumb;
  const artPath   = isEpisode ? (item.grandparentArt || item.art) : item.art;

  const thumbUrl = getThumbUrl(plexUrl, token, thumbPath);
  const artUrl   = getThumbUrl(plexUrl, token, artPath);

  // Poster fills widget; use art as subtle bg if no poster
  const fillUrl = thumbUrl || artUrl;

  const getTransStyle = () => {
    if (!active) {
      if (transition === 'slide') return { transform: `translateX(${direction === 'next' ? '-100%' : '100%'})`, opacity: 0, pointerEvents: 'none' };
      if (transition === 'zoom')  return { transform: 'scale(0.95)', opacity: 0, pointerEvents: 'none' };
      if (transition === 'flip')  return { transform: 'rotateY(90deg)', opacity: 0, pointerEvents: 'none' };
      return { opacity: 0, pointerEvents: 'none' };
    }
    return { transform: 'translateX(0) scale(1) rotateY(0deg)', opacity: 1, pointerEvents: 'auto' };
  };

  return (
    <div style={{ position: 'absolute', inset: 0, transition: 'opacity 0.5s ease, transform 0.5s ease', ...getTransStyle() }}>

      {/* Full-widget poster fill */}
      {fillUrl && (
        <img src={fillUrl} alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Gradients — pointer-events: none so they never block clicks */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%)', pointerEvents: 'none' }} />

      {/* Top badge */}
      <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 6, padding: '3px 10px', fontSize: '0.65em', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {isTV ? '📺 TV' : '🎬 Movie'} · Recently Added
      </div>

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>

        {/* Title */}
        <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.6)', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        )}

        {/* Synopsis — tap to expand */}
        {item.summary && (
          <div
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: '0.73em', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
              marginBottom: 6, cursor: 'pointer',
              ...(expanded
                ? { maxHeight: 130, overflowY: 'auto' }
                : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
              ),
            }}
          >
            {item.summary}
            {!expanded && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>tap to expand</span>}
          </div>
        )}
      </div>
    </div>
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

export default function PlexWidget({ settings = {}, widgetId }) {
  const { url, token, transition = 'fade', slideshowMode, showProgressBar = true } = settings;
  const slideshow = slideshowMode !== 'false' && slideshowMode !== false;
  const interval  = parseInt(settings.slideshowInterval || '5');

  const [items,   setItems]   = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [dir,     setDir]     = useState('next');
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    if (!url || !token) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/plex/library/recentlyAdded?X-Plex-Container-Start=0&X-Plex-Container-Size=50&_widgetId=${widgetId}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const raw = data?.MediaContainer?.Metadata || [];
      const deduped = dedupeByShow(raw).slice(0, 20);
      setItems(deduped);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [url, token, widgetId]);

  useEffect(() => { load(); const id = setInterval(load, 5 * 60000); return () => clearInterval(id); }, [load]);

  // Slideshow timer
  useEffect(() => {
    if (!slideshow || paused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setDir('next');
      setCurrent(c => (c + 1) % items.length);
    }, interval * 1000);
    return () => clearInterval(timerRef.current);
  }, [slideshow, paused, items.length, interval]);

  const go = (newIdx) => {
    setDir(newIdx > current ? 'next' : 'prev');
    setCurrent(newIdx);
    // Reset timer
    clearInterval(timerRef.current);
  };

  const prev = () => { setDir('prev'); setCurrent(c => (c - 1 + items.length) % items.length); };
  const next = () => { setDir('next'); setCurrent(c => (c + 1) % items.length); };

  if (!url) return <div className="empty-state">Configure Plex URL & token in settings</div>;
  if (loading && !items.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color: 'var(--red)' }}>{error}</div>;
  if (!items.length) return <div className="empty-state">No recently added items</div>;

  const item = items[current];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Main slideshow area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, background: 'var(--bg2)', minHeight: 0 }}>
        {items.map((itm, i) => (
          <SlideItem
            key={`${itm.ratingKey || i}`}
            item={itm}
            plexUrl={url}
            token={token}
            active={i === current}
            direction={dir}
            transition={transition}
          />
        ))}

        {/* Prev/Next arrows */}
        {items.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>›</button>
          </>
        )}

        {/* Pause indicator */}
        {paused && slideshow && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px', fontSize: '0.65em', color: 'rgba(255,255,255,0.6)', zIndex: 10 }}>⏸</div>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '6px 0 2px', flexShrink: 0, flexWrap: 'wrap' }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === current ? 16 : 6, height: 6, borderRadius: 3,
              background: i === current ? 'var(--accent)' : 'var(--border)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {(showProgressBar === true || showProgressBar === 'true') && slideshow && !paused && items.length > 1 && (
        <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
          <div key={`${current}-progress`} style={{
            height: '100%', background: 'var(--accent)', borderRadius: 1,
            animation: `plex-progress ${interval}s linear`,
            '@keyframes plex-progress': { from: { width: '0%' }, to: { width: '100%' } },
          }} />
        </div>
      )}

      <style>{`
        @keyframes plex-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
