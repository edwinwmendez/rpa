@echo off
:: Script para ejecutar el agente RPA como administrador
:: Auto-eleva permisos si no se ejecuta como administrador

:: Verificar si ya es administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Ejecutando como Administrador...
    goto :run
)

:: Si no es administrador, elevar usando PowerShell
echo ⚠️  Elevando permisos a Administrador...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:run
:: Cambiar al directorio del script
cd /d "%~dp0"

:: Activar entorno virtual
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat

:: Verificar que Python está disponible
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Error: Python no encontrado en el entorno virtual
    pause
    exit /b 1
)

:: Ejecutar el agente
echo 🚀 Iniciando agente RPA...
echo.
echo ========================================
echo 🤖 Agente RPA - Windows 7
echo ========================================
echo.
python app.py

:: Si el script termina, pausar para ver errores
if %errorLevel% neq 0 (
    echo.
    echo ❌ El agente terminó con errores
    pause
)

