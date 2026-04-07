@echo off
title WarrDash Agent - Builder
echo.
echo  =========================================
echo   WarrDash Agent v2.0 - Windows Installer
echo  =========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found.
    echo  Please download and install Python from https://python.org
    echo  Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    start https://www.python.org/downloads/
    exit /b 1
)

echo  [1/4] Python found. Installing dependencies...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet pyinstaller psutil pystray pillow
if errorlevel 1 (
    echo  [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo  [1/4] Dependencies installed.

echo  [2/4] Building executable...
python -m PyInstaller ^
    --onefile ^
    --windowed ^
    --name "WarrDash Agent" ^
    --icon icon.ico ^
    --add-data "icon.ico;." ^
    --hidden-import pystray ^
    --hidden-import PIL ^
    --hidden-import PIL.Image ^
    --hidden-import PIL.ImageDraw ^
    --hidden-import psutil ^
    --hidden-import winreg ^
    agent.py
if errorlevel 1 (
    echo  [ERROR] Build failed. Check output above.
    pause
    exit /b 1
)
echo  [2/4] Executable built.

echo  [3/4] Creating installer structure...
if not exist "installer" mkdir installer
copy "dist\WarrDash Agent.exe" "installer\WarrDash Agent.exe" >nul

:: Create a simple self-install wrapper
(
echo @echo off
echo echo Installing WarrDash Agent...
echo.
echo :: Copy to AppData
echo if not exist "%%APPDATA%%\WarrDashAgent" mkdir "%%APPDATA%%\WarrDashAgent"
echo copy /Y "%%~dp0WarrDash Agent.exe" "%%APPDATA%%\WarrDashAgent\WarrDash Agent.exe" ^>nul
echo.
echo :: Add firewall rule
echo netsh advfirewall firewall delete rule name="WarrDash Agent" ^>nul 2^>^&1
echo netsh advfirewall firewall add rule name="WarrDash Agent" dir=in action=allow protocol=TCP localport=61209 ^>nul
echo.
echo :: Start the agent
echo start "" "%%APPDATA%%\WarrDashAgent\WarrDash Agent.exe"
echo.
echo echo WarrDash Agent installed and running!
echo echo Look for it in the system tray ^(bottom right^)
echo echo.
echo pause
) > "installer\Install WarrDash Agent.bat"

echo  [3/4] Installer created.

echo  [4/4] Cleaning up build files...
rmdir /s /q build >nul 2>&1
rmdir /s /q dist  >nul 2>&1
del /q *.spec     >nul 2>&1

echo.
echo  =========================================
echo   BUILD COMPLETE!
echo  =========================================
echo.
echo   Output: installer\
echo     - "WarrDash Agent.exe"     (the app)
echo     - "Install WarrDash Agent.bat" (double-click to install)
echo.
echo   Share the INSTALLER folder with anyone
echo   who needs the agent.
echo.
pause
