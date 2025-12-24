// Element Picker Modal - Modal para seleccionar elementos
import { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { agentClient } from '../../lib/agentClient';

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
  const [selector, setSelector] = useState(currentSelector || '');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // El agente ya está en modo picker cuando se abre el modal
      // Aquí podrías hacer polling para obtener el elemento capturado
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selector) {
      onElementCaptured(selector);
    }
  };

  const handleRetry = async () => {
    setIsCapturing(true);
    try {
      await agentClient.startElementPicker(mode);
      // El agente volverá a capturar
    } catch (error) {
      console.error('Error en retry:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Elemento</DialogTitle>
          <DialogDescription>
            {mode === 'desktop'
              ? 'Mueve el mouse sobre la aplicación y presiona CTRL+Click para capturar el elemento'
              : 'Mueve el mouse sobre la página web y presiona CTRL+Click para capturar el elemento'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>El navegador se minimizará automáticamente</li>
                  <li>Mueve el mouse sobre la aplicación/página</li>
                  <li>Los elementos se resaltarán en rojo al pasar el mouse</li>
                  <li>Presiona CTRL+Click en el elemento que deseas capturar</li>
                  <li>El navegador volverá automáticamente con el elemento seleccionado</li>
                </ol>
              </div>
            </div>
          </div>


          {/* Selector generado */}
          <div className="space-y-2">
            <Label htmlFor="element-selector">Selector generado:</Label>
            <Input
              id="element-selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="auto_id:btnGuardar"
            />
            {!selector && (
              <p className="text-xs text-amber-600">
                ⚠️ Esperando captura del elemento...
              </p>
            )}
          </div>


          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isCapturing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selector}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Selección
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

