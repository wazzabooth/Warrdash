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
# Frontend
cd /opt/warrdash/frontend
npm run build
docker cp dist/. warrdash-frontend:/usr/share/nginx/html/

# Backend (after editing server.js)
docker restart warrdash-backend

# Save backend changes from container to disk
docker cp warrdash-backend:/app/server.js /opt/warrdash/backend/server.js
```

---

## Widgets

| Widget | Description | Notes |
|---|---|---|
| CinemaWidget | Now Playing / Coming Soon via Overseerr | Synopsis overlay, request button |
| EmailWidget | IMAP email client | Read, reply, compose. Requires npm packages |
| PBSWidget | Proxmox Backup Server | Uses `status/datastore-usage` endpoint |
| PlexWidget | Recently Added slideshow | Full-poster fill, expandable synopsis |
| PlexNowPlayingWidget | Live Plex sessions | Multi-session with dots |
| WindowsStatsWidget | PC stats via Windows Agent | CPU, RAM, GPU, disks, network |
| SearchWidget | Search bar | Engine selected in settings |
| OverseerrWidget | Request queue + search | Search has workaround (see docs) |
| HomeAssistantWidget | HA sensors and controls | |
| ShoppingListWidget | Self-hosted shopping list | Requires separate shopping-list service |
| YouTubeWidget | RSS-based YouTube feed | No API key needed |
| RSSWidget | Multi-feed RSS reader | |
| FrigateWidget | Frigate NVR camera viewer | |

---

## Windows Agent

A Python-based system tray app that exposes PC stats via HTTP for the WindowsStatsWidget.

**Location:** `windows-agent/`

**Features:**
- CPU, RAM, disk, network stats via `psutil`
- GPU stats via `nvidia-smi` (NVIDIA only)
- CPU temps via LibreHardwareMonitor REST API (optional)
- UDP auto-discovery broadcast on port 61210
- System tray with status page, copy URL, auto-start toggle

**Build (on Windows):**
1. Install Python from python.org (check "Add Python to PATH")
2. Double-click `build.bat`
3. Find installer in `installer/` folder

**Ports:**
- `61209` — HTTP stats API
- `61210` — UDP discovery

**For CPU temps:** Install LibreHardwareMonitor, run as Administrator, enable Options → Web Server

---

## Email Widget Setup

The email widget requires additional npm packages in the backend container:

```bash
docker exec warrdash-backend sh -c "cd /app && npm install imapflow mailparser nodemailer"
```

### Office 365
| Setting | Value |
|---|---|
| IMAP Host | outlook.office365.com |
| IMAP Port | 993 (TLS on) |
| SMTP Host | smtp.office365.com |
| SMTP Port | 587 |

### Gmail
| Setting | Value |
|---|---|
| IMAP Host | imap.gmail.com |
| IMAP Port | 993 |
| SMTP Host | smtp.gmail.com |
| SMTP Port | 587 |
| Password | App Password (not regular password) |

---

## PBS Setup

1. Create API token in PBS web UI: Configuration → Access → API Tokens
2. Grant permissions:
```bash
proxmox-backup-manager acl update /datastore/PBS DatastoreReader \
  --auth-id 'root@pam!dash' --propagate true
```
3. Configure widget with token ID (`root@pam!dash`) and secret

**Note:** PBS 4.x moved API endpoints. See `docs/BACKEND_WORKAROUNDS.md` for details.

---

## Widget Development

### Adding a new widget

1. Create `frontend/src/widgets/MyWidget.jsx`
2. Add entry to `frontend/src/widgets/registry.js`
3. If backend routes needed, append to `backend/server.js`
4. Build and deploy

### Consistent styling

Use these shared components (inline styles as fallback ensure they work before CSS loads):

```jsx
function StatBox({ children }) {
  return <div className="stat-box" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 8, display: 'flex', flexDirection: 'column' }}>{children}</div>;
}

function SectionLabel({ title }) {
  return <div className="section-label" style={{ fontSize: '0.68em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>{title}</div>;
}
```

### Collapse support

Widgets receive a `collapsed` prop when the widget header chevron is clicked.
Render a compact summary when `collapsed === true`:

```jsx
export default function MyWidget({ settings = {}, widgetId, collapsed = false }) {
  if (collapsed) {
    return <div style={{ fontSize: '0.78em' }}>Summary here</div>;
  }
  // full widget
}
```

---

## Known Issues & Workarounds

See `docs/BACKEND_WORKAROUNDS.md` for full details on:
- PBS 4.x endpoint changes
- Overseerr search encoding bug
- Overseerr mediaInfo field format
- Email npm package requirements
- Cinema/Plex slide pointer-events fix

---

## Architecture Notes

- Config saved to `/data/config.json` via `POST /api/config`
- Widget settings stored inside config under `pages[].widgets[].settings`
- All API calls proxied through backend (avoids CORS, hides credentials)
- `getWidgetSettings(widgetId, type)` in server.js resolves widget config
- Glass mode CSS injected at module load time via `GlassMode.jsx`
- `.stat-box`, `.stat-row`, `.section-label` are global utility classes
