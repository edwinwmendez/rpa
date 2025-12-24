// Navigate Action Form - Formulario para acción "Navegar"
import { useState } from 'react';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { VariableAutocomplete } from '../VariableAutocomplete';
import { VariableSelector } from '../VariableSelector';
import { Button } from '../../ui/button';
import { Globe } from 'lucide-react';
import type { NavigateActionConfig, WorkflowVariable } from '../../../types/workflow';

interface NavigateActionFormProps {
  config: NavigateActionConfig;
  onChange: (config: Partial<NavigateActionConfig>) => void;
  availableVariables: WorkflowVariable[];
}

export function NavigateActionForm({
  config,
  onChange,
  availableVariables,
}: NavigateActionFormProps) {
  const [url, setUrl] = useState(config.url || '');
  const [browser, setBrowser] = useState(config.browser || 'chrome');
  const [waitForLoad, setWaitForLoad] = useState(config.waitForLoad ?? true);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onChange({ url: newUrl });
  };

  const handleBrowserChange = (newBrowser: 'chrome' | 'edge' | 'firefox') => {
    setBrowser(newBrowser);
    onChange({ browser: newBrowser });
  };

  const handleWaitForLoadChange = (checked: boolean) => {
    setWaitForLoad(checked);
    onChange({ waitForLoad: checked });
  };

  return (
    <div className="space-y-4">
      {/* URL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="navigate-url">URL *</Label>
          {availableVariables.length > 0 && (
            <VariableSelector
              availableVariables={availableVariables}
              onSelect={(variableName) => {
                const currentUrl = url || '';
                const newUrl = currentUrl + `{{${variableName}}}`;
                handleUrlChange(newUrl);
              }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Insertar Variable
                </Button>
              }
            />
          )}
        </div>
        <VariableAutocomplete
          value={url}
          onChange={handleUrlChange}
          availableVariables={availableVariables}
          placeholder="https://ejemplo.com o usa variables"
        />
        {!url && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes ingresar una URL
          </p>
        )}
      </div>

      {/* Navegador */}
      <div className="space-y-2">
        <Label htmlFor="navigate-browser">Navegador</Label>
        <Select value={browser} onValueChange={handleBrowserChange}>
          <SelectTrigger id="navigate-browser">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chrome">Chrome</SelectItem>
            <SelectItem value="edge">Microsoft Edge</SelectItem>
            <SelectItem value="firefox">Firefox</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        <Label>Opciones</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="wait-load"
            checked={waitForLoad}
            onCheckedChange={handleWaitForLoadChange}
          />
          <Label htmlFor="wait-load" className="font-normal cursor-pointer">
            Esperar a que la página cargue completamente
          </Label>
        </div>
      </div>
    </div>
  );
}

