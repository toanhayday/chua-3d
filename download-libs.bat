@echo off
REM Tải Three.js và OrbitControls về thư mục libs\ để chạy offline.
setlocal

set VERSION=0.160.0
set BASE=https://unpkg.com/three@%VERSION%

if not exist libs mkdir libs
if not exist libs\addons mkdir libs\addons
if not exist libs\addons\controls mkdir libs\addons\controls

echo Downloading three.module.js ...
curl -fsSL "%BASE%/build/three.module.js" -o libs\three.module.js
if errorlevel 1 goto :error

echo Downloading OrbitControls.js ...
curl -fsSL "%BASE%/examples/jsm/controls/OrbitControls.js" -o libs\addons\controls\OrbitControls.js
if errorlevel 1 goto :error

echo.
echo Xong. Cap nhat importmap trong index.html:
echo.
echo   "three": "./libs/three.module.js",
echo   "three/addons/": "./libs/addons/"
goto :eof

:error
echo LOI khi tai file. Kiem tra ket noi mang va curl.
exit /b 1