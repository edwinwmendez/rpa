// Agent Status Banner - Banner de estado del agente
import { useEffect } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { AlertCircle, CheckCircle, Wrench } from 'lucide-react';

export function AgentStatusBanner() {
  const { status, checkStatus, startAutoCheck, stopAutoCheck } = useAgentStore();

  useEffect(() => {
    startAutoCheck();
    return () => stopAutoCheck();
  }, []);

  const isConnected = status.status === 'connected';

  return (
    <div
      className={`
        px-4 py-3 border-b flex items-center justify-between
        ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
      `}
    >
      <div className="flex items-center gap-3">
        {isConnected ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
        
        <div>
          {isConnected ? (
            <div>
              <span className="font-medium text-green-900">
                ✅ Agente conectado
              </span>
              <span className="text-sm text-green-700 ml-2">
                {status.os} • Python {status.python} • v{status.version}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-medium text-red-900">
                ❌ Agente desconectado
              </span>
              <span className="text-sm text-red-700 ml-2">
                {status.lastSeen && `Última conexión: ${status.lastSeen}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/diagnostic'}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Solucionar Problema
          </button>
          <button
            onClick={checkStatus}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50"
          >
            ↻ Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
