# Initial Setup Guide

## Prerequisites

- Proxmox VE with LXC support
- Docker installed in LXC
- Node.js 18+ in LXC (for building frontend)

## LXC Setup

Create an LXC container (Ubuntu 22.04 recommended):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create directory
mkdir -p /opt/warrdash/backend
mkdir -p /opt/warrdash/frontend
mkdir -p /data
```

## Docker Compose

```yaml
version: '3.8'
services:
  warrdash-backend:
    image: node:20-alpine
    container_name: warrdash-backend
    working_dir: /app
    command: node server.js
    volumes:
      - /opt/warrdash/backend:/app
      - /data:/data
    ports:
      - "3001:3001"
    restart: unless-stopped

  warrdash-frontend:
    image: nginx:alpine
    container_name: warrdash-frontend
    ports:
      - "3000:80"
    restart: unless-stopped
```

## Backend Setup

```bash
cd /opt/warrdash/backend
npm install
# Install email packages
npm install imapflow mailparser nodemailer
node server.js
```

## Frontend Build

```bash
cd /opt/warrdash/frontend
npm install
npm run build
docker cp dist/. warrdash-frontend:/usr/share/nginx/html/
```

## First Run

Navigate to `http://192.168.1.161:3000` — you'll see an empty dashboard.
Use "Add Widget" to start building your layout.

Config is auto-saved to `/data/config.json`.
