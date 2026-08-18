@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-target-dev.ps1" %*
exit /b %ERRORLEVEL%
