import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';

const ENGINES = {
  google:     { label: 'Google',     url: 'https://www.google.com/search?q=',             icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/google.png' },
  bing:       { label: 'Bing',       url: 'https://www.bing.com/search?q=',               icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/bing.png' },
  duckduckgo: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',                   icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/duckduckgo.png' },
  brave:      { label: 'Brave',      url: 'https://search.brave.com/search?q=',           icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/brave.png' },
  ecosia:     { label: 'Ecosia',     url: 'https://www.ecosia.org/search?q=',             icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/ecosia.png' },
  youtube:    { label: 'YouTube',    url: 'https://www.youtube.com/results?search_query=', icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/youtube.png' },
  github:     { label: 'GitHub',     url: 'https://github.com/search?q=',                 icon: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/github.png' },
  custom:     { label: 'Custom',     url: '',                                               icon: null },
};

export default function SearchWidget({ settings = {} }) {
  const {
    engine      = 'google',
    customUrl   = '',
    placeholder = 'Search…',
    openInNewTab = true,
  } = settings;

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const eng = ENGINES[engine] || ENGINES.google;
  const searchUrl = engine === 'custom' ? customUrl : eng.url;

  const doSearch = () => {
    if (!query.trim() || !searchUrl) return;
    const url = searchUrl + encodeURIComponent(query.trim());
    if (openInNewTab === true || openInNewTab === 'true') {
      window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = url;
    }
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>

        {/* Engine icon */}
        {eng.icon ? (
          <img src={eng.icon} alt={eng.label} width={22} height={22}
            style={{ borderRadius: 4, flexShrink: 0, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: '1.1em', flexShrink: 0 }}>🔍</span>
        )}

        {/* Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '8px 36px 8px 12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: '0.95em',
              fontFamily: 'var(--font-ui)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button onClick={doSearch} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', padding: 4, display: 'flex', alignItems: 'center',
          }}>
            <Search size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
