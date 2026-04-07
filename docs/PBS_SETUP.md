# Proxmox Backup Server Setup

## PBS 4.x API Changes

PBS 4.x moved several API endpoints that WarrDash relied on. The backend automatically
remaps these, but you need to understand the permission requirements.

## API Token Setup

1. In PBS web UI: **Configuration → Access Control → API Tokens**
2. Add token: `root@pam` → Token name: `dash`
3. Note the generated secret (only shown once)

## Required Permissions

```bash
# On the PBS server
proxmox-backup-manager acl update /datastore/PBS DatastoreReader \
  --auth-id 'root@pam!dash' --propagate true

# Verify
proxmox-backup-manager acl list
```

Expected output:
```
┌───────────────┬────────────────┬───────────┬─────────────────┐
│ ugid          │ path           │ propagate │ roleid          │
╞═══════════════╪════════════════╪═══════════╪═════════════════╡
│ root@pam!dash │ /datastore/PBS │         1 │ DatastoreReader │
└───────────────┴────────────────┴───────────┴─────────────────┘
```

## Widget Settings

| Setting | Value |
|---|---|
| URL | https://192.168.1.214:8007 |
| Token ID | root@pam!dash |
| Token Secret | (from step 2) |
| Node | pbs |

## What Works With DatastoreReader

- ✅ Datastore list and disk usage
- ✅ Snapshot list (per datastore)
- ✅ Estimated full date
- ✅ GC status (disk chunks, pending bytes etc)
- ✅ Datastore status

## What Requires Root Access (Not Available via Token)

- ❌ Node CPU/RAM stats (`nodes/{node}/status`)
- ❌ Task history (`nodes/{node}/tasks`) — needs Sys.Audit which isn't available per-path

## Endpoint Remapping (Applied Automatically in Backend)

| Widget Calls | PBS 4.x Actual Endpoint |
|---|---|
| `tasks` | `nodes/pbs/tasks` |
| `admin/tasks` | `nodes/pbs/tasks` |
| `datastores` | `admin/datastore` |
