@echo off
title PurePlate - Deploy to Cloudflare Pages
color 0b
echo =================================================================
echo   PUREPLATE CITIZEN FOOD SAFETY NETWORK - CLOUDFLARE PAGES DEPLOY
echo =================================================================
echo.
echo [1/2] Authenticating with Cloudflare via Wrangler...
echo A browser window will open automatically. Please click "Authorize".
echo.
call npx wrangler login
echo.
echo [2/2] Uploading and Deploying web_app to Cloudflare Pages...
call npx wrangler pages deploy web_app --project-name pureplate
echo.
echo =================================================================
echo   DEPLOYMENT COMPLETE!
echo   Your app is now live globally on Cloudflare Pages (*.pages.dev)
echo =================================================================
pause
