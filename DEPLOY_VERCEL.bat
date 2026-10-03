@echo off
title PurePlate - Deploy to Vercel
color 0a
echo =================================================================
echo   PUREPLATE CITIZEN FOOD SAFETY NETWORK - VERCEL DEPLOYMENT
echo =================================================================
echo.
echo Deploying PurePlate directly to Vercel...
echo.
echo [1/2] Connecting to Vercel Cloud...
call npx vercel --prod
echo.
echo =================================================================
echo   DEPLOYMENT COMPLETE!
echo   PurePlate is now running live on Vercel Edge Network.
echo =================================================================
pause
