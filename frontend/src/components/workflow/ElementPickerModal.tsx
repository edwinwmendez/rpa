// Element Picker Modal - Modal para seleccionar elementos con integración completa
import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Check, X, Loader2, AlertCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { agentClient } from '../../lib/agentClient';
import type { PickerStatus, PickerResult, ElementProperties } from '../../types/picker';

// Intervalo de polling en milisegundos
const POLLING_INTERVAL = 500;

interface ElementPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onElementCaptured: (selector: string) => void;
  mode?: 'desktop' | 'web';
  currentSelector?: string;
}

export function ElementPickerModal({
  isOpen,
  onClose,
  onElementCaptured,
  mode = 'desktop',
  currentSelector,
}: ElementPickerModalProps) {
  // Estados
  const [pickerStatus, setPickerStatus] = useState<PickerStatus>('idle');
  const [capturedResult, setCapturedResult] = useState<PickerResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // Ref para el intervalo de polling
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpiar polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Iniciar picker
  const startPicker = useCallback(async () => {
    try {
      setIsStarting(true);
      setErrorMessage(null);
      setCapturedResult(null);
      
      const response = await agentClient.startElementPicker(mode);
      
      if (response.status === 'error') {
        setErrorMessage(response.error || 'Error al iniciar el picker');
        setPickerStatus('error');
        return;
      }
      
      setPickerStatus('waiting');
    } catch {
      setErrorMessage('No se pudo conectar con el agente');
      setPickerStatus('error');
    } finally {
      setIsStarting(false);
    }
  }, [mode]);

  // Polling del estado
  const pollStatus = useCallback(async () => {
    try {
      const statusResponse = await agentClient.getPickerStatus();
      
      if (statusResponse.status === 'captured') {
        // Elemento capturado - obtener resultado
        stopPolling();
        
        const result = await agentClient.getPickerResult();
        
        if (result.status === 'success') {
          setCapturedResult(result);
          setPickerStatus('captured');
        } else {
          setErrorMessage(result.error || 'Error obteniendo elemento');
          setPickerStatus('error');
        }
      } else if (statusResponse.status === 'error') {
        stopPolling();
        setErrorMessage(statusResponse.error || 'Error en el picker');
        setPickerStatus('error');
      }
      // Si es 'waiting', continuar polling
    } catch (error) {
      // Error de conexión - podría ser temporal, seguir intentando
      console.error('Error en polling:', error);
    }
  }, [stopPolling]);

  // Efecto para iniciar picker cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      startPicker();
    } else {
      // Modal cerrado - limpiar
      stopPolling();
      setPickerStatus('idle');
      setCapturedResult(null);
      setErrorMessage(null);
    }
    
    return () => {
      stopPolling();
    };
  }, [isOpen, startPicker, stopPolling]);

  // Efecto para manejar polling
  useEffect(() => {
    if (pickerStatus === 'waiting') {
      // Iniciar polling
      pollingIntervalRef.current = setInterval(pollStatus, POLLING_INTERVAL);
    } else {
      stopPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [pickerStatus, pollStatus, stopPolling]);

  // Manejar cierre del modal
  const handleClose = useCallback(async () => {
    stopPolling();
    
    // Detener picker en el agente
    try {
      await agentClient.stopPicker();
    } catch (error) {
      console.error('Error deteniendo picker:', error);
    }
    
    onClose();
  }, [stopPolling, onClose]);

  // Confirmar selección
  const handleConfirm = useCallback(() => {
    if (capturedResult?.selector) {
      onElementCaptured(capturedResult.selector);
      handleClose();
    }
  }, [capturedResult, onElementCaptured, handleClose]);

  // Reintentar captura
  const handleRetry = useCallback(async () => {
    setCapturedResult(null);
    setErrorMessage(null);
    await startPicker();
  }, [startPicker]);

  // Renderizar contenido según estado
  const renderContent = () => {
    // Estado: Iniciando
    if (isStarting) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Iniciando selector de elementos...</p>
        </div>
      );
    }

    // Estado: Error
    if (pickerStatus === 'error') {
  return (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">
                  {errorMessage || 'Ocurrió un error inesperado'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    // Estado: Esperando captura
    if (pickerStatus === 'waiting') {
      return (
        <div className="space-y-4">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>El selector está activo en tu computadora</li>
                  <li>Mueve el mouse sobre la aplicación de Windows</li>
                  <li>Los elementos se resaltarán en rojo al pasar el mouse</li>
                  <li>Presiona <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">CTRL</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Click</kbd> para capturar</li>
                  <li>Presiona <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">ESC</kbd> para cancelar</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Indicador de espera */}
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Esperando que selecciones un elemento...</span>
          </div>

          {/* Selector actual si existe */}
          {currentSelector && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Selector actual:</p>
              <code className="text-sm font-mono text-gray-700">{currentSelector}</code>
            </div>
          )}

          {/* Botón cancelar */}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      );
    }

    // Estado: Elemento capturado
    if (pickerStatus === 'captured' && capturedResult) {
      return (
        <div className="space-y-4">
          {/* Mensaje de éxito */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-900">Elemento capturado exitosamente</span>
            </div>
          </div>

          {/* Screenshot del elemento */}
          {capturedResult.screenshot && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Vista previa</span>
              </div>
              <div className="p-4 bg-white flex justify-center">
                <img
                  src={`data:image/png;base64,${capturedResult.screenshot}`}
                  alt="Elemento capturado"
                  className="max-w-full max-h-48 border border-gray-300 rounded shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Selector generado */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Selector generado:</p>
            <code className="text-sm font-mono text-gray-900 font-medium">
              {capturedResult.selector}
            </code>
          </div>

          {/* Propiedades del elemento */}
          {capturedResult.properties && (
            <ElementPropertiesTable properties={capturedResult.properties} />
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Seleccionar otro
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Usar este elemento
            </Button>
          </div>
        </div>
      );
    }

    // Estado por defecto (idle)
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleccionar Elemento</DialogTitle>
          <DialogDescription>
            {mode === 'desktop'
              ? 'Selecciona un elemento de la aplicación de Windows'
              : 'Selecciona un elemento de la página web'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente auxiliar para mostrar propiedades
interface ElementPropertiesTableProps {
  properties: ElementProperties;
}

function ElementPropertiesTable({ properties }: ElementPropertiesTableProps) {
  const rows: Array<{ label: string; value: string | undefined; tooltip?: string }> = [
    { label: 'AutomationId', value: properties.auto_id },
    { label: 'Nombre', value: properties.name },
    { label: 'Clase', value: properties.class_name },
    { label: 'Tipo', value: properties.control_type },
    { label: 'Índice', value: properties.found_index !== undefined ? String(properties.found_index) : undefined, 
      tooltip: 'Posición del elemento entre hermanos del mismo tipo (importante para apps antiguas)' },
    { label: 'Proceso', value: properties.process_name },
    { label: 'Ventana', value: properties.window_title },
    { label: 'Coordenadas', value: properties.coordinates ? `${properties.coordinates[0]}, ${properties.coordinates[1]}` : undefined,
      tooltip: 'Coordenadas como fallback para apps problemáticas' },
    { label: 'Habilitado', value: properties.is_enabled !== undefined ? (properties.is_enabled ? 'Sí' : 'No') : undefined },
    { label: 'Visible', value: properties.is_visible !== undefined ? (properties.is_visible ? 'Sí' : 'No') : undefined },
  ].filter(row => row.value !== undefined && row.value !== null && row.value !== '');

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Propiedades del elemento</span>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <div key={index} className="flex px-3 py-2 text-sm group">
            <span 
              className="text-gray-500 w-28 shrink-0"
              title={row.tooltip}
            >
              {row.label}:
            </span>
            <span className="text-gray-900 font-mono text-xs break-all">
              {String(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
