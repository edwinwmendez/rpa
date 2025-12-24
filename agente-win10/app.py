# Agente RPA - Windows 10/11
# Servidor Flask que expone API para ejecutar automatizaciones

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import platform
import logging
import os
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)

# Configurar CORS para permitir conexiones desde frontend
CORS(app, origins=[
    'http://localhost:3000',  # Desarrollo local
    'https://*.web.app',       # Firebase Hosting
    'https://*.firebaseapp.com'
])

# Importar motores de automatización
from engine.desktop import DesktopEngine
from engine.web import WebEngine
from engine.excel import ExcelEngine
from engine.executor import WorkflowExecutor

# Inicializar motores
desktop_engine = DesktopEngine()
web_engine = WebEngine()
excel_engine = ExcelEngine()
executor = WorkflowExecutor(desktop_engine, web_engine, excel_engine)

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de health check"""
    return jsonify({
        'status': 'connected',
        'version': '1.0.0',
        'os': f"{platform.system()} {platform.release()}",
        'python': platform.python_version(),
        'features': {
            'desktop': True,
            'web': True,  # Playwright disponible en Win10/11
            'excel': True
        }
    })

@app.route('/execute', methods=['POST'])
def execute_workflow():
    """Ejecuta un workflow"""
    try:
        workflow = request.json
        logging.info(f"Ejecutando workflow: {workflow.get('name', 'Sin nombre')}")
        
        result = executor.execute(workflow)
        
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error ejecutando workflow: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/picker/start', methods=['POST'])
def start_picker():
    """Inicia el selector de elementos"""
    try:
        mode = request.json.get('mode', 'desktop')
        # TODO: Implementar element picker
        return jsonify({'status': 'started', 'mode': mode})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/diagnostic', methods=['GET'])
def run_diagnostic():
    """Ejecuta diagnóstico del sistema"""
    try:
        diagnostic = {
            'os': platform.system(),
            'os_version': platform.release(),
            'python': platform.python_version(),
            'architecture': platform.machine(),
            'features': {
                'pywinauto': True,
                'playwright': True,
                'pandas': True
            }
        }
        return jsonify(diagnostic)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logs', methods=['GET'])
def get_logs():
    """Retorna logs recientes"""
    # TODO: Implementar sistema de logs
    return jsonify({'logs': []})

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
        # El agente está en agente-win10/, subimos un nivel para llegar a la raíz
        base_dir = Path(__file__).parent.parent
        excel_dir = base_dir / 'excel_csv'
        
        # Crear carpeta si no existe
        excel_dir.mkdir(exist_ok=True)
        
        # Construir ruta completa del archivo
        file_path = excel_dir / filename
        
        # Guardar archivo
        if file_type in ['csv', 'txt']:
            # Guardar como texto
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            # Para Excel, necesitaríamos decodificar base64
            # Por ahora, guardamos como binario si viene en base64
            import base64
            try:
                # Intentar decodificar como base64
                decoded = base64.b64decode(content)
                with open(file_path, 'wb') as f:
                    f.write(decoded)
            except:
                # Si falla, guardar como texto
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
        
        # Retornar ruta absoluta
        absolute_path = str(file_path.absolute())
        
        logging.info(f"Archivo guardado: {absolute_path}")
        
        return jsonify({
            'success': True,
            'filePath': absolute_path,
            'relativePath': f"excel_csv/{filename}",
            'message': 'Archivo guardado exitosamente'
        })
        
    except Exception as e:
        logging.error(f"Error guardando archivo: {str(e)}")
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
        
        logging.info(f"Archivo eliminado: {file_path}")
        
        return jsonify({
            'success': True,
            'message': 'Archivo eliminado exitosamente'
        })
        
    except Exception as e:
        logging.error(f"Error eliminando archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 Agente RPA - Windows 10/11")
    print(f"Python: {platform.python_version()}")
    print(f"OS: {platform.system()} {platform.release()}")
    print("Servidor: http://localhost:5000")
    print("=" * 60)
    
    app.run(host='127.0.0.1', port=5000, debug=True)
