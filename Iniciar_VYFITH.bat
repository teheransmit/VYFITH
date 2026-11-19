@echo off
chcp 65001 >nul
title VYFITH - Servidor Local Independiente (Sin Antigravity)
cd /d "C:\Proyectos\VYFITH"

echo ================================================================
echo   VYFITH - INICIANDO SERVIDOR EN TU ESCRITORIO (localhost:3000)
echo ================================================================
echo.
echo Iniciando en tu escritorio Windows real:
echo  - Boton "Conectar Hevy Web" abre ventana visible directo aqui
echo  - "Sync en Vivo" y "Aplicar Cargas a Hevy App" 100%% autonomos
echo.

start "" "http://localhost:3000"
npx next dev -H 0.0.0.0 -p 3000
pause
