// Action Node Component for ReactFlow
import { Handle, Position, NodeProps } from 'reactflow';
import { MousePointer2, FileText, Globe, Database, Mail, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActionNodeData {
  label: string;
  type: 'click' | 'type' | 'navigate' | 'extract' | 'send-email' | 'wait';
  config?: Record<string, unknown>;
}

const actionIcons = {
  click: MousePointer2,
  type: FileText,
  navigate: Globe,
  extract: Database,
  'send-email': Mail,
  wait: Clock,
};

const actionColors = {
  click: 'bg-blue-500',
  type: 'bg-green-500',
  navigate: 'bg-purple-500',
  extract: 'bg-orange-500',
  'send-email': 'bg-red-500',
  wait: 'bg-gray-500',
};

export function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const Icon = actionIcons[data.type] || MousePointer2;
  const colorClass = actionColors[data.type] || 'bg-gray-500';

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-white shadow-lg transition-all',
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-200',
        'min-w-[200px]'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-3 p-4">
        <div className={cn('rounded-lg p-2 text-white', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.type}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

