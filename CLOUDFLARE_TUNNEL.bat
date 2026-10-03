@echo off
title PurePlate - Cloudflare Global Tunnel
color 0a
echo =================================================================
echo   PUREPLATE CITIZEN FOOD SAFETY NETWORK - CLOUDFLARE LIVE TUNNEL
echo =================================================================
echo.
echo Starting Cloudflare Edge Tunnel for http://localhost:3000 ...
echo (Provides an instant global public HTTPS link with camera support)
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause
