// Read Text Action Form - Formulario para acción "Leer Texto"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { ElementPickerButton } from '../ElementPickerButton';
import type { ReadTextActionConfig } from '../../../types/workflow';

interface ReadTextActionFormProps {
  config: ReadTextActionConfig;
  onChange: (config: Partial<ReadTextActionConfig>) => void;
}

export function ReadTextActionForm({ config, onChange }: ReadTextActionFormProps) {
  const [selector, setSelector] = useState(config.selector || '');
  const [variableName, setVariableName] = useState(config.variableName || '');
  const [trimSpaces, setTrimSpaces] = useState(config.trimSpaces ?? true);

  const handleSelectorChange = (newSelector: string) => {
    setSelector(newSelector);
    onChange({ selector: newSelector });
  };

  const handleVariableNameChange = (value: string) => {
    const validName = value.replace(/[^a-zA-Z0-9_]/g, '');
    setVariableName(validName);
    onChange({ variableName: validName });
  };

  const handleTrimSpacesChange = (checked: boolean) => {
    setTrimSpaces(checked);
    onChange({ trimSpaces: checked });
  };

  return (
    <div className="space-y-4">
      {/* Selector del elemento */}
      <div className="space-y-2">
        <Label htmlFor="read-selector">Elemento a leer *</Label>
        <div className="flex gap-2">
          <Input
            id="read-selector"
            value={selector}
            onChange={(e) => handleSelectorChange(e.target.value)}
            placeholder="auto_id:campoTexto"
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
            ⚠️ Debes seleccionar un elemento
          </p>
        )}
      </div>

      {/* Nombre de variable */}
      <div className="space-y-2">
        <Label htmlFor="read-variable">Nombre de variable *</Label>
        <Input
          id="read-variable"
          value={variableName}
          onChange={(e) => handleVariableNameChange(e.target.value)}
          placeholder="texto_leido"
        />
        <p className="text-xs text-gray-500">
          Usa esta variable en otras acciones como: {`{{${variableName || 'nombre_variable'}}}`}
        </p>
        {!variableName && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes ingresar un nombre de variable
          </p>
        )}
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        <Label>Opciones</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="read-trim"
            checked={trimSpaces}
            onCheckedChange={handleTrimSpacesChange}
          />
          <Label htmlFor="read-trim" className="font-normal cursor-pointer">
            Eliminar espacios al inicio y final
          </Label>
        </div>
      </div>
    </div>
  );
}

