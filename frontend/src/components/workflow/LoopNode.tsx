// Loop Node - Nodo especial para acciones Loop con lista compacta
import { memo, useMemo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ActionNodeData } from '../../types/workflow';

interface LoopNodeProps {
  data: ActionNodeData;
  selected?: boolean;
  id: string;
}

// Memoizado para evitar re-renders innecesarios y el warning de ReactFlow
export const LoopNode = memo(function LoopNode({ data, selected, id }: LoopNodeProps) {
  const { getNodes, getEdges } = useReactFlow();
  const config = data.config as any;
  const loopMode = config.loopMode || 'excel';
  
  const modeLabels: Record<string, string> = {
    excel: 'Por Excel/CSV',
    count: 'Repetir N veces',
    until: 'Repetir hasta',
    while: 'Repetir mientras',
  };

  // Obtener nodos hijos (nodos con parentId igual a este Loop)
  // y ordenarlos según las conexiones (edges)
  const allNodes = getNodes();
  const allEdges = getEdges();
  const childNodesUnordered = allNodes.filter(node => node.parentId === id);

  // Ordenar nodos según las conexiones
  const childNodes = useMemo(() => {
    if (childNodesUnordered.length === 0) return [];
    
    // Crear un mapa de nodos para acceso rápido
    const nodeMap = new Map(childNodesUnordered.map(n => [n.id, n]));
    
    // Crear un mapa de conexiones (source -> target)
    const connections = new Map<string, string>();
    allEdges.forEach(edge => {
      // Solo considerar edges entre nodos dentro de este loop
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        connections.set(edge.source, edge.target);
      }
    });
    
    // Encontrar el nodo inicial (el que no tiene ningún edge apuntando a él desde otro nodo del loop)
    const targetsSet = new Set(connections.values());
    const startNode = childNodesUnordered.find(n => !targetsSet.has(n.id));
    
    if (!startNode) {
      // Si no hay un nodo inicial claro, devolver los nodos sin ordenar
      return childNodesUnordered;
    }
    
    // Construir la lista ordenada siguiendo las conexiones
    const ordered = [];
    let current: typeof startNode | undefined = startNode;
    const visited = new Set<string>();
    
    while (current && !visited.has(current.id)) {
      ordered.push(current);
      visited.add(current.id);
      const nextId = connections.get(current.id);
      current = nextId ? nodeMap.get(nextId) : undefined;
    }
    
    // Agregar nodos que no están conectados (por si acaso)
    childNodesUnordered.forEach(node => {
      if (!visited.has(node.id)) {
        ordered.push(node);
      }
    });
    
    return ordered;
  }, [childNodesUnordered, allEdges]);

  const getModeInfo = () => {
    switch (loopMode) {
      case 'excel':
        return {
          label: config.dataSource ? `Iterar sobre: ${config.dataSource}` : 'Selecciona archivo Excel',
          variable: config.iterationVariable || 'fila',
        };
      case 'count':
        return {
          label: `Repetir ${config.repeatCount || 'N'} veces`,
          variable: config.iterationVariable || 'iteracion',
        };
      case 'until':
        return {
          label: `Hasta: ${config.condition || 'condición'}`,
          variable: config.iterationVariable || 'iteracion',
        };
      case 'while':
        return {
          label: `Mientras: ${config.condition || 'condición'}`,
          variable: config.iterationVariable || 'iteracion',
        };
      default:
        return { label: 'Loop', variable: 'item' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg transition-all',
        selected ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-200' : 'border-indigo-200',
      )}
      style={{
        width: '350px',
        minHeight: '120px',
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      
      {/* Header del Loop */}
      <div className="flex items-center gap-2 p-3 bg-indigo-100 border-b border-indigo-200 rounded-t-lg">
        <div className="rounded-lg p-1.5 bg-indigo-500 text-white">
          <RefreshCw className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-indigo-900 truncate">{data.label}</div>
          <div className="text-[10px] text-indigo-600 font-medium">{modeLabels[loopMode]}</div>
        </div>
        {childNodes.length > 0 && (
          <div className="text-[10px] text-indigo-600 bg-indigo-200 px-1.5 py-0.5 rounded whitespace-nowrap">
            {childNodes.length} {childNodes.length === 1 ? 'acción' : 'acciones'}
          </div>
        )}
      </div>

      {/* Configuración del Loop */}
      <div className="p-3 bg-white/50 border-b border-indigo-200">
        <div className="space-y-1">
          <div className="text-xs text-gray-700">
            <span className="font-medium">{modeInfo.label}</span>
          </div>
          {loopMode === 'excel' && modeInfo.variable && (
            <div className="text-[10px] text-gray-500">
              Variable: <code className="bg-gray-100 px-1 rounded">{`{{${modeInfo.variable}.columna}}`}</code>
            </div>
          )}
          {(loopMode === 'count' || loopMode === 'until' || loopMode === 'while') && (
            <div className="text-[10px] text-gray-500">
              Variable: <code className="bg-gray-100 px-1 rounded">{`{{${modeInfo.variable}}}`}</code>
            </div>
          )}
        </div>
      </div>

      {/* Lista compacta de acciones */}
      <div className="px-3 py-2 bg-indigo-50/30 border-b border-indigo-200">
        {childNodes.length === 0 ? (
          <div className="text-center py-4 text-indigo-400">
            <div className="text-xs font-medium mb-1">Sin acciones</div>
            <div className="text-[10px]">Doble clic para agregar</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-indigo-600 mb-1">
              {childNodes.length} {childNodes.length === 1 ? 'acción' : 'acciones'}
            </div>
            {/* Lista compacta de acciones (máximo 3 visibles) */}
            <div className="space-y-1">
              {childNodes.slice(0, 3).map((childNode, index) => {
                const childData = childNode.data as ActionNodeData;
                return (
                  <div
                    key={childNode.id}
                    className="flex items-center gap-1.5 p-1.5 bg-white rounded border border-indigo-100 text-[10px]"
                  >
                    <span className="text-indigo-400 font-mono">{index + 1}.</span>
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      childData.type === 'click' ? 'bg-blue-500' :
                      childData.type === 'type' ? 'bg-green-500' :
                      childData.type === 'navigate' ? 'bg-purple-500' :
                      childData.type === 'wait' ? 'bg-gray-500' :
                      childData.type === 'loop' ? 'bg-indigo-500' :
                      'bg-gray-400'
                    )} />
                    <span className="text-gray-700 font-medium truncate flex-1">{childData.label}</span>
                  </div>
                );
              })}
              {childNodes.length > 3 && (
                <div className="text-center py-1 text-[10px] text-indigo-400">
                  +{childNodes.length - 3} más...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer del Loop */}
      <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-200 rounded-b-lg">
        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
          <span>Doble clic para editar</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
});
