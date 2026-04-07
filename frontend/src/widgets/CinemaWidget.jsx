import React, { useState, useEffect, useCallback, useRef } from 'react';

const TMDB_POSTER   = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';

// mediaInfo in discover results is a full object {status:N, ...}
function getMediaStatus(movie) {
  if (!movie.mediaInfo) return null;
  if (typeof movie.mediaInfo === 'object') return movie.mediaInfo.status;
  return movie.mediaInfo; // fallback for integer
}

function Stars({ rating }) {
  if (!rating) return null;
  const stars = Math.round((rating / 10) * 5);
  return (
    <span style={{ color: 'var(--amber)', fontSize: '0.82em', letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 5, fontSize: '0.9em' }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function RequestBtn({ movie, overseerrWidgetId }) {
  const [state, setState] = useState('idle');
  const ms = getMediaStatus(movie);

  // Only block the button if fully available
  if (state === 'done') return (
    <span style={{ fontSize: '0.78em', color: 'var(--green)', fontWeight: 700, background: 'rgba(104,211,145,0.15)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(104,211,145,0.3)' }}>
      ✓ Added to Overseerr
    </span>
  );
  if (state === 'exists') return (
    <span style={{ fontSize: '0.78em', color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-glow)', padding: '5px 12px', borderRadius: 8 }}>
      ✓ Already in Library
    </span>
  );
  if (state === 'error')  return <span style={{ fontSize: '0.75em', color: 'var(--red)', fontWeight: 700 }}>✗ Failed</span>;
  // Status 5 = in Plex and available to watch - no point requesting
  if (ms === 5) return <span style={{ fontSize: '0.75em', color: 'var(--green)', fontWeight: 700 }}>✓ In Plex</span>;
  if (!overseerrWidgetId) return null;

  const doRequest = async () => {
    setState('loading');
    try {
      const r = await fetch(`/api/overseerr/request?_widgetId=${overseerrWidgetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType: 'movie', mediaId: movie.id }),
      });
      if (r.status === 400) { setState('exists'); return; }
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
      setState('done');
      // Keep 'done' state permanently — don't reset
    } catch(e) {
      console.error('Cinema request:', e.message);
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <button onClick={doRequest} disabled={state === 'loading'} className="btn primary"
      style={{ fontSize: '0.78em', padding: '5px 14px', justifyContent: 'center', background: 'rgba(99,102,241,0.9)', backdropFilter: 'blur(4px)' }}>
      {state === 'loading'
        ? <><div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} /> Requesting…</>
        : '+ Request in Overseerr'}
    </button>
  );
}

function Slide({ movie, active, direction, transition, overseerrWidgetId, showRequest }) {
  const [synopsisOpen, setSynopsisOpen] = useState(false);

  const getStyle = () => {
    if (!active) {
      if (transition === 'slide') return { transform: `translateX(${direction === 'next' ? '-100%' : '100%'})`, opacity: 0, pointerEvents: 'none' };
      if (transition === 'zoom')  return { transform: 'scale(0.95)', opacity: 0, pointerEvents: 'none' };
      return { opacity: 0, pointerEvents: 'none' };
    }
    return { transform: 'translateX(0) scale(1)', opacity: 1, pointerEvents: 'auto' };
  };

  // Use poster for portrait fill, fall back to backdrop
  const posterUrl   = movie.posterPath   ? `${TMDB_POSTER}${movie.posterPath}`     : null;
  const backdropUrl = movie.backdropPath ? `${TMDB_BACKDROP}${movie.backdropPath}` : null;
  const bgUrl = posterUrl || backdropUrl;

  const year   = movie.releaseDate?.slice(0, 4);
  const rating = movie.voteAverage;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      ...getStyle(),
    }}>
      {/* Full-widget poster fill */}
      {bgUrl && (
        <img src={bgUrl} alt={movie.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Strong gradient — heavy at bottom for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none',
      }} />



      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
        {/* Title */}
        <div style={{ fontSize: '1.15em', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {movie.title}
        </div>

        {/* Year + rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          {year && <span style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.6)' }}>{year}</span>}
          {rating > 0 && <Stars rating={rating} />}
        </div>

        {/* Synopsis — click to expand */}
        {movie.overview && (
          <div
            onClick={() => setSynopsisOpen(true)}
            style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: 10,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              cursor: 'pointer' }}>
            {movie.overview}
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>read more</span>
          </div>
        )}

        {/* Request button */}
        {showRequest && (
          <RequestBtn movie={movie} overseerrWidgetId={overseerrWidgetId} />
        )}
      </div>

      {/* Synopsis overlay — inside Slide so synopsisOpen state is in scope */}
      {synopsisOpen && (
        <div
          onClick={() => setSynopsisOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            animation: 'synopsis-in 0.25s ease',
          }}>
          <style>{`@keyframes synopsis-in { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.95em', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{movie.title}</div>
              {movie.releaseDate && <div style={{ fontSize: '0.72em', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{movie.releaseDate.slice(0,4)}{movie.voteAverage > 0 && ` · ★ ${movie.voteAverage.toFixed(1)}`}</div>}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setSynopsisOpen(false); }}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1em' }}>
              ✕
            </button>
          </div>
          <div onClick={e => e.stopPropagation()}
            style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', fontSize: '0.82em', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
            {movie.overview}
          </div>
          <div style={{ padding: '8px 16px 12px', fontSize: '0.65em', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            tap anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}

export default function CinemaWidget({ settings = {}, widgetId }) {
  const {
    overseerrWidgetId = '',
    transition        = 'fade',
    slideshowInterval = '6',
    showRequest       = true,
    showProgressBar   = true,
    mode              = 'now_playing',
  } = settings;

  const [movies,  setMovies]  = useState([]);
  const [current, setCurrent] = useState(0);
  const [dir,     setDir]     = useState('next');
  const [paused,  setPaused]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [resolvedId, setResolvedId] = useState(overseerrWidgetId || '');
  const timer = useRef(null);
  const interval = parseInt(slideshowInterval || '6');

  // Auto-detect overseerr widget ID if not explicitly set
  useEffect(() => {
    if (overseerrWidgetId) { setResolvedId(overseerrWidgetId); return; }
    fetch('/api/config').then(r => r.json()).then(d => {
      const widgets = (d.pages || []).flatMap(p => Object.values(p.widgets || {}));
      const ov = widgets.find(w => w.type === 'overseerr');
      if (ov) { setResolvedId(ov.id); }
    }).catch(() => {});
  }, [overseerrWidgetId]);

  const load = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true); setError(null);
    try {
      const base = mode === 'upcoming' ? 'discover/movies/upcoming' : 'discover/movies';
      const params = mode === 'upcoming'
        ? `?_widgetId=${resolvedId}`
        : `?sortBy=theaters&language=en&_widgetId=${resolvedId}`;
      const r = await fetch(`/api/overseerr/${base}${params}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const rawMovies = (data.results || []).filter(m => m.mediaType === 'movie' || !m.mediaType).slice(0, 20);

      // Enrich movies that have no mediaInfo — fetch their individual status
      const enriched = await Promise.all(rawMovies.map(async movie => {
        if (movie.mediaInfo) return movie; // already has status
        try {
          const mr = await fetch(`/api/overseerr/movie/${movie.id}?_widgetId=${resolvedId}`);
          if (!mr.ok) return movie;
          const md = await mr.json();
          if (md.mediaInfo) return { ...movie, mediaInfo: md.mediaInfo };
        } catch {}
        return movie;
      }));

      setMovies(enriched);
      setCurrent(0);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [resolvedId, mode]);

  useEffect(() => { load(); const id = setInterval(load, 30 * 60000); return () => clearInterval(id); }, [load]);

  // Slideshow timer
  useEffect(() => {
    if (paused || movies.length <= 1) return;
    timer.current = setInterval(() => {
      setDir('next'); setCurrent(c => (c + 1) % movies.length);
    }, interval * 1000);
    return () => clearInterval(timer.current);
  }, [paused, movies.length, interval]);

  const go   = i => { clearInterval(timer.current); setDir(i > current ? 'next' : 'prev'); setCurrent(i); };
  const prev = () => { clearInterval(timer.current); setDir('prev'); setCurrent(c => (c - 1 + movies.length) % movies.length); };
  const next = () => { clearInterval(timer.current); setDir('next'); setCurrent(c => (c + 1) % movies.length); };

  if (!resolvedId) return (
    <div className="empty-state" style={{ flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '2em' }}>🎬</div>
      <div>Requires an Overseerr widget on your dashboard</div>
    </div>
  );
  if (loading && !movies.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error && !movies.length)   return <div className="widget-loading" style={{ color: 'var(--red)', fontSize: '0.85em' }}>⚠ {error}</div>;
  if (!movies.length)            return <div className="empty-state">No movies found</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>

      {/* Full-height slideshow */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#111', minHeight: 0 }}>
        {movies.map((movie, i) => (
          <Slide key={movie.id} movie={movie} active={i === current} direction={dir}
            transition={transition} overseerrWidgetId={resolvedId}
            showRequest={showRequest === true || showRequest === 'true'} />
        ))}

        {/* Arrows */}
        {movies.length > 1 && <>
          <button onClick={prev} style={{ position: 'absolute', left: 8, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '1.1em' }}>‹</button>
          <button onClick={next} style={{ position: 'absolute', right: 8, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '1.1em' }}>›</button>
        </>}


      </div>

      {/* Dot indicators */}
      {movies.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '5px 0 2px', flexWrap: 'wrap', flexShrink: 0 }}>
          {movies.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === current ? 16 : 6, height: 6, borderRadius: 3,
              background: i === current ? 'var(--accent)' : 'var(--border)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {(showProgressBar === true || showProgressBar === 'true') && !paused && movies.length > 1 && (
        <>
          <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
            <div key={`${current}-prog`} style={{ height: '100%', background: 'var(--accent)', borderRadius: 1, animation: `cinema-prog ${interval}s linear` }} />
          </div>
          <style>{`@keyframes cinema-prog { from{width:0%} to{width:100%} }`}</style>
        </>
      )}
    </div>
  );
}
