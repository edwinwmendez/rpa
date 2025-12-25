@echo off
:: Script simple para ejecutar el agente
:: Los logs se guardan automáticamente en agente_win7_output.txt

:: Cambiar al directorio del script
cd /d "%~dp0"

:: Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat

:: Verificar que Python está disponible
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Python no encontrado en el entorno virtual
    pause
    exit /b 1
)

:: Ejecutar el agente
:: Los logs se guardan automáticamente en agente_win7_output.txt por el logging de Python
echo.
echo ========================================
echo Iniciando agente RPA...
echo Los logs se guardan en: agente_win7_output.txt
echo ========================================
echo.
python app.py

:: Si el script termina, pausar para ver errores
if %errorLevel% neq 0 (
    echo.
    echo El agente terminó con errores. Revisa agente_win7_output.txt
    pause
)
