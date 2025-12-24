/**
 * If/Else Node - Nodo especial para acciones If/Else con visualización de ramas
 *
 * Arquitectura de Selección:
 * - Este componente maneja su propia apariencia (border, shadow) usando la prop `selected`
 * - React Flow maneja el ring azul exterior mediante CSS (ver index.css)
 * - Sin uso de !important - especificidad correcta de Tailwind
 */
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
        'rounded-lg border-2 bg-gradient-to-br from-amber-50 to-yellow-50 transition-all relative min-w-[280px]',
        selected
          ? 'border-blue-500'
          : 'border-amber-200 shadow-lg hover:border-amber-300'
      )}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="connection-handle connection-handle-target connection-handle-amber"
        style={{ 
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
      
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
        className="connection-handle connection-handle-source connection-handle-green"
        style={{ 
          left: '30%',
          bottom: -6,
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        className="connection-handle connection-handle-source connection-handle-red"
        style={{ 
          left: '70%',
          bottom: -6,
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
    </div>
  );
});

