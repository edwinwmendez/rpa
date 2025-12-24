// Click Action Form - Formulario para acción "Hacer Clic"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ElementPickerButton } from '../ElementPickerButton';
import type { ClickActionConfig } from '../../../types/workflow';

interface ClickActionFormProps {
  config: ClickActionConfig;
  onChange: (config: Partial<ClickActionConfig>) => void;
}

export function ClickActionForm({ config, onChange }: ClickActionFormProps) {
  const [selector, setSelector] = useState(config.selector || '');
  const [clickType, setClickType] = useState(config.clickType || 'left');
  const [waitAfter, setWaitAfter] = useState(config.waitAfter?.toString() || '0');
  const [continueOnError, setContinueOnError] = useState(config.continueOnError ?? false);

  const handleSelectorChange = (newSelector: string) => {
    setSelector(newSelector);
    onChange({ selector: newSelector });
  };

  const handleClickTypeChange = (newType: 'left' | 'right' | 'double') => {
    setClickType(newType);
    onChange({ clickType: newType });
  };

  const handleWaitAfterChange = (value: string) => {
    const num = parseFloat(value) || 0;
    setWaitAfter(value);
    onChange({ waitAfter: num });
  };

  const handleContinueOnErrorChange = (checked: boolean) => {
    setContinueOnError(checked);
    onChange({ continueOnError: checked });
  };

  return (
    <div className="space-y-4">
      {/* Selector del elemento */}
      <div className="space-y-2">
        <Label htmlFor="click-selector">Elemento a hacer clic *</Label>
        <div className="flex gap-2">
          <Input
            id="click-selector"
            value={selector}
            onChange={(e) => handleSelectorChange(e.target.value)}
            placeholder="auto_id:btnGuardar"
            className="flex-1"
          />
          <ElementPickerButton
            onElementSelected={handleSelectorChange}
            mode="desktop"
            currentSelector={selector}
          />
        </div>
        {!selector && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes seleccionar un elemento o escribir un selector
          </p>
        )}
      </div>

      {/* Tipo de clic */}
      <div className="space-y-2">
        <Label htmlFor="click-type">Tipo de clic</Label>
        <Select value={clickType} onValueChange={handleClickTypeChange}>
          <SelectTrigger id="click-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Clic izquierdo</SelectItem>
            <SelectItem value="right">Clic derecho</SelectItem>
            <SelectItem value="double">Doble clic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Esperar después del clic */}
      <div className="space-y-2">
        <Label htmlFor="click-wait">Esperar después (segundos)</Label>
        <Input
          id="click-wait"
          type="number"
          min="0"
          max="10"
          step="0.5"
          value={waitAfter}
          onChange={(e) => handleWaitAfterChange(e.target.value)}
          placeholder="0"
        />
        <p className="text-xs text-gray-500">
          Tiempo a esperar después de hacer clic (útil para esperar que cargue una ventana)
        </p>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        <Label>Opciones</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="continue-error"
            checked={continueOnError}
            onCheckedChange={handleContinueOnErrorChange}
          />
          <Label htmlFor="continue-error" className="font-normal cursor-pointer">
            Continuar si el elemento no se encuentra
          </Label>
        </div>
      </div>
    </div>
  );
}

