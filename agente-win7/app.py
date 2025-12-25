"""
Agente RPA para Windows 7 - Servidor Flask API
Soporta: Desktop automation + Excel/CSV
"""

import logging
import platform
import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('agente_win7.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__)

# Configurar CORS para permitir conexiones desde frontend
# En desarrollo, permitir cualquier origen de la red local (10.x.x.x, 192.168.x.x, etc.)
CORS(app, origins=[
    'http://localhost:3000',        # Desarrollo local
    'http://localhost:5173',        # Vite dev server
    'http://10.36.238.114:3000',    # MacBook en red local
    'http://10.36.238.114:5173',    # MacBook con puerto alternativo
    'http://10.36.238.184:3000',    # Windows 7 (si se accede desde ahí)
    'http://10.36.238.184:5173',    # Windows 7 con puerto alternativo
    'http://127.0.0.1:3000',        # Localhost alternativo
    'http://127.0.0.1:5173',        # Localhost alternativo
    'https://*.web.app',            # Firebase Hosting
    'https://*.firebaseapp.com'    # Firebase Hosting alternativo
], supports_credentials=True)

# Importar motores de automatización
try:
    from engine import DesktopEngine, ExcelEngine, WorkflowExecutor, ElementPicker

    # Inicializar motores globales
    desktop_engine = DesktopEngine(timeout=30)
    excel_engine = ExcelEngine(use_com=False)  # Pandas por defecto
    executor = WorkflowExecutor(desktop_engine, excel_engine)
    element_picker = ElementPicker()  # Singleton

    logger.info("✅ Motores de automatización inicializados correctamente")

except Exception as e:
    logger.error(f"❌ Error inicializando motores: {e}")
    desktop_engine = None
    excel_engine = None
    executor = None
    element_picker = None


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health():
    """
    Endpoint de health check
    Retorna información del agente y sus capacidades
    """
    try:
        return jsonify({
            'status': 'connected',
            'version': '1.0.0-win7',
            'os': {
                'system': platform.system(),
                'release': platform.release(),
                'version': platform.version(),
                'machine': platform.machine()
            },
            'python': platform.python_version(),
            'features': {
                'desktop': True,
                'excel': True,
                'csv': True
            },
            'engines': {
                'desktop': desktop_engine is not None,
                'excel': excel_engine is not None,
                'executor': executor is not None
            }
        }), 200

    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


# ==================== WORKFLOW EXECUTION ====================

@app.route('/execute', methods=['POST'])
def execute_workflow():
    """
    Ejecuta un workflow completo

    Body:
        {
            "name": "Nombre del workflow",
            "nodes": [...],
            "edges": [...],
            "variables": {...}  // Opcional
        }

    Returns:
        {
            "status": "success" | "error",
            "executed_nodes": int,
            "logs": [str],
            "duration_seconds": float,
            "error": str  // Si hay error
        }
    """
    try:
        if not executor:
            return jsonify({
                'status': 'error',
                'error': 'Executor no inicializado correctamente'
            }), 500

        workflow = request.json

        if not workflow:
            return jsonify({
                'status': 'error',
                'error': 'Body vacío. Se requiere workflow en formato JSON'
            }), 400

        logger.info(f"Ejecutando workflow: {workflow.get('name', 'Sin nombre')}")

        # Ejecutar workflow
        result = executor.execute(workflow)

        return jsonify(result), 200 if result['status'] == 'success' else 500

    except Exception as e:
        logger.error(f"Error ejecutando workflow: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/execute/stop', methods=['POST'])
def stop_execution():
    """
    Detiene la ejecución actual del workflow
    """
    try:
        if executor:
            executor.stop()
            return jsonify({
                'status': 'success',
                'message': 'Ejecución detenida'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'error': 'Executor no disponible'
            }), 500

    except Exception as e:
        logger.error(f"Error deteniendo ejecución: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/execute/status', methods=['GET'])
def execution_status():
    """
    Obtiene el estado actual de la ejecución
    """
    try:
        if not executor:
            return jsonify({'status': 'error', 'error': 'Executor no disponible'}), 500

        return jsonify({
            'status': executor.get_status(),
            'logs': executor.get_logs()
        }), 200

    except Exception as e:
        logger.error(f"Error obteniendo status: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


# ==================== FILE MANAGEMENT ====================

@app.route('/files/save', methods=['POST'])
def save_file():
    """
    Guarda un archivo Excel/CSV localmente en la carpeta excel_csv/

    Body:
        {
            "filename": "bd_contratos.csv",
            "content": "contenido del archivo como texto",
            "fileType": "csv" | "xlsx" | "xls"
        }

    Returns:
        {
            "success": true,
            "filePath": "ruta/completa/al/archivo",
            "relativePath": "excel_csv/filename.csv",
            "message": "Archivo guardado exitosamente"
        }
    """
    try:
        data = request.json
        filename = data.get('filename')
        content = data.get('content')
        file_type = data.get('fileType', 'csv')

        if not filename or not content:
            return jsonify({
                'success': False,
                'error': 'filename y content son requeridos'
            }), 400

        # Determinar carpeta base (raíz del proyecto)
        base_dir = Path(__file__).parent.parent
        excel_dir = base_dir / 'excel_csv'

        # Crear carpeta si no existe
        excel_dir.mkdir(exist_ok=True)

        # Construir ruta completa del archivo
        file_path = excel_dir / filename

        # Guardar archivo
        if file_type in ['csv', 'txt']:
            # Guardar como texto
            with open(file_path, 'w', encoding='utf-8-sig') as f:
                f.write(content)
        else:
            # Para Excel, decodificar base64
            import base64
            try:
                decoded = base64.b64decode(content)
                with open(file_path, 'wb') as f:
                    f.write(decoded)
            except Exception:
                # Si falla, guardar como texto
                with open(file_path, 'w', encoding='utf-8-sig') as f:
                    f.write(content)

        # Retornar ruta absoluta
        absolute_path = str(file_path.absolute())

        logger.info(f"Archivo guardado: {absolute_path}")

        return jsonify({
            'success': True,
            'filePath': absolute_path,
            'relativePath': f"excel_csv/{filename}",
            'message': 'Archivo guardado exitosamente'
        }), 200

    except Exception as e:
        logger.error(f"Error guardando archivo: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/files/delete', methods=['POST'])
def delete_file():
    """
    Elimina un archivo Excel/CSV localmente

    Body:
        {
            "filePath": "ruta/completa/al/archivo" o "excel_csv/filename.csv"
        }

    Returns:
        {
            "success": true,
            "message": "Archivo eliminado exitosamente"
        }
    """
    try:
        data = request.json
        file_path = data.get('filePath')

        if not file_path:
            return jsonify({
                'success': False,
                'error': 'filePath es requerido'
            }), 400

        # Si es ruta relativa, construir ruta completa
        if not os.path.isabs(file_path):
            base_dir = Path(__file__).parent.parent
            file_path = str(base_dir / file_path)

        # Verificar que el archivo existe y está en excel_csv/
        path_obj = Path(file_path)
        if not path_obj.exists():
            return jsonify({
                'success': False,
                'error': 'Archivo no encontrado'
            }), 404

        # Verificar seguridad: solo permitir eliminar archivos en excel_csv/
        if 'excel_csv' not in str(path_obj):
            return jsonify({
                'success': False,
                'error': 'Solo se pueden eliminar archivos en excel_csv/'
            }), 403

        # Eliminar archivo
        path_obj.unlink()

        logger.info(f"Archivo eliminado: {file_path}")

        return jsonify({
            'success': True,
            'message': 'Archivo eliminado exitosamente'
        }), 200

    except Exception as e:
        logger.error(f"Error eliminando archivo: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/files/list', methods=['GET'])
def list_files():
    """
    Lista archivos en la carpeta excel_csv/

    Returns:
        {
            "files": [
                {
                    "name": "archivo.csv",
                    "path": "ruta/completa",
                    "size": 1234,
                    "modified": "2024-12-23T10:30:00"
                }
            ]
        }
    """
    try:
        base_dir = Path(__file__).parent.parent
        excel_dir = base_dir / 'excel_csv'

        if not excel_dir.exists():
            return jsonify({'files': []}), 200

        files = []
        for file_path in excel_dir.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    'name': file_path.name,
                    'path': str(file_path.absolute()),
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })

        logger.info(f"Listados {len(files)} archivos")

        return jsonify({'files': files}), 200

    except Exception as e:
        logger.error(f"Error listando archivos: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== ELEMENT PICKER ====================

@app.route('/picker/start', methods=['POST'])
def start_picker():
    """
    Inicia el selector de elementos para captura visual.
    
    El usuario podrá mover el mouse sobre la aplicación y ver
    elementos resaltados en rojo. CTRL+Click captura el elemento.
    ESC cancela la captura.
    
    Body:
        {
            "mode": "desktop" | "web"
        }
    
    Returns:
        {
            "status": "started",
            "mode": "desktop"
        }
    """
    try:
        if not element_picker:
            return jsonify({
                'status': 'error',
                'error': 'Element picker no disponible'
            }), 500
        
        data = request.json or {}
        mode = data.get('mode', 'desktop')
        
        logger.info(f"Iniciando element picker en modo: {mode}")
        
        # Iniciar el picker
        success = element_picker.start(mode=mode)
        
        if success:
            return jsonify({
                'status': 'started',
                'mode': mode
        }), 200
        else:
            return jsonify({
                'status': 'error',
                'error': 'No se pudo iniciar el element picker'
            }), 500

    except Exception as e:
        logger.error(f"Error iniciando element picker: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'error': str(e),
            'details': repr(e) if hasattr(e, '__repr__') else None
        }), 500


@app.route('/picker/status', methods=['GET'])
def get_picker_status():
    """
    Obtiene el estado actual del element picker.
    
    Returns:
        {
            "status": "idle" | "waiting" | "captured" | "error",
            "error": "mensaje de error"  // Solo si status == "error"
        }
    """
    try:
        if not element_picker:
            return jsonify({
                'status': 'error',
                'error': 'Element picker no disponible'
            }), 500
        
        result = element_picker.get_status()
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error obteniendo estado del picker: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/picker/result', methods=['GET'])
def get_picker_result():
    """
    Obtiene el resultado de la captura (elemento seleccionado).
    
    Solo retorna datos si el status es 'captured'.
    
    Returns:
        {
            "status": "success" | "error",
            "selector": "auto_id:btnGuardar",
            "properties": {
                "auto_id": "btnGuardar",
                "name": "Guardar",
                "class_name": "Button",
                "control_type": "Button",
                "rectangle": {"left": 100, "top": 200, "right": 200, "bottom": 230},
                "is_enabled": true,
                "is_visible": true,
                "window_title": "Mi Aplicación"
            },
            "screenshot": "base64_encoded_png..."
        }
    """
    try:
        if not element_picker:
            return jsonify({
                'status': 'error',
                'error': 'Element picker no disponible'
            }), 500
        
        result = element_picker.get_result()
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error obteniendo resultado del picker: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/picker/stop', methods=['POST'])
def stop_picker():
    """
    Detiene el element picker y limpia recursos.
    
    Returns:
        {
            "status": "stopped"
        }
    """
    try:
        if not element_picker:
            return jsonify({
                'status': 'error',
                'error': 'Element picker no disponible'
            }), 500
        
        element_picker.stop()
        
        logger.info("Element picker detenido")
        
        return jsonify({
            'status': 'stopped'
        }), 200

    except Exception as e:
        logger.error(f"Error deteniendo element picker: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500


# ==================== DESKTOP AUTOMATION ====================

@app.route('/desktop/windows', methods=['GET'])
def list_windows():
    """
    Lista ventanas abiertas en el sistema

    Returns:
        {
            "windows": [
                {
                    "title": "Titulo de ventana",
                    "handle": 12345,
                    "class_name": "ClassName",
                    "is_visible": true
                }
            ]
        }
    """
    try:
        if not desktop_engine:
            return jsonify({'error': 'Desktop engine no disponible'}), 500

        windows = desktop_engine.get_window_list()

        return jsonify({'windows': windows}), 200

    except Exception as e:
        logger.error(f"Error listando ventanas: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/desktop/screenshot', methods=['POST'])
def take_screenshot():
    """
    Toma screenshot de la pantalla

    Body:
        {
            "path": "ruta/donde/guardar.png"  // Opcional
        }

    Returns:
        {
            "success": true,
            "path": "ruta/completa/screenshot.png"
        }
    """
    try:
        if not desktop_engine:
            return jsonify({'error': 'Desktop engine no disponible'}), 500

        data = request.json or {}
        screenshot_path = data.get('path', 'screenshot.png')

        # Si es ruta relativa, guardar en directorio del agente
        if not os.path.isabs(screenshot_path):
            screenshot_path = str(Path(__file__).parent / screenshot_path)

        success = desktop_engine.take_screenshot(screenshot_path)

        if success:
            return jsonify({
                'success': True,
                'path': screenshot_path
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Error tomando screenshot'
            }), 500

    except Exception as e:
        logger.error(f"Error tomando screenshot: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== DIAGNOSTIC ====================

@app.route('/diagnostic', methods=['GET'])
def run_diagnostic():
    """
    Ejecuta diagnóstico del sistema

    Returns:
        Información detallada del sistema y dependencias
    """
    try:
        diagnostic = {
            'os': {
                'system': platform.system(),
                'release': platform.release(),
                'version': platform.version(),
                'machine': platform.machine(),
                'processor': platform.processor()
            },
            'python': {
                'version': platform.python_version(),
                'implementation': platform.python_implementation(),
                'compiler': platform.python_compiler()
            },
            'dependencies': {}
        }

        # Verificar dependencias
        dependencies = ['pywinauto', 'pandas', 'openpyxl', 'flask', 'flask_cors']

        for dep in dependencies:
            try:
                module = __import__(dep)
                version = getattr(module, '__version__', 'unknown')
                diagnostic['dependencies'][dep] = {
                    'installed': True,
                    'version': version
                }
            except ImportError:
                diagnostic['dependencies'][dep] = {
                    'installed': False,
                    'version': None
                }

        # Estado de los motores
        diagnostic['engines'] = {
            'desktop': desktop_engine is not None,
            'excel': excel_engine is not None,
            'executor': executor is not None
        }

        return jsonify(diagnostic), 200

    except Exception as e:
        logger.error(f"Error en diagnóstico: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== LOGS ====================

@app.route('/logs', methods=['GET'])
def get_logs():
    """
    Retorna logs recientes del agente

    Query params:
        - lines: Número de líneas a retornar (default: 50)

    Returns:
        {
            "logs": [str]
        }
    """
    try:
        lines = int(request.args.get('lines', 50))

        log_file = Path(__file__).parent / 'agente_win7.log'

        if not log_file.exists():
            return jsonify({'logs': []}), 200

        # Leer últimas N líneas del log
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_logs = all_lines[-lines:] if len(all_lines) > lines else all_lines

        return jsonify({
            'logs': [line.strip() for line in recent_logs]
        }), 200

    except Exception as e:
        logger.error(f"Error obteniendo logs: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handler para endpoints no encontrados"""
    return jsonify({
        'status': 'error',
        'error': 'Endpoint no encontrado',
        'code': 404
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handler para errores internos"""
    logger.error(f"Error interno del servidor: {error}")
    return jsonify({
        'status': 'error',
        'error': 'Error interno del servidor',
        'code': 500
    }), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    print("=" * 70)
    print("🤖 Agente RPA - Windows 7 (Versión Ligera)")
    print("=" * 70)
    print(f"Python: {platform.python_version()}")
    print(f"OS: {platform.system()} {platform.release()}")
    print()
    print("✅ Características:")
    print("   - Desktop automation (pywinauto)")
    print("   - Excel/CSV processing (pandas)")
    print()
    print("Servidor: http://localhost:5000")
    print("=" * 70)
    print()

    try:
        # Escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde otras máquinas en la red
        # También funciona con localhost para conexiones locales
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor detenido por usuario")
        logger.info("Servidor detenido")
    except Exception as e:
        print(f"\n\n❌ Error iniciando servidor: {e}")
        logger.error(f"Error iniciando servidor: {e}")
        sys.exit(1)
