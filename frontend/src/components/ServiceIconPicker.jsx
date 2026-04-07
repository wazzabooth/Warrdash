import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const CDN = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/';

// Curated popular service names from the walkxcode icon set
const SUGGESTIONS = [
  'home-assistant','speedtest-tracker','proxmox','portainer','grafana','plex',
  'jellyfin','sonarr','radarr','sabnzbd','qbittorrent','adguard-home','tailscale',
  'uptime-kuma','nextcloud','immich','frigate','gitea','n8n','audiobookshelf',
  'overseerr','tautulli','cloudflare','unifi','nginx','vaultwarden','bitwarden',
  'pihole','truenas','docker','kubernetes','traefik','caddy','syncthing',
  'homebridge','node-red','esphome','zigbee2mqtt','mqtt','influxdb','loki',
  'prometheus','alertmanager','calibre','calibre-web','kavita','komga',
  'bazarr','prowlarr','lidarr','readarr','mylar3','recyclarr',
  'speedtest','iperf','glances','netdata','dozzle','watchtower',
  'authelia','authentik','keycloak','vaultwarden','miniflux','freshrss',
  'mealie','grocy','firefly-iii','actual','tandoor','linkwarden',
  'stirling-pdf','paperless-ngx','memos','silverbullet','obsidian',
];

const inputStyle = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', padding: '6px 10px',
  fontSize: '0.85em', width: '100%', boxSizing: 'border-box',
};

export default function ServiceIconPicker({ value, onChange }) {
  const [query, setQuery]       = useState('');
  const [preview, setPreview]   = useState(value || '');
  const [imgOk, setImgOk]       = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const slug = q => q.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const tryIcon = (name) => {
    const url = CDN + slug(name) + '.png';
    setPreview(url);
    setImgOk(false);
    onChange(url);
    setShowDrop(false);
    setQuery(name);
  };

  const filtered = query.length > 0
    ? SUGGESTIONS.filter(s => s.includes(slug(query))).slice(0, 12)
    : [];

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setShowDrop(true);
    if (!v) { setPreview(''); onChange(''); }
    else {
      const url = CDN + slug(v) + '.png';
      setPreview(url);
      setImgOk(false);
      onChange(url);
    }
  };

  const clear = () => { setQuery(''); setPreview(''); onChange(''); setImgOk(false); };

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Preview box */}
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 8,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {preview ? (
            <img src={preview} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }}
              onLoad={() => setImgOk(true)}
              onError={() => setImgOk(false)} />
          ) : (
            <span style={{ fontSize: '1.2em', color: 'var(--text-dim)' }}>?</span>
          )}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            style={{ ...inputStyle, paddingLeft: 26, paddingRight: 28 }}
            placeholder="Search service name (e.g. speedtest-tracker)…"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query && setShowDrop(true)}
          />
          {query && (
            <button onClick={clear} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-dim)' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {preview && (
        <div style={{ fontSize: '0.72em', color: imgOk ? 'var(--green)' : 'var(--text-dim)', paddingLeft: 44 }}>
          {imgOk ? '✓ Icon found' : '⏳ Checking…'} — {preview}
        </div>
      )}

      {/* Dropdown suggestions */}
      {showDrop && filtered.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        }}>
          {filtered.map(name => (
            <button key={name} onClick={() => tryIcon(name)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 4px', cursor: 'pointer', border: 'none',
                background: 'transparent', borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img src={CDN + name + '.png'} alt={name}
                style={{ width: 24, height: 24, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
              <span style={{ fontSize: '0.65em', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.2, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.72em', color: 'var(--text-dim)', paddingLeft: 44 }}>
        Uses <a href="https://github.com/walkxcode/dashboard-icons" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>walkxcode/dashboard-icons</a> — same set as all other widgets. Leave blank to keep the default service icon.
      </div>
    </div>
  );
}
