// Properties Panel - Panel de propiedades dinámico para acciones
import { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';
import type { ActionNodeData, ActionConfig } from '../../types/workflow';
import { TypeActionForm } from './forms/TypeActionForm';
import { ClickActionForm } from './forms/ClickActionForm';
import { WaitActionForm } from './forms/WaitActionForm';
import { NavigateActionForm } from './forms/NavigateActionForm';
import { ExtractActionForm } from './forms/ExtractActionForm';
import { LoopActionForm } from './forms/LoopActionForm';
import { IfElseActionForm } from './forms/IfElseActionForm';
import { ReadTextActionForm } from './forms/ReadTextActionForm';
import { useWorkflowVariables } from '../../hooks/useWorkflowVariables';

interface PropertiesPanelProps {
  selectedNode: Node<ActionNodeData> | null;
  nodes: Node<ActionNodeData>[];
  edges: Edge[];
  onUpdate: (nodeId: string, config: ActionConfig) => void;
  onClose?: () => void;
}

export function PropertiesPanel({
  selectedNode,
  nodes,
  edges,
  onUpdate,
  onClose,
}: PropertiesPanelProps) {
  const [config, setConfig] = useState<ActionConfig | null>(null);
  const { availableVariables, excelData } = useWorkflowVariables(nodes, edges);
  const { success } = useToast();

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || { type: selectedNode.data.type, label: selectedNode.data.label } as ActionConfig);
    } else {
      setConfig(null);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode || !config) return;
    onUpdate(selectedNode.id, config);
    success('✅ Cambios aplicados correctamente', 2000);
  };

  const handleConfigChange = (newConfig: Partial<ActionConfig>) => {
    if (!config) return;
    setConfig({ ...config, ...newConfig } as ActionConfig);
  };

  if (!selectedNode || !config) {
    return (
      <div className="w-80 border-l border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Selecciona una acción</p>
          <p className="text-xs mt-1">para configurar sus propiedades</p>
        </div>
      </div>
    );
  }

  const renderForm = () => {
    switch (config.type) {
      case 'type':
        return (
          <TypeActionForm
            config={config}
            onChange={handleConfigChange}
            availableVariables={availableVariables}
          />
        );
      case 'click':
        return (
          <ClickActionForm
            config={config}
            onChange={handleConfigChange}
          />
        );
      case 'wait':
        return (
          <WaitActionForm
            config={config}
            onChange={handleConfigChange}
          />
        );
      case 'navigate':
        return (
          <NavigateActionForm
            config={config}
            onChange={handleConfigChange}
            availableVariables={availableVariables}
          />
        );
      case 'extract':
        return (
          <ExtractActionForm
            config={config}
            onChange={handleConfigChange}
          />
        );
      // Nota: excel-read ya no es una acción, se maneja globalmente
      // case 'excel-read': removido
      case 'loop':
        return (
          <LoopActionForm
            config={config}
            onChange={handleConfigChange}
            availableVariables={availableVariables}
            excelData={excelData}
          />
        );
      case 'if-else':
        return (
          <IfElseActionForm
            config={config}
            onChange={handleConfigChange}
            availableVariables={availableVariables}
          />
        );
      case 'read-text':
        return (
          <ReadTextActionForm
            config={config}
            onChange={handleConfigChange}
          />
        );
      default:
        return (
          <div className="p-4 text-sm text-gray-500">
            Formulario no implementado para este tipo de acción
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">{selectedNode.data.label}</h3>
          <p className="text-xs text-gray-500 capitalize">{selectedNode.data.type}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <Card className="border-0 shadow-none rounded-none">
          <CardContent className="p-4">
            {renderForm()}
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button onClick={handleSave} className="w-full">
          Aplicar Cambios
        </Button>
        <Button variant="outline" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}

