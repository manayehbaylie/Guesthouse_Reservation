@echo off
echo Requesting Administrator access to configure PostgreSQL...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit -ExecutionPolicy Bypass -File \"%~dp0setup-postgres.ps1\"'"
pause
