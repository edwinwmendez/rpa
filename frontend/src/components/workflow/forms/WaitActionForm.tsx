// Wait Action Form - Formulario para acción "Esperar"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ElementPickerButton } from '../ElementPickerButton';
import type { WaitActionConfig } from '../../../types/workflow';

interface WaitActionFormProps {
  config: WaitActionConfig;
  onChange: (config: Partial<WaitActionConfig>) => void;
}

export function WaitActionForm({ config, onChange }: WaitActionFormProps) {
  const [waitType, setWaitType] = useState(config.waitType || 'time');
  const [duration, setDuration] = useState(config.duration?.toString() || '1');
  const [selector, setSelector] = useState(config.selector || '');
  const [timeout, setTimeout] = useState(config.timeout?.toString() || '30');

  const handleWaitTypeChange = (newType: 'time' | 'element-appear' | 'element-disappear') => {
    setWaitType(newType);
    onChange({ waitType: newType });
  };

  const handleDurationChange = (value: string) => {
    const num = parseFloat(value) || 1;
    setDuration(value);
    onChange({ duration: num });
  };

  const handleSelectorChange = (newSelector: string) => {
    setSelector(newSelector);
    onChange({ selector: newSelector });
  };

  const handleTimeoutChange = (value: string) => {
    const num = parseFloat(value) || 30;
    setTimeout(value);
    onChange({ timeout: num });
  };

  return (
    <div className="space-y-4">
      {/* Tipo de espera */}
      <div className="space-y-2">
        <Label htmlFor="wait-type">Tipo de espera *</Label>
        <Select value={waitType} onValueChange={handleWaitTypeChange}>
          <SelectTrigger id="wait-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Tiempo fijo</SelectItem>
            <SelectItem value="element-appear">Hasta que elemento aparezca</SelectItem>
            <SelectItem value="element-disappear">Hasta que elemento desaparezca</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duración (si es tiempo fijo) */}
      {waitType === 'time' && (
        <div className="space-y-2">
          <Label htmlFor="wait-duration">Duración (segundos) *</Label>
          <Input
            id="wait-duration"
            type="number"
            min="0"
            max="3600"
            step="0.1"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            placeholder="1"
          />
        </div>
      )}

      {/* Selector (si es espera por elemento) */}
      {(waitType === 'element-appear' || waitType === 'element-disappear') && (
        <div className="space-y-2">
          <Label htmlFor="wait-selector">Elemento a esperar *</Label>
          <div className="flex gap-2">
            <Input
              id="wait-selector"
              value={selector}
              onChange={(e) => handleSelectorChange(e.target.value)}
              placeholder="auto_id:elemento"
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
      )}

      {/* Timeout (si es espera por elemento) */}
      {(waitType === 'element-appear' || waitType === 'element-disappear') && (
        <div className="space-y-2">
          <Label htmlFor="wait-timeout">Timeout máximo (segundos)</Label>
          <Input
            id="wait-timeout"
            type="number"
            min="1"
            max="300"
            value={timeout}
            onChange={(e) => handleTimeoutChange(e.target.value)}
            placeholder="30"
          />
          <p className="text-xs text-gray-500">
            Tiempo máximo a esperar antes de continuar o fallar
          </p>
        </div>
      )}
    </div>
  );
}

