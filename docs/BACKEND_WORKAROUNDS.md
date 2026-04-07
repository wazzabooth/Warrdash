# Backend Workarounds & Patches

This document records all patches applied to `server.js` that are not obvious from the code.
These are **required** — the app will not work correctly without them.

---

## 1. PBS (Proxmox Backup Server) — API Endpoint Changes in PBS 4.x

PBS 4.x moved several API endpoints. The backend wildcard route `/api/pbs/:endpoint(*)`
needs to remap old paths to new ones.

### What was changed

The first `app.get('/api/pbs/:endpoint(*)')` handler was patched to include an `epMap`:

```js
const epMap = {
  'tasks':         'nodes/' + pbsNode + '/tasks',
  'admin/tasks':   'nodes/' + pbsNode + '/tasks',
  'datastores':    'admin/datastore',
};
const pbsEndpoint = epMap[req.params.endpoint] || req.params.endpoint;
```

Where `pbsNode` comes from `settings.node || 'pbs'`.

### Why

| Old endpoint (PBS 3.x) | New endpoint (PBS 4.x) |
|---|---|
| `admin/tasks` | `nodes/{node}/tasks` |
| `tasks` | `nodes/{node}/tasks` |
| `datastores` | `admin/datastore` |

### PBS API Token Permissions Required

The token `root@pam!dash` needs the following ACL:

```bash
proxmox-backup-manager acl update /datastore/PBS DatastoreReader --auth-id 'root@pam!dash' --propagate true
```

Without this, `admin/datastore` returns an empty array even though datastores exist.

### PBS Status/Datastore-Usage

The widget uses `status/datastore-usage` for rich store data (includes `estimated-full-date`,
`gc-status`, history). This endpoint works with `DatastoreReader` on `/datastore/PBS`.

Node-level stats (CPU/RAM) require root access and are not available via API token in PBS.

---

## 2. Overseerr — Search Endpoint Space Encoding Bug

The Overseerr search endpoint has a bug where spaces in query strings get double-encoded
when passing through axios.

### Problem
`encodeURIComponent('hello world')` → `hello%20world`, but axios re-encodes the `%` → `hello%2520world`

### Fix
A dedicated `/api/osearch` route was added that builds the URL directly:

```js
app.get('/api/osearch', async (req, res) => {
  const q = encodeURIComponent(req.query.q || '');
  const url = `${settings.url}/api/v1/search?query=${q}&page=1&language=en`;
  // fetch directly without axios re-encoding
});
```

---

## 3. Overseerr — mediaInfo Field Format

The Overseerr discover endpoint returns `mediaInfo` as a **full object** `{status: N, ...}`,
not as a plain integer. However, other endpoints return it as an integer.

Always use this helper:

```js
function getMediaStatus(movie) {
  if (!movie.mediaInfo) return null;
  if (typeof movie.mediaInfo === 'object') return movie.mediaInfo.status;
  return movie.mediaInfo;
}
```

Status codes: `2` = Pending, `3` = Processing/In Radarr, `4` = Partial, `5` = Available in Plex

---

## 4. Email — npm Packages

The email routes require packages that must be installed in the backend container:

```bash
docker exec warrdash-backend sh -c "cd /app && npm install imapflow mailparser nodemailer"
```

**These are not in the original `package.json`** — they must be installed manually after
deploying the container, or added to `package.json` before building the image.

### Office 365 Settings
- IMAP: `outlook.office365.com:993` TLS on
- SMTP: `smtp.office365.com:587`

### Gmail Settings  
- IMAP: `imap.gmail.com:993`
- SMTP: `smtp.gmail.com:587`
- Requires an **App Password** (not your regular Google password)
- Enable in: Google Account → Security → 2-Step Verification → App passwords

---

## 5. Cinema Widget — Inactive Slide Pointer Events

All 20 slides render simultaneously as `position: absolute` layers. Inactive slides
(opacity 0) must have `pointerEvents: 'none'` or they intercept all clicks:

```jsx
const getStyle = () => {
  if (!active) {
    return { opacity: 0, pointerEvents: 'none' }; // REQUIRED
  }
  return { opacity: 1, pointerEvents: 'auto' };
};
```

This applies to **CinemaWidget**, **PlexWidget**, and **PlexNowPlayingWidget**.

---

## 6. Widget Collapse — Grid Height

When collapsing a widget, the `react-grid-layout` `h` must be set to `1` and `minH` to `1`,
and the original height saved to `widget.settings.originalH`. On expand, restore from there.

The collapsed state is saved in `widget.settings.collapsed` (persists to config.json).

---

## 7. PBS — Tasks Always Empty

If tasks return `{total: 0, data: []}` even though backups have run, the token lacks
`Sys.Audit` on the node. There is no valid ACL path `/nodes` in PBS — node-level task
history requires using `root@pam` directly, not an API token.

Workaround: the widget gracefully shows "No tasks found" and explains the limitation.

