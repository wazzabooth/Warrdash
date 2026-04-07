import React, { useState, useEffect, useCallback, useRef } from 'react';

const STATUS_MAP = {
  1: { label: 'Pending',    color: 'var(--amber)'  },
  2: { label: 'Approved',   color: 'var(--green)'  },
  3: { label: 'Declined',   color: 'var(--red)'    },
  4: { label: 'Available',  color: 'var(--accent)' },
  5: { label: 'Processing', color: 'var(--accent)' },
};

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

function Poster({ path, isMovie }) {
  const [err, setErr] = useState(false);
  if (!path || err) return <span style={{ fontSize: '1.1em', flexShrink: 0 }}>{isMovie ? '🎬' : '📺'}</span>;
  return <img src={`${TMDB_IMG}${path}`} alt="" onError={() => setErr(true)}
    style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />;
}

function SearchPoster({ path }) {
  const [err, setErr] = useState(false);
  if (!path || err) return <div style={{ width: 48, height: 72, borderRadius: 6, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎬</div>;
  return <img src={`https://image.tmdb.org/t/p/w92${path}`} alt="" onError={() => setErr(true)}
    style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />;
}

function RequestButton({ item, widgetId, onDone }) {
  const [state, setState] = useState('idle');
  const ms = item.mediaInfo?.status;
  // Overseerr mediaInfo status: 1=Unknown, 2=Pending, 3=Processing, 4=Partially Available, 5=Available
  if (ms === 5) return <span style={{ fontSize: '0.72em', color: 'var(--green)', fontWeight: 600 }}>✓ Available</span>;
  if (ms === 4) return <span style={{ fontSize: '0.72em', color: 'var(--green)', fontWeight: 600 }}>~ Partial</span>;
  if (ms === 3) return <span style={{ fontSize: '0.72em', color: 'var(--accent)', fontWeight: 600 }}>⚙ Processing</span>;
  if (ms === 2) return <span style={{ fontSize: '0.72em', color: 'var(--amber)', fontWeight: 600 }}>⌛ Pending</span>;
  if (state === 'exists') return <span style={{ fontSize: '0.72em', color: 'var(--accent)', fontWeight: 600 }}>✓ In Library</span>;
  if (state === 'done') return <span style={{ fontSize: '0.72em', color: 'var(--green)', fontWeight: 600 }}>✓ Requested!</span>;
  if (state === 'error') return <span style={{ fontSize: '0.72em', color: 'var(--red)', fontWeight: 600 }}>✗ Failed</span>;

  const doRequest = async () => {
    setState('loading');
    try {
      const body = { mediaType: item.mediaType, mediaId: item.id };
      if (item.mediaType === 'tv') body.seasons = 'all';
      const r = await fetch(`/api/overseerr/request?_widgetId=${widgetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      // 400 with "already exists" or similar = it's in the library
      if (r.status === 400) { setState('exists'); return; }
      if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
      setState('done');
      setTimeout(onDone, 1500);
    } catch(e) {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <button onClick={doRequest} disabled={state === 'loading'} className="btn primary"
      style={{ fontSize: '0.75em', padding: '3px 10px', justifyContent: 'center' }}>
      {state === 'loading' ? <><div className="spinner" style={{ width: 10, height: 10 }} /> …</> : '+ Request'}
    </button>
  );
}

function SearchCard({ item, widgetId, onRequested }) {
  const year = (item.releaseDate || item.firstAirDate || '').slice(0, 4);
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <SearchPoster path={item.posterPath} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85em', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title || item.name}
        </div>
        <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', marginBottom: 4 }}>
          {item.mediaType === 'movie' ? '🎬 Movie' : '📺 TV'}{year ? ` · ${year}` : ''}
        </div>
        {item.overview && (
          <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', lineHeight: 1.3, marginBottom: 4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.overview}
          </div>
        )}
        <RequestButton item={item} widgetId={widgetId} onDone={onRequested} />
      </div>
    </div>
  );
}

function RequestCard({ req, showRequester, showDate }) {
  const s = STATUS_MAP[req.status] || { label: 'Unknown', color: 'var(--text-dim)' };
  const title = req.media?.title || req.media?.originalTitle || req.media?.name || req.media?.originalName || '—';
  const year = (req.media?.releaseDate || req.media?.firstAirDate || '').slice(0, 4);
  const isMovie = req.media?.mediaType === 'movie' || req.type === 'movie';

  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
      <Poster path={req.media?.posterPath} isMovie={isMovie} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}{year ? ` (${year})` : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: '0.72em', color: 'var(--text-dim)', marginTop: 1 }}>
          {showRequester && req.requestedBy?.displayName && <span>{req.requestedBy.displayName}</span>}
          {showDate && req.createdAt && <span>{new Date(req.createdAt).toLocaleDateString('en-GB')}</span>}
        </div>
      </div>
      <span style={{ fontSize: '0.72em', fontWeight: 600, color: s.color, flexShrink: 0, background: 'var(--surface2)', padding: '2px 7px', borderRadius: 4 }}>
        {s.label}
      </span>
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

export default function OverseerrWidget({ settings = {}, widgetId }) {
  const { showSummary = true, showRequester = true, showDate = true, hideApproved = false } = settings;

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [tab,       setTab]       = useState('requests');
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState(null);
  const timer = useRef(null);

  const loadRequests = useCallback(async () => {
    if (!settings.url || !settings.apiKey) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/overseerr/request?take=100&sort=added&_widgetId=${widgetId}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const rawResults = data?.results || [];

      // Enrich titles for requests that only have tmdbId
      const enriched = await Promise.allSettled(rawResults.map(async req => {
        if (req.media?.title || req.media?.name || req.media?.originalTitle) return req;
        const tmdbId = req.media?.tmdbId || req.media?.id;
        const mediaType = req.media?.mediaType || req.type;
        if (!tmdbId || !mediaType) return req;
        try {
          const mr = await fetch(`/api/overseerr/${mediaType}/${tmdbId}?_widgetId=${widgetId}`);
          if (!mr.ok) return req;
          const md = await mr.json();
          if (md.title || md.name) return { ...req, media: { ...req.media, ...md } };
        } catch(e) {}
        return req;
      })).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));

      setRequests(enriched);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [settings.url, settings.apiKey, widgetId]);

  useEffect(() => {
    loadRequests();
    const id = setInterval(loadRequests, 2 * 60000);
    return () => clearInterval(id);
  }, [loadRequests]);

  // Debounced search
  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim() || query.length < 3) { setResults([]); setSearchErr(null); return; }
    timer.current = setTimeout(async () => {
      setSearching(true); setSearchErr(null);
      try {
        const r = await fetch(`/api/osearch?q=${encodeURIComponent(query.trim())}&_widgetId=${widgetId}`);
        if (r.status === 400) { setResults([]); return; }
        const data = await r.json();
        if (data.error) throw new Error(data.error);
        setResults((data?.results || []).filter(r => r.mediaType === 'movie' || r.mediaType === 'tv').slice(0, 12));
      } catch(e) { setSearchErr(e.message); }
      finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [query, widgetId]);

  if (!settings.url) return <div className="empty-state">Configure Overseerr URL & API key in settings</div>;

  const shouldHide = hideApproved === true || hideApproved === 'true';
  // Only show pending (1) and declined (3) when hideApproved is on
  const visible = shouldHide
    ? requests.filter(r => r.status === 1 || r.status === 3)
    : requests;

  const pending  = requests.filter(r => r.status === 1).length;
  const approved = requests.filter(r => r.status === 2).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {showSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flexShrink: 0, marginBottom: 8 }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4em', color: 'var(--amber)', fontWeight: 700 }}>{pending}</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68em', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4em', color: 'var(--green)', fontWeight: 700 }}>{approved}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginBottom: 8 }}>
        <button onClick={() => setTab('requests')} className={`btn ${tab === 'requests' ? 'primary' : 'ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.78em' }}>📋 Requests</button>
        <button onClick={() => setTab('search')} className={`btn ${tab === 'search' ? 'primary' : 'ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.78em' }}>🔍 Search</button>
      </div>

      {/* REQUESTS TAB */}
      {tab === 'requests' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loading && !requests.length && <div className="widget-loading"><div className="spinner" /></div>}
          {error && <div style={{ color: 'var(--red)', fontSize: '0.8em', padding: 8 }}>⚠ {error}</div>}
          {!loading && !error && visible.length === 0 && (
            <div className="empty-state">{shouldHide ? 'No pending requests' : 'No requests yet'}</div>
          )}
          {visible.length > 0 && (
            <div className="stat-box" style={{ padding: 0 }}>
              {visible.map(r => <RequestCard key={r.id} req={r} showRequester={showRequester} showDate={showDate} />)}
            </div>
          )}
        </div>
      )}

      {/* SEARCH TAB */}
      {tab === 'search' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search movies & TV shows…"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 32px', fontSize: '0.85em', outline: 'none' }} />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2 }}>✕</button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {searching && <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-dim)', fontSize: '0.8em' }}><div className="spinner" style={{ margin: '0 auto 6px' }} />Searching…</div>}
            {searchErr && <div style={{ color: 'var(--red)', fontSize: '0.8em', padding: 8 }}>⚠ {searchErr}</div>}
            {!searching && query.length >= 3 && results.length === 0 && !searchErr && <div className="empty-state">No results for "{query}"</div>}
            {!searching && query.length < 3 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: '0.8em' }}>Type at least 3 characters to search</div>}
            {results.map(item => (
              <SearchCard key={`${item.mediaType}-${item.id}`} item={item} widgetId={widgetId} onRequested={loadRequests} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
