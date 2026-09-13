@echo off
setlocal
set "URL=https://spin-wheel-nine-vert.vercel.app/"

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%" (
  start "" "%EDGE%" --kiosk "%URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-features=Translate
  exit /b 0
)

if exist "%CHROME%" (
  start "" "%CHROME%" --kiosk "%URL%" --kiosk-printing --noerrdialogs --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0 --no-first-run --disable-translate
  exit /b 0
)

echo Install Microsoft Edge or Google Chrome to open the exhibition kiosk.
pause
