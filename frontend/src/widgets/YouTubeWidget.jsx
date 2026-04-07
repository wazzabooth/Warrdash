import React, { useState, useEffect, useCallback, useRef } from 'react';

function parseChannels(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) || []; } catch { return []; }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function parseRSS(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const entries = [...doc.querySelectorAll('entry')];
  return entries.map(e => ({
    id:          e.querySelector('id')?.textContent || '',
    title:       e.querySelector('title')?.textContent || '',
    videoId:     e.querySelector('videoId')?.textContent || '',
    channelName: e.querySelector('author name')?.textContent || '',
    channelId:   e.querySelector('channelId')?.textContent || '',
    published:   e.querySelector('published')?.textContent || '',
    thumb:       e.querySelector('thumbnail')?.getAttribute('url') ||
                 `https://i.ytimg.com/vi/${e.querySelector('videoId')?.textContent}/hqdefault.jpg`,
    views:       e.querySelector('statistics')?.getAttribute('views') || '0',
    description: e.querySelector('description')?.textContent || '',
    url:         e.querySelector('link')?.getAttribute('href') || '',
  }));
}

function SlideItem({ video, active, direction, transition }) {
  const getStyle = () => {
    if (!active) {
      if (transition === 'slide') return { transform: `translateX(${direction === 'next' ? '-100%' : '100%'})`, opacity: 0 };
      if (transition === 'zoom')  return { transform: 'scale(0.88)', opacity: 0 };
      return { opacity: 0 };
    }
    return { transform: 'translateX(0) scale(1)', opacity: 1 };
  };

  const fmtViews = (v) => {
    const n = parseInt(v) || 0;
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M views`;
    if (n >= 1000)    return `${(n/1000).toFixed(0)}K views`;
    return `${n} views`;
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      ...getStyle(),
    }}>
      {/* Blurred background */}
      {video.thumb && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${video.thumb})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.2)', transform: 'scale(1.05)',
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Thumbnail */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          {video.thumb && (
            <img src={video.thumb} alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          {/* YouTube play button overlay */}
          <a href={video.url} target="_blank" rel="noopener noreferrer"
            onMouseDown={e => e.stopPropagation()}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <div style={{
              width: 52, height: 36, background: 'rgba(255,0,0,0.85)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'red'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.85)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '16px solid white', marginLeft: 3 }} />
            </div>
          </a>
        </div>

        {/* Info bar */}
        <div style={{ padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7em', color: 'rgba(255,0,0,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {video.channelName}
          </div>
          <div style={{ fontSize: '0.88em', fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: 4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.title}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.72em', color: 'rgba(255,255,255,0.5)' }}>
            <span>{timeAgo(video.published)}</span>
            {parseInt(video.views) > 0 && <span>· {fmtViews(video.views)}</span>}
          </div>
        </div>
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

export default function YouTubeWidget({ settings = {}, widgetId }) {
  const channels = parseChannels(settings.channels);
  const maxVideos      = parseInt(settings.maxVideos || '12');
  const transition     = settings.transition || 'fade';
  const interval       = parseInt(settings.slideshowInterval || '6');
  const slideshowMode   = settings.slideshowMode !== 'false' && settings.slideshowMode !== false;
  const showProgressBar = settings.showProgressBar !== false && settings.showProgressBar !== 'false';

  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [current, setCurrent] = useState(0);
  const [dir,     setDir]     = useState('next');
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    if (!channels.length) return;
    setLoading(true); setError(null);
    try {
      const feeds = await Promise.allSettled(
        channels.map(ch =>
          fetch(`/api/youtube/feed?channelId=${encodeURIComponent(ch.channelId || ch.id || ch)}`)
            .then(r => r.text())
            .then(xml => parseRSS(xml))
        )
      );
      const all = feeds
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.published) - new Date(a.published))
        .slice(0, maxVideos);
      setVideos(all);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [settings.channels, maxVideos]);

  useEffect(() => { load(); const id = setInterval(load, 15 * 60000); return () => clearInterval(id); }, [load]);

  // Slideshow timer
  useEffect(() => {
    if (!slideshowMode || paused || videos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setDir('next');
      setCurrent(c => (c + 1) % videos.length);
    }, interval * 1000);
    return () => clearInterval(timerRef.current);
  }, [slideshowMode, paused, videos.length, interval]);

  const prev = () => {
    clearInterval(timerRef.current);
    setDir('prev');
    setCurrent(c => (c - 1 + videos.length) % videos.length);
  };
  const next = () => {
    clearInterval(timerRef.current);
    setDir('next');
    setCurrent(c => (c + 1) % videos.length);
  };
  const go = (i) => {
    clearInterval(timerRef.current);
    setDir(i > current ? 'next' : 'prev');
    setCurrent(i);
  };

  if (!channels.length) return <div className="empty-state">Add YouTube channels in settings</div>;
  if (loading && !videos.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color: 'var(--red)' }}>{error}</div>;
  if (!videos.length) return <div className="empty-state">No videos found</div>;

  const video = videos[current];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Slideshow */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#000', minHeight: 0 }}>
        {videos.map((v, i) => (
          <SlideItem key={v.id || i} video={v} active={i === current} direction={dir} transition={transition} />
        ))}

        {/* Arrows */}
        {videos.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 6, top: '40%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 6, top: '40%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>›</button>
          </>
        )}

        {/* Pause badge */}
        {paused && slideshowMode && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px', fontSize: '0.65em', color: 'rgba(255,255,255,0.5)', zIndex: 10 }}>⏸</div>
        )}
      </div>

      {/* Dot indicators */}
      {videos.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '5px 0 2px', flexShrink: 0, flexWrap: 'wrap' }}>
          {videos.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === current ? 16 : 6, height: 6, borderRadius: 3,
              background: i === current ? '#ff0000' : 'var(--border)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {showProgressBar && slideshowMode && !paused && videos.length > 1 && (
        <>
          <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
            <div key={`${current}-bar`} style={{ height: '100%', background: '#ff0000', borderRadius: 1, animation: `yt-progress ${interval}s linear` }} />
          </div>
          <style>{`@keyframes yt-progress { from { width: 0% } to { width: 100% } }`}</style>
        </>
      )}
    </div>
  );
}
