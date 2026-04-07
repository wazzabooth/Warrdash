WarrDash Agent v2.0
===================

HOW TO BUILD THE INSTALLER
--------------------------
1. Make sure Python is installed (https://python.org)
   - During install, check "Add Python to PATH"
2. Double-click build.bat
3. Wait ~2 minutes for it to complete
4. Find your installer in the "installer" folder

HOW TO INSTALL
--------------
1. Open the "installer" folder
2. Double-click "Install WarrDash Agent.bat"
3. Look for the agent icon in your system tray (bottom right)

SYSTEM TRAY
-----------
Right-click the tray icon to:
- View Status (opens status page in browser)
- Copy URL (copies your agent URL to clipboard)
- Toggle "Start with Windows"
- Quit

IN WARRDASH
-----------
1. Add a "System Stats" widget
2. If no URL is set, click "Discover Agents" to auto-find it
3. Or paste the URL from the tray icon manually

GPU SUPPORT
-----------
NVIDIA GPUs are supported automatically via nvidia-smi.
GPU stats appear in the widget and status page.

CPU TEMPS
---------
Install LibreHardwareMonitor and run as Administrator
for CPU temperature readings. Otherwise temps show as N/A.
https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases

PORTS
-----
61209 - HTTP stats API
61210 - UDP discovery broadcast (LAN auto-discovery)
