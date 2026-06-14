@echo off
REM Little Apartment, Big City - dev launcher (Windows / cmd).
REM Usage: start-dev.cmd [web^|desktop^|android]   (default: web)
powershell -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1" %*
