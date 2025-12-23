# Agente RPA - Windows 7 (Ligero)
# Sin automatización web (Playwright) - Solo Desktop + Excel

from flask import Flask, request, jsonify
from flask_cors import CORS
import platform
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'https://*.web.app', 'https://*.firebaseapp.com'])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'connected',
        'version': '1.0.0-win7',
        'os': f"{platform.system()} {platform.release()}",
        'python': platform.python_version(),
        'features': {
            'desktop': True,
            'web': False,  # NO Playwright en Win7
            'excel': True
        }
    })

@app.route('/execute', methods=['POST'])
def execute_workflow():
    workflow = request.json
    logging.info(f"Ejecutando workflow: {workflow.get('name', 'Sin nombre')}")
    # TODO: Implementar executor
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    print("="*60)
    print("🤖 Agente RPA - Windows 7 (Ligero)")
    print(f"Python: {platform.python_version()}")
    print("⚠️  Automatización web NO disponible en esta versión")
    print("Servidor: http://localhost:5000")
    print("="*60)
    app.run(host='127.0.0.1', port=5000, debug=True)
