// Diagnostic Page
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentClient } from '../lib/agentClient';
import { ArrowLeft, Download } from 'lucide-react';

interface DiagnosticResult {
  error?: string;
  [key: string]: unknown;
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    try {
      const result = await agentClient.runDiagnostic();
      setDiagnostic(result);
    } catch (error) {
      setDiagnostic({ error: 'No se pudo conectar con el agente' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    runDiagnostic();
  }, [runDiagnostic]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <h1 className="text-3xl font-bold mb-2">Diagnóstico del Sistema</h1>
      <p className="text-gray-600 mb-6">
        Verifica el estado de tu agente y descarga recursos necesarios
      </p>

      <button
        onClick={runDiagnostic}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        ↻ Re-ejecutar Diagnóstico
      </button>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ejecutando diagnóstico...</p>
        </div>
      ) : diagnostic?.error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Error de Conexión</h3>
          <p className="text-red-700 mb-4">{diagnostic.error}</p>
          <p className="text-sm text-red-600">
            Asegúrate de que el agente esté instalado y ejecutándose.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Estado del Sistema</h3>
            <p className="text-gray-600">Diagnóstico completo próximamente...</p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recursos de Instalación</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Agente para Windows 10/11</h4>
                <p className="text-sm text-gray-600">Versión completa con automatización web</p>
                <p className="text-xs text-gray-500 mt-1">Python 3.10 • 200 MB</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Agente para Windows 7</h4>
                <p className="text-sm text-gray-600">Versión ligera (sin automatización web)</p>
                <p className="text-xs text-gray-500 mt-1">Python 3.8 • 150 MB</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
