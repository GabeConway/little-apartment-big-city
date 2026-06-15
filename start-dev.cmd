@echo off
REM Little Apartment, Big City - dev launcher (Windows / cmd).
REM Usage: start-dev.cmd [desktop^|dev^|android]   (default: desktop)
powershell -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1" %*
