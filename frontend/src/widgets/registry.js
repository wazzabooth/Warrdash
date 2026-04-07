import SABnzbdWidget from './SABnzbdWidget.jsx';
import TailscaleWidget from './TailscaleWidget.jsx';
import UnraidWidget from './UnraidWidget.jsx';
import JellyfinWidget from './JellyfinWidget.jsx';
import PortainerWidget from './PortainerWidget.jsx';
import ProwlarrWidget from './ProwlarrWidget.jsx';
import BazarrWidget from './BazarrWidget.jsx';
import QbittorrentWidget from './QbittorrentWidget.jsx';
import ImmichWidget from './ImmichWidget.jsx';
import PBSWidget from './PBSWidget.jsx';
import CloudflareWidget from './CloudflareWidget.jsx';
import ProxmoxUpdaterWidget from './ProxmoxUpdaterWidget.jsx';
import YouTubeWidget from './YouTubeWidget.jsx';
import RSSWidget from './RSSWidget.jsx';
import WeatherRadarWidget from './WeatherRadarWidget.jsx';
import PackageTrackerWidget from './PackageTrackerWidget.jsx';
import FuelPricesWidget from './FuelPricesWidget.jsx';
import CalendarWidget from './CalendarWidget.jsx';
import GiteaWidget from './GiteaWidget.jsx';
import N8NWidget from './N8nWidget.jsx';
import AudiobookshelfWidget from './AudiobookshelfWidget.jsx';
import UptimeKumaWidget from './UptimeKumaWidget.jsx';
import PaperlessWidget from './PaperlessWidget.jsx';
import ACServerWidget from './ACServerWidget.jsx';
import SearchWidget from './SearchWidget.jsx';
import CinemaWidget from './CinemaWidget.jsx';
import EmailWidget from './EmailWidget.jsx';
import ClaudeWidget from './ClaudeWidget.jsx';
import NotesWidget from './NotesWidget.jsx';
import TravelTimeWidget from './TravelTimeWidget.jsx';
import ACServersWidget from './ACServersWidget.jsx';
import TautulliWidget from './TautulliWidget.jsx';
import LidarrWidget from './LidarrWidget.jsx';
import ReadarrWidget from './ReadarrWidget.jsx';
import GrafanaWidget from './GrafanaWidget.jsx';
import SpeedtestWidget from './SpeedtestWidget.jsx';
import FrigateWidget from './FrigateWidget.jsx';
import NextcloudWidget from './NextcloudWidget.jsx';
import ACFleetWidget from './ACFleetWidget.jsx';
import PingWidget from './PingWidget.jsx';
import UnifiWidget from './UnifiWidget.jsx';
import ShoppingListWidget from './ShoppingListWidget.jsx';
import WebEmbedWidget from './WebEmbedWidget.jsx';
import ClockWidget from './ClockWidget.jsx';
import WeatherWidget from './WeatherWidget.jsx';
import SonarrWidget from './SonarrWidget.jsx';
import RadarrWidget from './RadarrWidget.jsx';
import PlexWidget from './PlexWidget.jsx';
import PlexNowPlayingWidget from './PlexNowPlayingWidget.jsx';
import OverseerrWidget from './OverseerrWidget.jsx';
import HomeAssistantWidget from './HomeAssistantWidget.jsx';
import ProxmoxWidget from './ProxmoxWidget.jsx';
import QuickLinksWidget from './QuickLinksWidget.jsx';
import AdGuardWidget from './AdGuardWidget.jsx';
import WindowsStatsWidget from './WindowsStatsWidget.jsx';

export const WIDGET_REGISTRY = {
  unifi: {
    label: 'UniFi Network', testConnection: true, icon: '📡',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/unifi.png',
    component: UnifiWidget, defaultSize: { w: 4, h: 6 },
    description: 'Clients, devices, WAN status & throughput',
    settingsFields: [
      { key: 'url',        label: 'Controller URL',  placeholder: 'https://192.168.1.1 or https://192.168.1.1:8443', type: 'text' },
      { key: 'unifiType',  label: 'Controller type',  type: 'select', options: ['controller', 'udm'] },
      { key: 'site',       label: 'Site name',        placeholder: 'default', type: 'text' },
      { key: 'authType',   label: 'Authentication',   type: 'authtoggle', options: ['credentials', 'apitoken'] },
      { key: 'username',   label: 'Username',         type: 'text',     showIf: s => (s.authType || 'credentials') !== 'apitoken' },
      { key: 'password',   label: 'Password',         type: 'password', showIf: s => (s.authType || 'credentials') !== 'apitoken' },
      { key: 'apiToken',   label: 'API Token',        type: 'password', showIf: s => s.authType === 'apitoken',
        hint: 'UniFi OS only — Settings → Admins → API Tokens' },
      { key: 'siteName',   label: 'Display name',     placeholder: 'Home Network', type: 'text' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'https://192.168.1.x', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['overview','clients','devices'] },
    ],
    defaultSettings: { site: 'default', unifiType: 'controller', siteName: 'Home Network', authType: 'credentials', defaultTab: 'overview' },
  },
  unraid: {
    label: 'Unraid', icon: '🖥',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/unraid.png',
    component: UnraidWidget, defaultSize: { w: 5, h: 6 },
    description: 'Array status, disks, Docker containers & VMs', testConnection: true,
    settingsFields: [
      { key: 'url',        label: 'Unraid URL', placeholder: 'http://192.168.1.99', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password',
        hint: 'Settings → Management Access → API Keys → Create API Key' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.99', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['overview','disks','docker','vms'] },
    ],
    defaultSettings: { url: 'http://192.168.1.99', serviceUrl: 'http://192.168.1.99', defaultTab: 'overview' },
  },
  tailscale: {
    label: 'Tailscale', icon: '🔒',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/tailscale.png',
    component: TailscaleWidget, testConnection: true, defaultSize: { w: 4, h: 5 },
    description: 'VPN device status — online/offline, IPs & OS',
    settingsFields: [
      { key: 'apiKey',     label: 'API Key', type: 'password',
        hint: 'tailscale.com → Settings → Keys → Generate access token' },
      { key: 'tailnet',    label: 'Tailnet name', placeholder: 'yourname@gmail.com or example.com', type: 'text' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'https://login.tailscale.com/admin/machines', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['devices','online','offline'] },
    ],
    defaultSettings: { serviceUrl: 'https://login.tailscale.com/admin/machines', defaultTab: 'devices' },
  },
  sabnzbd: {
    label: 'SABnzbd', icon: '📥',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/sabnzbd.png',
    component: SABnzbdWidget, testConnection: true, defaultSize: { w: 4, h: 6 },
    description: 'Download queue, speed, history & disk space',
    settingsFields: [
      { key: 'url',        label: 'SABnzbd URL', placeholder: 'http://192.168.1.x:8080', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8080', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['queue','history'] },
    ],
    defaultSettings: { defaultTab: 'queue' },
  },
  tautulli: {
    label: 'Tautulli', icon: '📊',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/tautulli.png',
    component: TautulliWidget, testConnection: true, defaultSize: { w: 4, h: 6 },
    description: 'Plex stats — active streams, play history & user stats',
    settingsFields: [
      { key: 'url',        label: 'Tautulli URL', placeholder: 'http://192.168.1.x:8181', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8181', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['activity','stats','history'] },
    ],
    defaultSettings: { defaultTab: 'activity' },
  },
  qbittorrent: {
    label: 'qBittorrent', icon: '🌊',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/qbittorrent.png',
    component: QbittorrentWidget, testConnection: true, defaultSize: { w: 4, h: 6 },
    description: 'Torrent queue, speeds & ratios',
    settingsFields: [
      { key: 'url',        label: 'qBittorrent URL', placeholder: 'http://192.168.1.x:8080', type: 'text' },
      { key: 'username',   label: 'Username', placeholder: 'admin', type: 'text' },
      { key: 'password',   label: 'Password', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8080', type: 'text' },
    ],
    defaultSettings: { username: 'admin' },
  },
  uptimekuma: {
    label: 'Uptime Kuma', icon: '🐻',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/uptime-kuma.png',
    component: UptimeKumaWidget, testConnection: true, defaultSize: { w: 3, h: 5 },
    description: 'Service uptime monitoring via public status page',
    settingsFields: [
      { key: 'url',        label: 'Uptime Kuma URL', placeholder: 'http://192.168.1.x:3001', type: 'text' },
      { key: 'slug',       label: 'Status page slug', placeholder: 'home', type: 'text' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:3001', type: 'text' },
    ],
    defaultSettings: { slug: 'home' },
  },
  gitea: {
    label: 'Gitea', icon: '🐱',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/gitea.png',
    component: GiteaWidget, testConnection: true, defaultSize: { w: 4, h: 5 },
    description: 'Git repositories & issues',
    settingsFields: [
      { key: 'url',        label: 'Gitea URL', placeholder: 'http://192.168.1.241:3000', type: 'text' },
      { key: 'apiKey',     label: 'API Token', type: 'password', hint: 'Settings → Applications → Generate Token' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.241:3000', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['repos','issues'] },
    ],
    defaultSettings: { url: 'http://192.168.1.241:3000', defaultTab: 'repos' },
  },
  immich: {
    label: 'Immich', icon: '🖼',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/immich.png',
    component: ImmichWidget, testConnection: true, defaultSize: { w: 4, h: 5 },
    description: 'Photo library stats & recent uploads',
    settingsFields: [
      { key: 'url',        label: 'Immich URL', placeholder: 'http://192.168.1.x:2283', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password', hint: 'Account Settings → API Keys' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:2283', type: 'text' },
    ],
    defaultSettings: {},
  },
  acservers: {
    label: 'AC Servers', icon: '🏁',
    component: ACServersWidget, defaultSize: { w: 4, h: 7 },
    description: 'All Assetto Corsa servers in one widget',
    settingsFields: [
      { key: 'columns',    label: 'Columns', type: 'select', options: ['1','2','3','4'] },
      { key: 'serversJson',label: 'Servers', type: 'acserverlist' },
    ],
    defaultSettings: { columns: '2', serversJson: '[]' },
  },
  acfleet: {
    label: 'AC Fleet', icon: '🏁',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/assetto-corsa.png',
    component: ACFleetWidget, defaultSize: { w: 6, h: 7 },
    description: 'Deadbull Racing fleet overview — all servers, players & lap records',
    settingsFields: [
      { key: 'url',         label: 'Fleet Manager URL', placeholder: 'http://192.168.1.85:4000', type: 'text' },
      { key: 'serviceUrl',  label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.85:4000', type: 'text' },
      { key: 'compactMode', label: 'Compact mode (summary only)', type: 'toggle' },
    ],
    defaultSettings: { url: 'http://192.168.1.85:4000' },
  },
  acserver: {
    label: 'AC Server', testConnection: true, icon: '🏎',
    component: ACServerWidget, defaultSize: { w: 5, h: 6 },
    description: 'Assetto Corsa server status, players & lap times',
    settingsFields: [
      { key: 'url',               label: 'mgmt_api URL',               placeholder: 'http://192.168.1.184:5000', type: 'text' },
      { key: 'adminUrl',          label: 'AC Admin Panel URL (optional)',placeholder: 'http://192.168.1.184:8080', type: 'text' },
      { key: 'serverName',        label: 'Display name',               placeholder: 'Deadbull Racing', type: 'text' },
      { key: 'defaultTab',        label: 'Default tab',                type: 'select', options: ['status','players','laps'] },
      { key: 'showControls',      label: 'Show Start / Stop button',   type: 'checkbox' },
      { key: 'showPracticeLobby', label: 'Show Practice Lobby button', type: 'checkbox' },
      { key: 'serviceUrl',        label: 'Open in browser (click logo)',placeholder: 'http://192.168.1.184:5000', type: 'text' },
    ],
    defaultSettings: { url: 'http://192.168.1.184:5000', serverName: 'Deadbull Racing', defaultTab: 'status', showControls: true, showPracticeLobby: true },
  },
  ping: {
    label: 'Status Monitor', testConnection: true, icon: '📡',
    component: PingWidget, defaultSize: { w: 3, h: 5 },
    description: 'Ping multiple services — live online/offline status with latency',
    settingsFields: [
      { key: 'services',       label: 'Services',                  type: 'servicelist' },
      { key: 'refreshInterval',label: 'Refresh interval (seconds)',placeholder: '60', type: 'text' },
      { key: 'showLatency',    label: 'Show latency bar',          type: 'checkbox' },
      { key: 'groupByStatus',  label: 'Group online first',        type: 'checkbox' },
    ],
    defaultSettings: { refreshInterval: 60, showLatency: true, groupByStatus: true },
  },
  jellyfin: {
    label: 'Jellyfin', icon: '🎞',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/jellyfin.png',
    component: JellyfinWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Media server — now playing & recently added with artwork',
    settingsFields: [
      { key: 'url',          label: 'Jellyfin URL',  placeholder: 'http://192.168.1.x:8096', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        type: 'password' },
      { key: 'defaultTab',   label: 'Default tab',    type: 'select', options: ['playing','recent'] },
      { key: 'showProgress', label: 'Show progress',  type: 'checkbox' },
      { key: 'showUser',     label: 'Show user info', type: 'checkbox' },
      { key: 'serviceUrl',   label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8096', type: 'text' },
    ],
    defaultSettings: { defaultTab: 'playing', showProgress: true, showUser: true },
  },
  portainer: {
    label: 'Portainer', icon: '🐳',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/portainer.png',
    component: PortainerWidget, defaultSize: { w: 5, h: 6 }, testConnection: true,
    description: 'Docker container management — all endpoints & containers',
    settingsFields: [
      { key: 'url',        label: 'Portainer URL', placeholder: 'http://192.168.1.x:9000', type: 'text' },
      { key: 'apiKey',     label: 'API Key',        type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:9000', type: 'text' },
    ],
    defaultSettings: {},
  },
  prowlarr: {
    label: 'Prowlarr', icon: '🔍',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/prowlarr.png',
    component: ProwlarrWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Indexer manager — all your Sonarr/Radarr indexers',
    settingsFields: [
      { key: 'url',        label: 'Prowlarr URL', placeholder: 'http://192.168.1.x:9696', type: 'text' },
      { key: 'apiKey',     label: 'API Key',       type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:9696', type: 'text' },
    ],
    defaultSettings: {},
  },
  bazarr: {
    label: 'Bazarr', icon: '🔤',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/bazarr.png',
    component: BazarrWidget, defaultSize: { w: 3, h: 4 }, testConnection: true,
    description: 'Subtitle management — movies & series coverage',
    settingsFields: [
      { key: 'url',        label: 'Bazarr URL', placeholder: 'http://192.168.1.x:6767', type: 'text' },
      { key: 'apiKey',     label: 'API Key',     type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:6767', type: 'text' },
    ],
    defaultSettings: {},
  },
  n8n: {
    label: 'n8n', icon: '🔄',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/n8n.png',
    component: N8NWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Workflow automation — active workflows & execution history',
    settingsFields: [
      { key: 'url',        label: 'n8n URL',  placeholder: 'http://192.168.1.x:5678', type: 'text' },
      { key: 'apiKey',     label: 'API Key',   type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:5678', type: 'text' },
    ],
    defaultSettings: {},
  },
  audiobookshelf: {
    label: 'Audiobookshelf', icon: '🎧',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/audiobookshelf.png',
    component: AudiobookshelfWidget, defaultSize: { w: 4, h: 4 }, testConnection: true,
    description: 'Audiobook & podcast library — libraries & reading progress',
    settingsFields: [
      { key: 'url',        label: 'Audiobookshelf URL', placeholder: 'http://192.168.1.x:13378', type: 'text' },
      { key: 'token',      label: 'API Token',           type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:13378', type: 'text' },
    ],
    defaultSettings: {},
  },
  paperless: {
    label: 'Paperless-NGX', icon: '📄',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/paperless-ngx.png',
    component: PaperlessWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Document management — inbox, stats & recent documents',
    settingsFields: [
      { key: 'url',        label: 'Paperless URL', placeholder: 'http://192.168.1.x:8000', type: 'text' },
      { key: 'token',      label: 'Auth Token',     type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8000', type: 'text' },
    ],
    defaultSettings: {},
  },
  weatherradar: {
    label: 'Weather Radar', icon: '🌧',
    component: WeatherRadarWidget, defaultSize: { w: 5, h: 6 },
    description: 'Animated precipitation radar via RainViewer — no API key needed',
    settingsFields: [
      { key: 'lat',         label: 'Latitude',      placeholder: '51.2479', type: 'text' },
      { key: 'lng',         label: 'Longitude',     placeholder: '-0.7661', type: 'text' },
      { key: 'zoom',        label: 'Zoom level',    type: 'select', options: ['6','7','8','9','10','11'] },
      { key: 'colorScheme', label: 'Colour scheme', type: 'select', options: ['1 - Universal Blue','2 - Titan','3 - The Weather Channel','4 - Rainbow','0 - Original'] },
      { key: 'showSnow',    label: 'Show snow layer', type: 'select', options: ['0','1'] },
    ],
    defaultSettings: { lat: '51.2479', lng: '-0.7661', zoom: '9', colorScheme: '1', showSnow: '0', showSun: '1' },
  },
  packagetracker: {
    label: 'Package Tracker', icon: '📦',
    component: PackageTrackerWidget, defaultSize: { w: 4, h: 6 },
    description: 'Track parcels from Royal Mail, DPD, Evri, DHL and more',
    settingsFields: [
      { key: 'packages',      label: 'Parcels', type: 'packagelist' },
      { key: 'apiKey17track', label: '17track API Key (optional — for live status)', type: 'password',
        hint: 'Free at 17track.net → Developer → API Keys. 100 trackings/month free.' },
    ],
    defaultSettings: { packages: [] },
  },
  fuelprices: {
    label: 'Fuel Prices', icon: '⛽',
    component: FuelPricesWidget, defaultSize: { w: 2, h: 5 },
    description: 'UK national average fuel prices + quick link to local prices',
    settingsFields: [
      { key: 'postcode', label: 'Your postcode (for local price link)', placeholder: 'GU11 3QW', type: 'text' },
      { key: 'fuelType', label: 'Show prices', type: 'select', options: ['both','petrol','diesel'] },
    ],
    defaultSettings: { postcode: 'GU11 3QW', fuelType: 'both' },
  },
  rss: {
    label: 'RSS Reader', icon: '📰',
    component: RSSWidget, defaultSize: { w: 4, h: 6 },
    description: 'Latest articles from any RSS or Atom feed',
    settingsFields: [
      { key: 'feeds', label: 'Feeds', type: 'feedlist',
        urlPlaceholder: 'https://feeds.example.com/rss',
        namePlaceholder: 'Feed name (e.g. BBC News)' },
      { key: 'showDescription', label: 'Show article description', type: 'toggle' },
      { key: 'showSource',      label: 'Show source name',         type: 'toggle' },
      { key: 'maxItems', label: 'Max articles', type: 'select', options: ['10','20','30','50'] },
    ],
    defaultSettings: { feeds: [], showDescription: true, showSource: true, maxItems: 20 },
  },
  calendar: {
    label: 'Calendar', icon: '📅',
    component: CalendarWidget, defaultSize: { w: 4, h: 7 },
    description: 'Upcoming events from O365, Google Calendar or any ICS feed',
    settingsFields: [
      { key: 'feeds', label: 'Calendars (ICS URLs)', type: 'feedlist',
        urlPlaceholder: 'https://outlook.office365.com/owa/calendar/xxx/calendar.ics',
        namePlaceholder: 'Calendar name (e.g. Work, Personal)' },
      { key: 'defaultTab', label: 'Default tab',        type: 'select', options: ['upcoming','calendar'] },
      { key: 'daysAhead',  label: 'Days to look ahead', type: 'select', options: ['7','14','30','60'] },
    ],
    defaultSettings: { feeds: [], defaultTab: 'upcoming', daysAhead: '14' },
  },
  youtube: {
    label: 'YouTube', icon: '▶',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/youtube.png',
    component: YouTubeWidget, defaultSize: { w: 4, h: 6 },
    description: 'Latest videos from your channels — slideshow with thumbnails',
    settingsFields: [
      { key: 'channels',         label: 'Channels', type: 'channellist' },
      { key: 'maxVideos',        label: 'Max videos', type: 'select', options: ['6','10','12','20'] },
      { key: 'transition',        label: 'Transition', type: 'select', options: ['fade','slide','zoom'] },
      { key: 'slideshowInterval', label: 'Speed (seconds)', type: 'select', options: ['3','5','6','8','10','15','20','30'] },
      { key: 'slideshowMode',     label: 'Auto slideshow', type: 'toggle' },
      { key: 'showProgressBar',   label: 'Show progress bar', type: 'toggle' },
    ],
    defaultSettings: { channels: [], maxVideos: '12', transition: 'fade', slideshowInterval: '6', slideshowMode: true, showProgressBar: true },
  },
  proxmoxupdater: {
    label: 'Proxmox Updater', icon: '🔄',
    component: ProxmoxUpdaterWidget, defaultSize: { w: 3, h: 4 },
    description: 'Container update count from Proxmox Admin panel',
    settingsFields: [
      { key: 'url',           label: 'Proxmox Admin URL', placeholder: 'http://192.168.1.94:7320', type: 'text' },
      { key: 'sessionCookie', label: 'pxadmin_sid cookie', type: 'password',
        hint: 'F12 → Application → Cookies → copy pxadmin_sid value' },
      { key: 'hostId',        label: 'Host ID', placeholder: '1773704334041', type: 'text' },
      { key: 'serviceUrl',    label: 'Open in browser (click icon)', placeholder: 'http://192.168.1.94:7320', type: 'text' },
    ],
    defaultSettings: { url: 'http://192.168.1.94:7320', serviceUrl: 'http://192.168.1.94:7320', hostId: '1773704334041' },
  },
  cloudflare: {
    label: 'Cloudflare', icon: '🔶',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/cloudflare.png',
    component: CloudflareWidget, testConnection: true, defaultSize: { w: 4, h: 5 },
    description: 'Tunnel health & DNS zone status',
    settingsFields: [
      { key: 'apiToken',   label: 'API Token', type: 'password',
        hint: 'dash.cloudflare.com → Profile → API Tokens → Create Token (Zone Read + Tunnel Read)' },
      { key: 'accountId', label: 'Account ID', type: 'text',
        hint: 'dash.cloudflare.com → any domain → right sidebar' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'https://dash.cloudflare.com', type: 'text' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['tunnels','zones'] },
    ],
    defaultSettings: { serviceUrl: 'https://dash.cloudflare.com', defaultTab: 'tunnels' },
  },
  pbs: {
    label: 'Proxmox Backup', icon: '💾',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/proxmox.png',
    component: PBSWidget, testConnection: true, defaultSize: { w: 4, h: 5 },
    description: 'Backup task history & datastore usage',
    settingsFields: [
      { key: 'url',         label: 'PBS URL', placeholder: 'https://192.168.1.x:8007', type: 'text' },
      { key: 'authType',    label: 'Authentication', type: 'authtoggle', options: ['credentials','apitoken'] },
      { key: 'username',    label: 'Username', placeholder: 'root@pam', type: 'text', showIf: s => (s.authType||'credentials') !== 'apitoken' },
      { key: 'password',    label: 'Password', type: 'password', showIf: s => (s.authType||'credentials') !== 'apitoken' },
      { key: 'tokenId',     label: 'Token ID', placeholder: 'root@pam!warrdash', type: 'text', showIf: s => s.authType === 'apitoken',
        hint: 'Format: user@realm!tokenname — e.g. root@pam!warrdash (note the ! separator)' },
      { key: 'tokenSecret', label: 'Token Secret', type: 'password', showIf: s => s.authType === 'apitoken' },
      { key: 'node',        label: 'Node name', placeholder: 'localhost', type: 'text' },
      { key: 'serviceUrl',  label: 'Open in browser (click logo)', placeholder: 'https://192.168.1.x:8007', type: 'text' },
      { key: 'defaultTab',  label: 'Default tab', type: 'select', options: ['tasks','datastores'] },
    ],
    defaultSettings: { node: 'localhost', authType: 'credentials', defaultTab: 'tasks' },
  },
  notes: {
    label: 'Notes & To-do', icon: '📝',
    component: NotesWidget, defaultSize: { w: 3, h: 6 },
    description: 'Sticky notes and to-do list — stored in your browser',
    settingsFields: [
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['notes','todos'] },
    ],
    defaultSettings: { defaultTab: 'notes' },
  },
  traveltime: {
    label: 'Travel Time', icon: '🚗',
    component: TravelTimeWidget, defaultSize: { w: 3, h: 5 },
    description: 'Live commute times with traffic — opens directions in Waze',
    settingsFields: [
      { key: 'apiKey',       label: 'Google Maps API Key', type: 'password', hint: 'Enable Distance Matrix API at console.cloud.google.com — free tier is generous' },
      { key: 'homePostcode', label: 'Home postcode / address', placeholder: 'GU11 3QW', type: 'text' },
      { key: 'workPostcode', label: 'Work postcode / address', placeholder: 'SL1 4DX', type: 'text' },
      { key: 'homeLabel',    label: 'Home label', placeholder: 'Home', type: 'text' },
      { key: 'workLabel',    label: 'Work label', placeholder: 'Work', type: 'text' },
      { key: 'homeEmoji',    label: 'Home icon',  placeholder: '🏠',   type: 'text' },
      { key: 'workEmoji',    label: 'Work icon',  placeholder: '🏢',   type: 'text' },
      { key: 'refreshMins',  label: 'Refresh every (minutes)', placeholder: '10', type: 'text' },
    ],
    defaultSettings: { homeLabel: 'Home', workLabel: 'Work', homeEmoji: '🏠', workEmoji: '🏢', refreshMins: '10' },
  },
  claudechat: {
    label: 'Claude', icon: '🤖',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/anthropic.png',
    component: ClaudeWidget, defaultSize: { w: 4, h: 6 },
    description: 'Chat with Claude directly from your dashboard',
    settingsFields: [
      { key: 'apiKey',       label: 'Anthropic API Key', type: 'password', placeholder: 'sk-ant-...' },
      { key: 'model',        label: 'Model', type: 'select', options: ['claude-sonnet-4-6','claude-opus-4-6','claude-haiku-4-5-20251001'] },
      { key: 'maxTokens',    label: 'Max response tokens', type: 'select', options: ['512','1024','2048','4096'] },
      { key: 'systemPrompt', label: 'System prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
    ],
    defaultSettings: { model: 'claude-sonnet-4-6', maxTokens: '1024' },
  },

  email: {
    label: 'Email', icon: '✉',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/gmail.png',
    component: EmailWidget, defaultSize: { w: 4, h: 7 },
    description: 'IMAP email client — read, reply and compose. Works with Office 365, Gmail, and any IMAP server',
    settingsFields: [
      { key: 'imapHost',        label: 'IMAP Host',          placeholder: 'outlook.office365.com', type: 'text' },
      { key: 'imapPort',        label: 'IMAP Port',          type: 'select', options: ['993','143'] },
      { key: 'imapTls',         label: 'IMAP TLS/SSL',       type: 'toggle' },
      { key: 'smtpHost',        label: 'SMTP Host',          placeholder: 'smtp.office365.com', type: 'text' },
      { key: 'smtpPort',        label: 'SMTP Port',          type: 'select', options: ['587','465','25'] },
      { key: 'username',        label: 'Email address',      placeholder: 'you@example.com', type: 'text' },
      { key: 'password',        label: 'Password / App password', type: 'password' },
      { key: 'fromName',        label: 'Display name',       placeholder: 'Warren', type: 'text' },
      { key: 'folder',          label: 'Folder',             placeholder: 'INBOX', type: 'text' },
      { key: 'trashFolder',     label: 'Trash folder',       placeholder: 'Trash', type: 'text' },
      { key: 'maxMessages',     label: 'Messages to load',   type: 'select', options: ['10','25','50'] },
      { key: 'refreshInterval', label: 'Auto-refresh (minutes)', type: 'select', options: ['1','2','5','10','15'] },
    ],
    defaultSettings: { imapPort: '993', imapTls: true, smtpPort: '587', folder: 'INBOX', trashFolder: 'Trash', maxMessages: '25', refreshInterval: '5' },
  },

  cinema: {
    label: 'Cinema', icon: '🎬',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/overseerr.png',
    component: CinemaWidget, defaultSize: { w: 4, h: 6 },
    description: "What's on at the cinema — slideshow with Overseerr request button",
    settingsFields: [
      { key: 'mode',             label: 'Mode', type: 'select', options: ['now_playing','upcoming'], hint: 'now_playing = in cinemas now, upcoming = coming soon' },
      { key: 'overseerrWidgetId', label: 'Overseerr Widget ID', placeholder: 'Auto-detected', type: 'text', hint: 'Leave blank to auto-detect from your dashboard' },
      { key: 'showRequest',      label: 'Show Request button', type: 'toggle' },
      { key: 'transition',        label: 'Transition', type: 'select', options: ['fade','slide','zoom'] },
      { key: 'slideshowInterval', label: 'Speed (seconds)', type: 'select', options: ['3','5','6','8','10','15','20','30'] },
      { key: 'showProgressBar',   label: 'Show progress bar', type: 'toggle' },
    ],
    defaultSettings: { mode: 'now_playing', showRequest: true, transition: 'fade', slideshowInterval: '6', showProgressBar: true },
  },

  search: {
    label: 'Search', icon: '🔍',
    component: SearchWidget, defaultSize: { w: 4, h: 3 },
    description: 'Search bar — Google, Bing, DuckDuckGo, YouTube & more',
    settingsFields: [
      { key: 'engine', label: 'Default search engine', type: 'select',
        options: ['google','bing','duckduckgo','brave','ecosia','startpage','youtube','github','custom'] },
      { key: 'customUrl',      label: 'Custom engine URL', placeholder: 'https://example.com/search?q=', type: 'text',
        hint: 'Search query will be appended to this URL' },
      { key: 'placeholder',    label: 'Input placeholder text', placeholder: 'Search...', type: 'text' },
      { key: 'showEngineName', label: 'Show engine name on buttons', type: 'toggle' },
      { key: 'openInNewTab',   label: 'Open results in new tab',     type: 'toggle' },
    ],
    defaultSettings: { engine: 'google', openInNewTab: true, showEngineName: true, placeholder: 'Search...' },
  },
  clock: {
    label: 'Clock', icon: '🕐',
    component: ClockWidget, defaultSize: { w: 3, h: 3 },
    description: 'Date & time display',
    settingsFields: [
      { key: 'timezone',     label: 'Timezone',       placeholder: 'Europe/London', type: 'text' },
      { key: 'format24h',   label: '24-hour format',  type: 'checkbox' },
      { key: 'showSeconds',  label: 'Show seconds',   type: 'checkbox' },
      { key: 'showDate',     label: 'Show date',      type: 'checkbox' },
      { key: 'showTimezone', label: 'Show timezone',  type: 'checkbox' },
    ],
    defaultSettings: { timezone: 'Europe/London', showSeconds: true, format24h: true, showDate: true, showTimezone: true },
  },
  weather: {
    label: 'Weather', icon: '🌤',
    component: WeatherWidget, defaultSize: { w: 4, h: 4 },
    description: 'Current weather & forecast',
    settingsFields: [
      { key: 'apiKey',        label: 'OpenWeatherMap API Key', type: 'password' },
      { key: 'lat',           label: 'Latitude',  placeholder: '51.2462', type: 'text' },
      { key: 'lon',           label: 'Longitude', placeholder: '-0.5830', type: 'text' },
      { key: 'location',      label: 'Location name (display)', placeholder: 'Aldershot', type: 'text' },
      { key: 'units',         label: 'Units', type: 'select', options: ['metric','imperial'] },
      { key: 'forecastDays',  label: 'Forecast days to show', type: 'select', options: ['2','3','4'] },
      { key: 'showFeelsLike', label: 'Show feels like',   type: 'checkbox' },
      { key: 'showHumidity',  label: 'Show humidity',     type: 'checkbox' },
      { key: 'showWind',      label: 'Show wind speed',   type: 'checkbox' },
      { key: 'showLocation',  label: 'Show location name',type: 'checkbox' },
    ],
    defaultSettings: { units: 'metric', lat: '51.2462', lon: '-0.5830', location: 'Aldershot', forecastDays: '4', showFeelsLike: true, showHumidity: true, showWind: true, showLocation: true },
  },
  sonarr: {
    label: 'Sonarr', testConnection: true, icon: '📺',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/sonarr.png',
    component: SonarrWidget, defaultSize: { w: 4, h: 5 },
    description: 'Upcoming episodes & queue',
    settingsFields: [
      { key: 'url',              label: 'Sonarr URL', placeholder: 'http://192.168.1.x:8989', type: 'text' },
      { key: 'apiKey',           label: 'API Key', type: 'password' },
      { key: 'defaultTab',       label: 'Default tab', type: 'select', options: ['upcoming','queue'] },
      { key: 'showEpisodeTitle', label: 'Show episode title', type: 'checkbox' },
      { key: 'showAirDate',      label: 'Show air date',      type: 'checkbox' },
      { key: 'showQualityBadge', label: 'Show quality badge', type: 'checkbox' },
      { key: 'serviceUrl',       label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8989', type: 'text' },
    ],
    defaultSettings: { defaultTab: 'upcoming', showEpisodeTitle: true, showAirDate: true, showQualityBadge: true },
  },
  radarr: {
    label: 'Radarr', testConnection: true, icon: '🎬',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/radarr.png',
    component: RadarrWidget, defaultSize: { w: 4, h: 5 },
    description: 'Recent movies & queue',
    settingsFields: [
      { key: 'url',        label: 'Radarr URL', placeholder: 'http://192.168.1.x:7878', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password' },
      { key: 'defaultTab', label: 'Default tab', type: 'select', options: ['recent','queue','missing'] },
      { key: 'showYear',   label: 'Show year',         type: 'checkbox' },
      { key: 'showGenre',  label: 'Show genre/studio', type: 'checkbox' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:7878', type: 'text' },
    ],
    defaultSettings: { defaultTab: 'recent', showYear: true, showGenre: true },
  },
  plex: {
    label: 'Plex', testConnection: true, icon: '🎞',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/plex.png',
    component: PlexWidget, defaultSize: { w: 4, h: 4 },
    description: 'Now playing & recent activity',
    settingsFields: [
      { key: 'url',                label: 'Plex URL', placeholder: 'http://192.168.1.x:32400', type: 'text' },
      { key: 'token',              label: 'X-Plex-Token', type: 'password' },
      { key: 'defaultTab',         label: 'Default tab', type: 'select', options: ['playing','recent'] },
      { key: 'recentlyAddedCount', label: 'Recently Added — titles to show', type: 'select', options: ['5','10','15','all'] },
      { key: 'transition',         label: 'Recently Added — transition', type: 'select', options: ['fade','slide','zoom','flip'] },
      { key: 'slideshowInterval',  label: 'Recently Added — speed (seconds)', type: 'select', options: ['3','5','6','8','10','15','20','30'] },
      { key: 'showProgressBar',    label: 'Recently Added — show progress bar', type: 'toggle' },
      { key: 'slideshowMode',      label: 'Recently Added — auto slideshow', type: 'toggle' },
      { key: 'showProgress',       label: 'Now Playing — show progress bar', type: 'checkbox' },
      { key: 'showUser',           label: 'Now Playing — show user & player info', type: 'checkbox' },
      { key: 'serviceUrl',         label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:32400/web', type: 'text' },
    ],
    defaultSettings: { defaultTab: 'playing', showProgress: true, showUser: true, recentlyAddedCount: '10', transition: 'fade', slideshowInterval: '6', showProgressBar: true, slideshowMode: true },
  },
  overseerr: {
    label: 'Overseerr', testConnection: true, icon: '🎭',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/overseerr.png',
    component: OverseerrWidget, defaultSize: { w: 4, h: 4 },
    description: 'Pending media requests',
    settingsFields: [
      { key: 'url',           label: 'Overseerr URL', placeholder: 'http://192.168.1.x:5055', type: 'text' },
      { key: 'apiKey',        label: 'API Key', type: 'password' },
      { key: 'showSummary',   label: 'Show pending/approved summary', type: 'checkbox' },
      { key: 'showRequester', label: 'Show requester name',           type: 'checkbox' },
      { key: 'showDate',      label: 'Show request date',             type: 'checkbox' },
      { key: 'hideApproved',  label: 'Only show pending requests',     type: 'toggle' },
      { key: 'serviceUrl',    label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:5055', type: 'text' },
    ],
    defaultSettings: { showSummary: true, showRequester: true, showDate: true },
  },

  homeassistant: {
    label: 'Home Assistant', testConnection: true, icon: '🏠',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/home-assistant.png',
    component: HomeAssistantWidget, defaultSize: { w: 4, h: 4 },
    description: 'Entity states & controls',
    settingsFields: [
      { key: 'url',          label: 'HA URL', placeholder: 'http://homeassistant.local:8123', type: 'text' },
      { key: 'token',        label: 'Long-Lived Token', type: 'password' },
      { key: 'widgetTitle',  label: 'Widget Title (optional)', placeholder: 'Home Assistant', type: 'text' },
      { key: 'widgetIcon',   label: 'Widget Icon (emoji)', placeholder: '🏠', type: 'text' },
      { key: 'widgetIconUrl',label: 'Widget icon image', type: 'serviceiconsearch',
        hint: 'Search the dashboard-icons library — overrides the emoji icon above' },
      { key: 'serviceUrl',   label: 'Click icon opens', placeholder: 'http://192.168.1.x:port', type: 'text',
        hint: 'Independent per-widget URL — overrides the HA URL when clicking the icon' },
      { key: 'sensorsJson',  label: 'Sensors', type: 'hasensorlist' },
      { key: 'layout',       label: 'Layout', type: 'select', options: ['list','2 columns','3 columns'] },
      { key: 'compact',      label: 'Compact rows', type: 'toggle' },
      { key: 'showDividers', label: 'Show dividers', type: 'toggle' },
      { key: 'showToggles',  label: 'Show toggle buttons', type: 'toggle' },
    ],
    defaultSettings: { showToggles: true, sensorsJson: '[]', layout: 'list', compact: false, showDividers: true },
  },


  plexnowplaying: {
    label: 'Plex Now Playing', testConnection: true, icon: '▶',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/plex.png',
    component: PlexNowPlayingWidget, defaultSize: { w: 4, h: 4 },
    description: 'Live now playing sessions with progress',
    settingsFields: [
      { key: 'url',          label: 'Plex URL', placeholder: 'http://192.168.1.x:32400', type: 'text' },
      { key: 'token',        label: 'X-Plex-Token', type: 'password' },
      { key: 'showProgress', label: 'Show progress bar',       type: 'toggle' },
      { key: 'showUser',     label: 'Show user info',          type: 'toggle' },
      { key: 'showPlayer',   label: 'Show player & device',    type: 'toggle' },
      { key: 'serviceUrl',   label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:32400/web', type: 'text' },
    ],
    defaultSettings: { showProgress: true, showUser: true, showPlayer: true },
  },
  proxmox: {
    label: 'Proxmox', testConnection: true, icon: '🖥',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/proxmox.png',
    component: ProxmoxWidget, defaultSize: { w: 4, h: 4 },
    description: 'Node stats & VM / LXC status',
    settingsFields: [
      { key: 'url',         label: 'Proxmox URL', placeholder: 'https://192.168.1.x:8006', type: 'text' },
      { key: 'tokenId',     label: 'Token ID', placeholder: 'user@pam!tokenname', type: 'text' },
      { key: 'tokenSecret', label: 'Token Secret', type: 'password' },
      { key: 'node',        label: 'Node name', placeholder: 'pve', type: 'text' },
      { key: 'defaultTab',  label: 'Default tab', type: 'select', options: ['node','guests'] },
      { key: 'showCpu',     label: 'Show CPU usage',        type: 'checkbox' },
      { key: 'showMemory',  label: 'Show memory usage',     type: 'checkbox' },
      { key: 'showDisk',    label: 'Show disk usage',       type: 'checkbox' },
      { key: 'showUptime',  label: 'Show uptime & version', type: 'checkbox' },
      { key: 'serviceUrl',  label: 'Open in browser (click logo)', placeholder: 'https://192.168.1.x:8006', type: 'text' },
    ],
    defaultSettings: { node: 'pve', defaultTab: 'node', showCpu: true, showMemory: true, showDisk: true, showUptime: true },
  },
  quicklinks: {
    label: 'Quick Links', icon: '🔗',
    component: QuickLinksWidget, defaultSize: { w: 3, h: 4 },
    description: 'App launcher & bookmarks',
    settingsFields: [
      { key: 'links',      label: 'Links (JSON)', type: 'textarea', placeholder: '[{"label":"Plex","url":"http://...","icon":"🎬","color":"#e5a00d"}]' },
      { key: 'iconSize',   label: 'Icon size', type: 'select', options: ['small','medium','large'] },
      { key: 'showLabels', label: 'Show labels', type: 'checkbox' },
    ],
    defaultSettings: { links: [], iconSize: 'medium', showLabels: true },
  },
  adguard: {
    label: 'AdGuard Home', testConnection: true, icon: '🛡',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/adguard-home.png',
    component: AdGuardWidget, defaultSize: { w: 3, h: 3 },
    description: 'DNS stats & filtering info',
    settingsFields: [
      { key: 'url',            label: 'AdGuard URL', placeholder: 'http://192.168.1.x:3000', type: 'text' },
      { key: 'username',       label: 'Username', type: 'text' },
      { key: 'password',       label: 'Password', type: 'password' },
      { key: 'showStatus',     label: 'Show protection status',   type: 'checkbox' },
      { key: 'showBlockRate',  label: 'Show block rate',          type: 'checkbox' },
      { key: 'showStats',      label: 'Show query stats grid',    type: 'checkbox' },
      { key: 'showTopBlocked', label: 'Show top blocked domains', type: 'checkbox' },
      { key: 'serviceUrl',     label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:3000', type: 'text' },
    ],
    defaultSettings: { showStatus: true, showBlockRate: true, showStats: true, showTopBlocked: true },
  },
  shopping: {
    label: 'Shopping List', icon: '🛒',
    component: ShoppingListWidget, defaultSize: { w: 4, h: 6 },
    description: 'View & manage a shopping list',
    settingsFields: [
      { key: 'url',               label: 'Shopping list app URL', placeholder: 'https://shopping.wbooth.co.uk', type: 'text' },
      { key: 'username',          label: 'Username', placeholder: 'warren', type: 'text' },
      { key: 'password',          label: 'Password', type: 'password' },
      { key: 'listId',            label: 'List ID', placeholder: 'default', type: 'text' },
      { key: 'listName',          label: 'Display name', placeholder: 'Shopping', type: 'text' },
      { key: 'showAddBar',        label: 'Show add item bar',               type: 'checkbox' },
      { key: 'showDoneByDefault', label: 'Show completed items by default', type: 'checkbox' },
      { key: 'serviceUrl',        label: 'Open in browser (click logo)', placeholder: 'https://shopping.wbooth.co.uk', type: 'text' },
    ],
    defaultSettings: { url: 'https://shopping.wbooth.co.uk', listId: 'default', listName: 'Shopping', showAddBar: true, showDoneByDefault: false },
  },
  webembed: {
    label: 'Web Embed', icon: '🌐',
    component: WebEmbedWidget, defaultSize: { w: 6, h: 7 },
    description: 'Embed any local web UI in a widget',
    settingsFields: [
      { key: 'url',             label: 'URL', placeholder: 'http://192.168.1.94:7320', type: 'text' },
      { key: 'label',           label: 'Label', placeholder: 'Proxmox Updater', type: 'text' },
      { key: 'allowFullscreen', label: 'Allow expand to fullscreen', type: 'checkbox' },
      { key: 'serviceUrl',      label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.94:7320', type: 'text' },
    ],
    defaultSettings: { allowFullscreen: true },
  },
  lidarr: {
    label: 'Lidarr', icon: '🎵',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/lidarr.png',
    component: LidarrWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Music collection manager',
    settingsFields: [
      { key: 'url',        label: 'URL',     placeholder: 'http://192.168.1.x:8686', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8686', type: 'text' },
    ],
    defaultSettings: {},
  },
  readarr: {
    label: 'Readarr', icon: '📚',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/readarr.png',
    component: ReadarrWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Book & ebook collection manager',
    settingsFields: [
      { key: 'url',        label: 'URL',     placeholder: 'http://192.168.1.x:8787', type: 'text' },
      { key: 'apiKey',     label: 'API Key', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:8787', type: 'text' },
    ],
    defaultSettings: {},
  },
  grafana: {
    label: 'Grafana', icon: '📈',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/grafana.png',
    component: GrafanaWidget, defaultSize: { w: 4, h: 5 }, testConnection: true,
    description: 'Dashboards, metrics & alerts',
    settingsFields: [
      { key: 'url',        label: 'URL',     placeholder: 'http://192.168.1.x:3000', type: 'text' },
      { key: 'apiKey',     label: 'API Key (Administration → Service Accounts)', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:3000', type: 'text' },
    ],
    defaultSettings: {},
  },
  speedtest: {
    label: 'Speedtest', icon: '⚡',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/speedtest-tracker.png',
    component: SpeedtestWidget, defaultSize: { w: 3, h: 4 }, testConnection: true,
    description: 'Network speed history & latest results',
    settingsFields: [
      { key: 'url',        label: 'Speedtest Tracker URL', placeholder: 'http://192.168.1.110', type: 'text' },
      { key: 'email',      label: 'Email', placeholder: 'admin@example.com', type: 'text' },
      { key: 'password',   label: 'Password', type: 'password' },
      { key: 'apiKey',     label: 'API Key (alternative to email/password)', type: 'password' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.110', type: 'text' },
    ],
    defaultSettings: {},
  },
  frigate: {
    label: 'Frigate', icon: '📹',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/frigate.png',
    component: FrigateWidget, defaultSize: { w: 4, h: 7 }, testConnection: true,
    description: 'NVR — live camera feeds, detections & stats',
    settingsFields: [
      { key: 'url',             label: 'Frigate URL', placeholder: 'http://192.168.1.x:5000', type: 'text' },
      { key: 'serviceUrl',      label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:5000', type: 'text' },
      { key: 'viewMode',        label: 'View mode', type: 'select', options: ['single', 'grid'] },
      { key: 'gridCols',        label: 'Grid columns', type: 'select', options: ['2', '3', '4'], showIf: s => s.viewMode === 'grid' },
      { key: 'refreshInterval', label: 'Snapshot refresh (seconds)', type: 'select', options: ['2','5','10','30'] },
      { key: 'showStats',       label: 'Show stats bar', type: 'toggle' },
      { key: 'showEvents',      label: 'Show recent events', type: 'toggle' },
    ],
    defaultSettings: { viewMode: 'single', gridCols: '2', refreshInterval: '5', showStats: true, showEvents: true },
  },
  windowsstats: {
    label: 'System Stats', icon: '🖥',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/windows.png',
    component: WindowsStatsWidget, defaultSize: { w: 4, h: 6 },
    description: 'Live CPU, RAM, disk, network & processes via Glances',
    settingsFields: [
      { key: 'url',             label: 'Agent URL', placeholder: 'http://192.168.1.x:61209', type: 'text' },
      { key: 'displayName',     label: 'Display name', placeholder: 'Warren PC', type: 'text' },
      { key: 'defaultTab',      label: 'Default tab', type: 'select', options: ['overview','disks','network','processes','sensors'] },
      { key: 'refreshInterval', label: 'Refresh interval (seconds)', type: 'select', options: ['3','5','10','30'] },
      { key: 'showProcesses',   label: 'Show processes tab',  type: 'toggle' },
      { key: 'showNetwork',     label: 'Show network tab',    type: 'toggle' },
      { key: 'showDisks',       label: 'Show disks tab',      type: 'toggle' },
      { key: 'showSensors',     label: 'Show temps tab',      type: 'toggle' },
      { key: 'showGpu',        label: 'Show GPU tab',        type: 'toggle' },
      { key: 'showCores',      label: 'Show CPU core grid',  type: 'toggle' },
      { key: 'maxProcesses',    label: 'Max processes to show', type: 'select', options: ['5','8','10','15','20'] },
      { key: 'serviceUrl',      label: 'Open in browser (click logo)', placeholder: 'http://192.168.1.x:61209', type: 'text' },
    ],
    defaultSettings: { defaultTab: 'overview', refreshInterval: '5', showProcesses: true, showNetwork: true, showDisks: true, showSensors: true, showGpu: true, showCores: true, maxProcesses: '10' },
  },
  nextcloud: {
    label: 'Nextcloud', icon: '☁️',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/nextcloud.png',
    component: NextcloudWidget, defaultSize: { w: 4, h: 4 }, testConnection: true,
    description: 'Self-hosted cloud storage & collaboration',
    settingsFields: [
      { key: 'url',      label: 'URL',        placeholder: 'https://192.168.1.x', type: 'text' },
      { key: 'username', label: 'Username',   type: 'text' },
      { key: 'password', label: 'App Password (Settings → Security → App Passwords)', type: 'password' },
      { key: 'siteName', label: 'Display name', placeholder: 'Nextcloud', type: 'text' },
      { key: 'serviceUrl', label: 'Open in browser (click logo)', placeholder: 'https://192.168.1.x', type: 'text' },
    ],
    defaultSettings: { siteName: 'Nextcloud' },
  },
};

export default WIDGET_REGISTRY;
