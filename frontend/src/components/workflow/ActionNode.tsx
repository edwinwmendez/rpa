/**
 * Action Node Component for ReactFlow
 *
 * Arquitectura de Selección:
 * - Este componente maneja su propia apariencia (border, shadow) usando la prop `selected`
 * - React Flow maneja el ring azul exterior mediante CSS (ver index.css)
 * - Sin uso de !important - especificidad correcta de Tailwind
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MousePointer2, FileText, Globe, Database, Mail, Clock, FileSpreadsheet, RefreshCw, GitBranch } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ActionNodeData as ActionNodeDataType } from '../../types/workflow';

export type { ActionNodeDataType as ActionNodeData };

interface ActionNodeProps {
  data: ActionNodeDataType;
  selected?: boolean;
  id: string;
}

const actionIcons = {
  click: MousePointer2,
  type: FileText,
  navigate: Globe,
  extract: Database,
  'send-email': Mail,
  wait: Clock,
  'excel-read': FileSpreadsheet,
  loop: RefreshCw,
  'if-else': GitBranch,
  'read-text': Database,
};

const actionColors = {
  click: 'bg-blue-500',
  type: 'bg-green-500',
  navigate: 'bg-purple-500',
  extract: 'bg-orange-500',
  'send-email': 'bg-red-500',
  wait: 'bg-gray-500',
  'excel-read': 'bg-emerald-500',
  loop: 'bg-indigo-500',
  'if-else': 'bg-yellow-500',
  'read-text': 'bg-teal-500',
};

// Memoizado para evitar re-renders innecesarios y el warning de ReactFlow
export const ActionNode = memo(function ActionNode({ data, selected }: ActionNodeProps) {
  const Icon = (actionIcons[data.type as keyof typeof actionIcons] || MousePointer2) as typeof MousePointer2;
  const colorClass = (actionColors[data.type as keyof typeof actionColors] || 'bg-gray-500') as string;

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-white transition-all relative min-w-[200px]',
        // Estilos cuando está seleccionado
        selected
          ? 'border-blue-500'
          : 'border-gray-200 shadow-lg hover:border-gray-300'
      )}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="connection-handle connection-handle-target"
        style={{ 
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
      
      <div className="flex items-center gap-3 p-4">
        <div className={cn('rounded-lg p-2 text-white', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.type}</div>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="connection-handle connection-handle-source"
        style={{ 
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
    </div>
  );
});

