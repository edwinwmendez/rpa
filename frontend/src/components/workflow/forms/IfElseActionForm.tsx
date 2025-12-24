// If/Else Action Form - Formulario para acción "If/Else"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { VariableAutocomplete } from '../VariableAutocomplete';
import { VariableSelector } from '../VariableSelector';
import { Button } from '../../ui/button';
import { GitBranch } from 'lucide-react';
import type { IfElseActionConfig, WorkflowVariable } from '../../../types/workflow';

interface IfElseActionFormProps {
  config: IfElseActionConfig;
  onChange: (config: Partial<IfElseActionConfig>) => void;
  availableVariables: WorkflowVariable[];
}

export function IfElseActionForm({
  config,
  onChange,
  availableVariables,
}: IfElseActionFormProps) {
  const [condition, setCondition] = useState(config.condition || '');
  const [operator, setOperator] = useState(config.operator || '==');
  const [value, setValue] = useState(config.value || '');

  const handleConditionChange = (newCondition: string) => {
    setCondition(newCondition);
    onChange({ condition: newCondition });
  };

  const handleOperatorChange = (newOperator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'exists') => {
    setOperator(newOperator);
    onChange({ operator: newOperator });
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onChange({ value: newValue });
  };

  return (
    <div className="space-y-4">
      {/* Variable o expresión */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="if-condition">Condición *</Label>
          {availableVariables.length > 0 && (
            <VariableSelector
              availableVariables={availableVariables}
              onSelect={(variableName) => {
                const currentCondition = condition || '';
                const newCondition = currentCondition + `{{${variableName}}}`;
                handleConditionChange(newCondition);
              }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  Insertar Variable
                </Button>
              }
            />
          )}
        </div>
        <VariableAutocomplete
          value={condition}
          onChange={handleConditionChange}
          availableVariables={availableVariables}
          placeholder="Escribe la condición o selecciona una variable"
        />
        {!condition && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes ingresar una condición
          </p>
        )}
        <p className="text-xs text-gray-500">
          Ejemplo: {'{{'}bd_contratos.dni{'}}'} == "12345678" o {'{{'}fila.nombre{'}}'} != ""
        </p>
      </div>

      {/* Operador */}
      <div className="space-y-2">
        <Label htmlFor="if-operator">Operador</Label>
        <Select value={operator} onValueChange={handleOperatorChange}>
          <SelectTrigger id="if-operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="==">Igual a (==)</SelectItem>
            <SelectItem value="!=">Diferente de (!=)</SelectItem>
            <SelectItem value=">">Mayor que (&gt;)</SelectItem>
            <SelectItem value="<">Menor que (&lt;)</SelectItem>
            <SelectItem value=">=">Mayor o igual (&gt;=)</SelectItem>
            <SelectItem value="<=">Menor o igual (&lt;=)</SelectItem>
            <SelectItem value="contains">Contiene</SelectItem>
            <SelectItem value="exists">Existe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor (si no es "exists") */}
      {operator !== 'exists' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="if-value">Valor a comparar</Label>
            {availableVariables.length > 0 && (
              <VariableSelector
                availableVariables={availableVariables}
                onSelect={(variableName) => {
                  const currentValue = value || '';
                  const newValue = currentValue + `{{${variableName}}}`;
                  handleValueChange(newValue);
                }}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <GitBranch className="h-3 w-3 mr-1" />
                    Insertar Variable
                  </Button>
                }
              />
            )}
          </div>
          <VariableAutocomplete
            value={value}
            onChange={handleValueChange}
            availableVariables={availableVariables}
            placeholder="Valor o variable a comparar"
          />
        </div>
      )}

      {/* Preview de condición */}
      {condition && (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <Label className="text-xs text-gray-600">Condición:</Label>
          <p className="text-sm text-gray-900 mt-1 font-mono">
            {condition} {operator} {operator !== 'exists' ? value : ''}
          </p>
        </div>
      )}
    </div>
  );
}

