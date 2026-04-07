# WarrDash

A self-hosted homelab dashboard built from scratch. React + Vite frontend, Express.js backend, deployed via Docker on Proxmox LXC.

## Infrastructure

| Component | Details |
|---|---|
| LXC | 192.168.1.161 |
| Frontend | warrdash-frontend (nginx, port 3000) |
| Backend | warrdash-backend (Express, port 3001 internal) |
| Config | `/data/config.json` (mounted volume) |
| Source | `/opt/warrdash/` on LXC |

---

## Quick Deploy

```bash
# Frontend build & deploy
cd /opt/warrdash/frontend
npm run build
docker cp dist/. warrdash-frontend:/usr/share/nginx/html/

# Backend restart (after editing server.js)
docker restart warrdash-backend

# Save backend changes from container to disk
docker cp warrdash-backend:/app/server.js /opt/warrdash/backend/server.js
```

---

## Install & Update

```bash
# Fresh install on a new LXC
bash install.sh

# Update to latest (pulls git, rebuilds, restarts)
bash update.sh

# Flags
bash update.sh --skip-frontend   # backend only
bash update.sh --skip-backend    # frontend only
```

The update script automatically backs up `config.json` with a timestamp before doing anything.

---

## Widgets

| Widget | Type Key | Description | Special Setup |
|---|---|---|---|
| AC Fleet | `acfleet` | Assetto Corsa server fleet monitor | |
| AC Servers | `acservers` | AC dedicated server status | |
| AdGuard Home | `adguard` | DNS stats and query log | |
| Calendar | `calendar` | Upcoming calendar events | Google Calendar |
| Cinema | `cinema` | What's on at the cinema via Overseerr | See notes |
| Clock | `clock` | Date and time display | |
| Cloudflare | `cloudflare` | Tunnel and zone status | API token |
| Email | `email` | IMAP email — read, reply, compose | npm packages + IMAP |
| Frigate | `frigate` | Frigate NVR camera viewer | |
| Home Assistant | `homeassistant` | HA sensors and controls | |
| Notes & To-Do | `notes` | Sticky notes and task list | |
| Overseerr | `overseerr` | Media request queue and search | Search workaround |
| PBS | `pbs` | Proxmox Backup Server status | PBS 4.x workaround |
| Ping / Status | `ping` | Service status monitor | |
| Plex | `plex` | Recently added media slideshow | |
| Plex Now Playing | `plexnowplaying` | Live session viewer | |
| Proxmox | `proxmox` | Node stats and guest list | |
| Radarr | `radarr` | Movie queue and calendar | |
| RSS Reader | `rss` | Multi-feed RSS reader | |
| SABnzbd | `sabnzbd` | Download queue and speed | |
| Search | `search` | Search bar (engine in settings) | |
| Shopping List | `shopping` | Self-hosted shopping list | Separate service |
| Sonarr | `sonarr` | TV show queue and calendar | |
| Tailscale | `tailscale` | VPN peer status | |
| UniFi | `unifi` | Network device overview | |
| Unraid | `unraid` | Unraid server stats | |
| Weather | `weather` | Current weather and forecast | |
| Weather Radar | `weatherradar` | Live radar map | |
| Windows Stats | `windowsstats` | PC hardware stats via agent | Windows Agent |
| YouTube | `youtube` | RSS-based YouTube channel feed | No API key needed |

---

## Windows Agent

A Python-based system tray app that exposes PC stats over HTTP for the WindowsStatsWidget.

**Location:** `windows-agent/`

**Build (on Windows):**
1. Install Python from python.org — check "Add Python to PATH"
2. Double-click `build.bat` — installs deps and builds EXE
3. Find output in `installer/` folder — share this folder to deploy

**Ports:**
- `61209` — HTTP stats API (`/stats`, `/health`)
- `61210` — UDP auto-discovery broadcast

**For CPU temps:** Install LibreHardwareMonitor, run as Administrator, enable Options → Web Server (port 8085)

**GPU:** NVIDIA only, via `nvidia-smi` — works automatically if installed

---

## Email Widget Setup

Requires additional npm packages in the backend container:

```bash
docker exec warrdash-backend sh -c "cd /app && npm install imapflow mailparser nodemailer"
```

| Provider | IMAP Host | IMAP Port | SMTP Host | SMTP Port |
|---|---|---|---|---|
| Office 365 | outlook.office365.com | 993 | smtp.office365.com | 587 |
| Gmail | imap.gmail.com | 993 | smtp.gmail.com | 587 |
| Self-hosted | your.mail.server | 993 | your.mail.server | 587 |

**Gmail:** Use an App Password — Google Account → Security → App passwords

---

## PBS Setup

```bash
# On the PBS server — grant API token read access to datastore
proxmox-backup-manager acl update /datastore/PBS DatastoreReader \
  --auth-id 'root@pam!dash' --propagate true
```

Widget settings: URL, Token ID (`root@pam!dash`), Token Secret, Node name (`pbs`)

**Note:** PBS 4.x moved several API endpoints — the backend remaps them automatically.
See `docs/BACKEND_WORKAROUNDS.md` for full details.

**What works with DatastoreReader:**
- ✅ Datastore list, disk usage, estimated full date
- ✅ Snapshot list with VM/CT names
- ✅ GC stats (chunks, pending bytes, removed)
- ❌ Node CPU/RAM (requires root — not available via token)
- ❌ Task history (requires Sys.Audit — not available per path in PBS)

---

## Cinema Widget

Uses Overseerr's internal TMDb proxy — no separate TMDb API key needed.

- Shows movies currently in cinemas or coming soon
- Request button sends directly to Overseerr
- Tap synopsis text to expand full plot
- `pointerEvents: 'none'` required on inactive slides (see workarounds doc)

---

## Widget Development

### Adding a new widget

1. Create `frontend/src/widgets/MyWidget.jsx`
2. Add entry to `frontend/src/widgets/registry.js`
3. If backend routes needed, append to `backend/server.js`
4. Build and deploy

### Consistent styling — StatBox pattern

Copy these into every new widget (inline styles ensure they work before CSS loads):

```jsx
function StatBox({ children }) {
  return <div className="stat-box" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 8, display: 'flex', flexDirection: 'column' }}>{children}</div>;
}
function SectionLabel({ title }) {
  return <div className="section-label" style={{ fontSize: '0.68em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>{title}</div>;
}
function StatRow({ label, value, bar, barVal, barMax=100, barColor, note, color }) {
  const pct = Math.min(Math.max(((barVal||0)/barMax)*100,0),100);
  const auto = pct>85?'var(--red)':pct>65?'var(--amber)':'var(--accent)';
  return (
    <div className="stat-row" style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{fontSize:'0.75em',color:'var(--text-muted)',flexShrink:0,width:90}}>{label}</span>
      {bar&&<div style={{flex:1,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,transition:'width 0.4s',width:`${pct}%`,background:barColor||auto}}/></div>}
      <span style={{fontSize:'0.82em',fontWeight:600,color:color||barColor||'var(--text)',flexShrink:0,minWidth:54,textAlign:'right'}}>{value}</span>
      {note&&<span style={{fontSize:'0.7em',color:'var(--text-dim)',flexShrink:0}}>{note}</span>}
    </div>
  );
}
```

### Collapse support

All widgets receive a `collapsed` prop. Return a compact summary when true:

```jsx
export default function MyWidget({ settings = {}, widgetId, collapsed = false }) {
  if (collapsed) {
    return <div style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>Summary here</div>;
  }
  // full widget render
}
```

### Slideshow widgets

For any widget with a slideshow, inactive slides **must** have `pointerEvents: 'none'`
or they intercept clicks on the active slide:

```jsx
style={{
  opacity: active ? 1 : 0,
  pointerEvents: active ? 'auto' : 'none',  // REQUIRED
}}
```

---

## Known Issues & Workarounds

See `docs/BACKEND_WORKAROUNDS.md` for full details on:

- PBS 4.x endpoint changes (`admin/tasks` → `nodes/{node}/tasks` etc.)
- Overseerr search space encoding bug
- Overseerr `mediaInfo` field format (object vs integer)
- Email npm packages not in default `package.json`
- Cinema/Plex inactive slide pointer-events fix
- Widget collapse grid height management

---

## Architecture Notes

- Config saved to `/data/config.json` via `POST /api/config`
- Widget settings live at `pages[].widgets[].settings` in config
- All API calls proxied through backend (avoids CORS, hides credentials)
- `getWidgetSettings(widgetId, type)` in `server.js` resolves widget config by ID
- Glass mode CSS injected at module load time (not in useEffect) to avoid flash
- `.stat-box`, `.stat-row`, `.section-label` injected as global CSS by `GlassMode.jsx`
- Collapsed state saved as `widget.settings.collapsed` + `widget.settings.originalH`

