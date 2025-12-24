// Type Action Form - Formulario para acción "Escribir Texto"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { VariableAutocomplete } from '../VariableAutocomplete';
import { VariableSelector } from '../VariableSelector';
import { ElementPickerButton } from '../ElementPickerButton';
import { Button } from '../../ui/button';
import { FileSpreadsheet } from 'lucide-react';
import type { TypeActionConfig, WorkflowVariable } from '../../../types/workflow';

interface TypeActionFormProps {
  config: TypeActionConfig;
  onChange: (config: Partial<TypeActionConfig>) => void;
  availableVariables: WorkflowVariable[];
}

export function TypeActionForm({
  config,
  onChange,
  availableVariables,
}: TypeActionFormProps) {
  const [selector, setSelector] = useState(config.selector || '');
  const [text, setText] = useState(config.text || '');
  const [clearBefore, setClearBefore] = useState(config.clearBefore ?? true);
  const [humanLike, setHumanLike] = useState(config.humanLike ?? false);
  const [speed, setSpeed] = useState(config.speed || 'normal');

  const handleSelectorChange = (newSelector: string) => {
    setSelector(newSelector);
    onChange({ selector: newSelector });
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    onChange({ text: newText });
  };

  const handleClearBeforeChange = (checked: boolean) => {
    setClearBefore(checked);
    onChange({ clearBefore: checked });
  };

  const handleHumanLikeChange = (checked: boolean) => {
    setHumanLike(checked);
    onChange({ humanLike: checked });
  };

  const handleSpeedChange = (newSpeed: 'fast' | 'normal' | 'slow') => {
    setSpeed(newSpeed);
    onChange({ speed: newSpeed });
  };

  return (
    <div className="space-y-4">
      {/* Selector del elemento */}
      <div className="space-y-2">
        <Label htmlFor="type-selector">Campo a escribir *</Label>
        <div className="flex gap-2">
          <Input
            id="type-selector"
            value={selector}
            onChange={(e) => handleSelectorChange(e.target.value)}
            placeholder="auto_id:campoNombre"
            className="flex-1"
          />
          <ElementPickerButton
            onElementSelected={handleSelectorChange}
            mode="desktop"
          />
        </div>
        {!selector && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes seleccionar un elemento o escribir un selector
          </p>
        )}
      </div>

      {/* Texto a escribir */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="type-text">Texto a escribir *</Label>
          {availableVariables.length > 0 && (
            <VariableSelector
              availableVariables={availableVariables}
              onSelect={(variableName) => {
                const currentText = text || '';
                const newText = currentText + `{{${variableName}}}`;
                handleTextChange(newText);
              }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Insertar Columna
                </Button>
              }
            />
          )}
        </div>
        <VariableAutocomplete
          value={text}
          onChange={handleTextChange}
          availableVariables={availableVariables}
          placeholder="Escribe el texto que quieres escribir en el campo"
          multiline
        />
        
        {/* Mostrar columnas disponibles de archivos Excel - Versión simplificada */}
        {availableVariables.filter(v => v.type === 'excel' && v.name.includes('.')).length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-xs font-semibold text-blue-900 mb-2">
              📊 Columnas rápidas (click para insertar):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables
                .filter(v => v.type === 'excel' && v.name.includes('.'))
                .slice(0, 6)
                .map(v => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => {
                      const currentText = text || '';
                      const newText = currentText + `{{${v.name}}}`;
                      handleTextChange(newText);
                    }}
                    className="text-xs px-2.5 py-1.5 bg-white border border-blue-300 rounded-md hover:bg-blue-100 hover:border-blue-400 transition-colors font-medium text-blue-700 shadow-sm"
                    title={v.description}
                  >
                    {v.name.split('.').pop()}
                  </button>
                ))}
              {availableVariables.filter(v => v.type === 'excel' && v.name.includes('.')).length > 6 && (
                <VariableSelector
                  availableVariables={availableVariables.filter(v => v.type === 'excel')}
                  onSelect={(variableName) => {
                    const currentText = text || '';
                    const newText = currentText + `{{${variableName}}}`;
                    handleTextChange(newText);
                  }}
                  trigger={
                    <button
                      type="button"
                      className="text-xs px-2.5 py-1.5 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors font-medium text-blue-700 shadow-sm"
                    >
                      Ver todas ({availableVariables.filter(v => v.type === 'excel' && v.name.includes('.')).length})
                    </button>
                  }
                />
              )}
            </div>
          </div>
        )}
        
        {availableVariables.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800 font-medium mb-1">
              ⚠️ No hay variables disponibles
            </p>
            <p className="text-xs text-amber-700">
              Carga un archivo Excel/CSV en el panel lateral para usar sus columnas aquí
            </p>
          </div>
        )}
      </div>

      {/* Opciones */}
      <div className="space-y-3">
        <Label>Opciones</Label>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="clear-before"
            checked={clearBefore}
            onCheckedChange={handleClearBeforeChange}
          />
          <Label htmlFor="clear-before" className="font-normal cursor-pointer">
            Limpiar campo antes de escribir
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="human-like"
            checked={humanLike}
            onCheckedChange={handleHumanLikeChange}
          />
          <Label htmlFor="human-like" className="font-normal cursor-pointer">
            Simular escritura humana (más lento pero más natural)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type-speed">Velocidad de escritura</Label>
          <Select value={speed} onValueChange={handleSpeedChange}>
            <SelectTrigger id="type-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fast">Rápido</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="slow">Lento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview del texto */}
      {text && (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <Label className="text-xs text-gray-600">Preview:</Label>
          <p className="text-sm text-gray-900 mt-1 font-mono">
            {text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
              const variable = availableVariables.find(v => v.name === varName);
              return variable?.value ? String(variable.value) : match;
            })}
          </p>
        </div>
      )}
    </div>
  );
}

