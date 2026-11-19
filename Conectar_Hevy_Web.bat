@echo off
chcp 65001 >nul
title VYFITH - Conectar Hevy Web (1 Sola Vez)
cd /d "C:\Proyectos\VYFITH"

echo ================================================================
echo   VYFITH - CONEXION PERMANENTE CON HEVY WEB (@teheransmit)
echo ================================================================
echo.
echo Se abrira una ventana independiente de Chromium en hevy.com/login.
echo Inicia sesion alli UNA SOLA VEZ (no cierres esta consola).
echo Al terminar, tu sesion quedara guardada en .hevy-chrome-profile
echo y VYFITH sincronizara y actualizara tus rutinas de Hevy SOLO,
echo sin Antigravity ni tokens.
echo.

node scripts\hevy_web_bridge.mjs login --force

echo.
echo ================================================================
echo Proceso finalizado. Ya puedes volver a http://localhost:3000/
echo y pulsar "Sync en Vivo" o "Aplicar Cargas a Hevy App".
echo ================================================================
pause
