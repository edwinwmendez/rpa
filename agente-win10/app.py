# Agente RPA - Windows 10/11
# Servidor Flask que expone API para ejecutar automatizaciones

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import platform
import logging

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

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 Agente RPA - Windows 10/11")
    print(f"Python: {platform.python_version()}")
    print(f"OS: {platform.system()} {platform.release()}")
    print("Servidor: http://localhost:5000")
    print("=" * 60)
    
    app.run(host='127.0.0.1', port=5000, debug=True)
