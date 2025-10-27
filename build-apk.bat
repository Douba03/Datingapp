@echo off
echo Creating EAS project...
eas init --id @qossai03/partner-productivity-app

echo.
echo Starting Android build...
eas build --platform android --profile preview --non-interactive

pause

