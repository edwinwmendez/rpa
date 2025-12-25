// Element Picker Button - Botón para activar selector de elementos
import { useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '../ui/button';
import { ElementPickerModal } from './ElementPickerModal';

interface ElementPickerButtonProps {
  /** Callback cuando se captura un elemento */
  onElementSelected: (selector: string) => void;
  /** Modo de captura: 'desktop' o 'web' */
  mode?: 'desktop' | 'web';
  /** Selector actual (se muestra en el modal) */
  currentSelector?: string;
  /** Deshabilitar el botón */
  disabled?: boolean;
}

export function ElementPickerButton({
  onElementSelected,
  mode = 'desktop',
  currentSelector,
  disabled = false,
}: ElementPickerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleElementCaptured = (selector: string) => {
    onElementSelected(selector);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleOpenModal}
        disabled={disabled}
        title="Seleccionar elemento en la aplicación"
      >
        <Target className="h-4 w-4" />
      </Button>

        <ElementPickerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
          onElementCaptured={handleElementCaptured}
          mode={mode}
          currentSelector={currentSelector}
        />
    </>
  );
}
