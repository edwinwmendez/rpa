// Element Picker Button - Botón para activar selector de elementos
import { useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '../ui/button';
import { ElementPickerModal } from './ElementPickerModal';
import { agentClient } from '../../lib/agentClient';

interface ElementPickerButtonProps {
  onElementSelected: (selector: string) => void;
  mode?: 'desktop' | 'web';
  currentSelector?: string;
}

export function ElementPickerButton({
  onElementSelected,
  mode = 'desktop',
  currentSelector,
}: ElementPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartPicker = async () => {
    try {
      setIsStarting(true);
      await agentClient.startElementPicker(mode);
      setIsOpen(true);
    } catch (error) {
      console.error('Error iniciando element picker:', error);
      alert('No se pudo iniciar el selector de elementos. Asegúrate de que el agente esté conectado.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleElementCaptured = (selector: string) => {
    onElementSelected(selector);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleStartPicker}
        disabled={isStarting}
        title="Seleccionar elemento en la aplicación"
      >
        <Target className="h-4 w-4" />
      </Button>

      {isOpen && (
        <ElementPickerModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onElementCaptured={handleElementCaptured}
          mode={mode}
          currentSelector={currentSelector}
        />
      )}
    </>
  );
}

