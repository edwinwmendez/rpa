# Agente RPA - Windows 7 (Ligero)
# Servidor Flask SIN automatización web

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import platform
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)

CORS(app, origins=[
    'http://localhost:3000',
    'https://*.web.app',
    'https://*.firebaseapp.com'
])

# Importar solo motores disponibles en Win7
from engine.desktop import DesktopEngine
from engine.excel import ExcelEngine
from engine.executor import WorkflowExecutor

desktop_engine = DesktopEngine()
excel_engine = ExcelEngine()
# NO web_engine - no disponible en Win7
executor = WorkflowExecutor(desktop_engine, None, excel_engine)

@app.route('/health', methods=['GET'])
def health():
    """Health check - indica que web NO está disponible"""
    return jsonify({
        'status': 'connected',
        'version': '1.0.0-win7',
        'os': f"{platform.system()} {platform.release()}",
        'python': platform.python_version(),
        'features': {
            'desktop': True,
            'web': False,  # NO disponible en Win7
            'excel': True
        }
    })

@app.route('/execute', methods=['POST'])
def execute_workflow():
