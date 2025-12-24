// If/Else Node - Nodo especial para acciones If/Else con visualización de ramas
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ActionNodeData } from '../../types/workflow';

interface IfElseNodeProps {
  data: ActionNodeData;
  selected?: boolean;
  id: string;
}

// Memoizado para evitar re-renders innecesarios y el warning de ReactFlow
export const IfElseNode = memo(function IfElseNode({ data, selected }: IfElseNodeProps) {
  const config = data.config as any;
  const condition = config.condition || '';
  const operator = config.operator || '==';
  const value = config.value || '';

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg transition-all',
        selected ? 'border-amber-500 shadow-xl ring-2 ring-amber-200' : 'border-amber-200',
        'min-w-[280px]'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
      
      {/* Header del If/Else */}
      <div className="flex items-center gap-3 p-4 bg-amber-100 border-b border-amber-200 rounded-t-lg">
        <div className="rounded-lg p-2 bg-amber-500 text-white">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900">{data.label}</div>
          <div className="text-xs text-amber-600 font-medium">Condición</div>
        </div>
      </div>

      {/* Condición */}
      <div className="p-4 bg-white/50">
        <div className="space-y-2">
          {condition ? (
            <div className="text-sm">
              <div className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                {condition} {operator} {operator !== 'exists' ? value : ''}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Sin condición definida</div>
          )}
        </div>
      </div>

      {/* Ramas */}
      <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 rounded-b-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-amber-700 font-medium">Verdadero</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <XCircle className="h-3 w-3 text-red-600" />
            <span className="text-amber-700 font-medium">Falso</span>
          </div>
        </div>
      </div>
      
      {/* Handles para ramas (izquierda: verdadero, derecha: falso) */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        className="w-3 h-3 bg-green-500 left-[30%]"
        style={{ left: '30%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        className="w-3 h-3 bg-red-500 left-[70%]"
        style={{ left: '70%' }}
      />
    </div>
  );
});

