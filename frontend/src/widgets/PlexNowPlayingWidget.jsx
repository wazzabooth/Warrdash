import React, { useState, useEffect, useCallback, useRef } from 'react';

const PLEX_IMG = (plexUrl, token, path) => {
  if (!path || !plexUrl || !token) return null;
  return `${plexUrl.replace(/\/$/, '')}${path}?X-Plex-Token=${token}`;
};

function fmtTime(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}

function SessionSlide({ session, plexUrl, token, showUser, showPlayer, showProgress, active }) {
  const [expanded, setExpanded] = useState(false);
  const isEpisode = session.type === 'episode';
  const isMusic   = session.type === 'track';
  const title     = isEpisode ? session.grandparentTitle : (isMusic ? session.grandparentTitle || session.title : session.title);
  const subtitle  = isEpisode
    ? `S${session.parentIndex?.toString().padStart(2,'0') || '?'}E${session.index?.toString().padStart(2,'0') || '?'} · ${session.title}`
    : isMusic ? `${session.parentTitle || ''} · ${session.title}`
    : session.year?.toString();
  const thumbPath = isEpisode ? (session.grandparentThumb || session.thumb) : session.thumb;
  const artPath   = session.art || session.grandparentArt;
  const thumbUrl  = PLEX_IMG(plexUrl, token, thumbPath);
  const artUrl    = PLEX_IMG(plexUrl, token, artPath);
  const bgUrl     = artUrl || thumbUrl;
  const isPaused  = session.Player?.state === 'paused';
  const pct       = session.duration ? Math.min((session.viewOffset / session.duration) * 100, 100) : 0;
  const summary   = session.summary || '';
  const typeIcon  = isEpisode ? '📺' : isMusic ? '🎵' : '🎬';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      opacity: active ? 1 : 0,
      pointerEvents: active ? 'auto' : 'none',
      transition: 'opacity 0.4s ease',
    }}>
      {/* Full-widget background art */}
      {bgUrl && (
        <img src={bgUrl} alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%)', pointerEvents: 'none' }} />

      {/* Top bar — state + type */}
      <div style={{ position: 'absolute', top: 10, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', borderRadius: 6, padding: '3px 10px' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: isPaused ? 'var(--amber)' : 'var(--green)',
            boxShadow: `0 0 6px ${isPaused ? 'var(--amber)' : 'var(--green)'}`,
          }} />
          <span style={{ fontSize: '0.68em', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isPaused ? 'var(--amber)' : 'var(--green)' }}>
            {isPaused ? 'Paused' : 'Playing'}
          </span>
        </div>
        <span style={{ fontSize: '0.9em', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', borderRadius: 6, padding: '3px 8px' }}>{typeIcon}</span>
      </div>

      {/* Bottom info panel */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>

        {/* Title */}
        <div style={{ fontSize: '1.05em', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 3,
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

        {/* Synopsis — expandable */}
        {summary && (
          <div
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: '0.73em', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: 8,
              cursor: 'pointer',
              ...(expanded ? {
                maxHeight: 120, overflowY: 'auto',
              } : {
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }),
            }}
          >
            {summary}
            {!expanded && <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>tap to expand</span>}
          </div>
        )}

        {/* User / player */}
        {(showUser || showPlayer) && (
          <div style={{ display: 'flex', gap: 10, fontSize: '0.7em', color: 'rgba(255,255,255,0.4)', marginBottom: 6, flexWrap: 'wrap' }}>
            {showUser && session.User?.title && <span>👤 {session.User.title}</span>}
            {showPlayer && session.Player?.title && <span>📺 {session.Player.title}</span>}
            {showPlayer && session.Player?.device && <span>· {session.Player.device}</span>}
          </div>
        )}

        {/* Progress */}
        {showProgress && session.duration > 0 && (
          <>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isPaused ? 'var(--amber)' : 'var(--accent)', borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67em', color: 'rgba(255,255,255,0.35)' }}>
              <span>{fmtTime(session.viewOffset)}</span>
              <span>{fmtTime(session.duration)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PlexNowPlayingWidget({ settings = {}, widgetId }) {
  const {
    url, token,
    showUser     = true,
    showPlayer   = true,
    showProgress = true,
  } = settings;

  const [sessions, setSessions] = useState([]);
  const [current,  setCurrent]  = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!url || !token) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/plex/status/sessions?_widgetId=${widgetId}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const newSessions = data?.MediaContainer?.Metadata || [];
      setSessions(newSessions);
      // Keep current index in bounds
      setCurrent(c => Math.min(c, Math.max(newSessions.length - 1, 0)));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [url, token, widgetId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  if (!url) return <div className="empty-state">Configure Plex URL & token in settings</div>;
  if (loading && !sessions.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error) return <div className="widget-loading" style={{ color: 'var(--red)', fontSize: '0.85em' }}>⚠ {error}</div>;

  if (!sessions.length) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ fontSize: '2.5em' }}>🎬</div>
      <div style={{ fontSize: '0.85em', color: 'var(--text-dim)' }}>Nothing playing</div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Full-height slideshow area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#111', minHeight: 0 }}>
        {sessions.map((s, i) => (
          <SessionSlide
            key={s.sessionKey || i}
            session={s}
            plexUrl={url}
            token={token}
            active={i === current}
            showUser={showUser === true || showUser === 'true'}
            showPlayer={showPlayer === true || showPlayer === 'true'}
            showProgress={showProgress === true || showProgress === 'true'}
          />
        ))}

        {/* Session nav arrows — only if multiple */}
        {sessions.length > 1 && (
          <>
            <button onClick={() => setCurrent(c => (c - 1 + sessions.length) % sessions.length)}
              style={{ position: 'absolute', left: 8, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '1.1em' }}>‹</button>
            <button onClick={() => setCurrent(c => (c + 1) % sessions.length)}
              style={{ position: 'absolute', right: 8, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '1.1em' }}>›</button>
          </>
        )}
      </div>

      {/* Session dots */}
      {sessions.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '5px 0 2px', flexShrink: 0 }}>
          {sessions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 16 : 6, height: 6, borderRadius: 3,
              background: i === current ? 'var(--accent)' : 'var(--border)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
