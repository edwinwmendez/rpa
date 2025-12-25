@echo off
:: Script simple para ejecutar el agente (sin elevar permisos)
:: Útil para desarrollo o cuando ya estás como administrador

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

