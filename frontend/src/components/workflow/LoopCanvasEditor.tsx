import { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ActionNodeData } from '../../types/workflow';
import { ActionPalette } from './ActionPalette';
import type { ActionTemplate } from './ActionPalette';
import { Button } from '../ui/button';
import { X, Save } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';
import { ActionNode } from './ActionNode';
import { LoopNode } from './LoopNode';
import { IfElseNode } from './IfElseNode';

// Definido a nivel de módulo - NUNCA se recrea
const NODE_TYPES = {
  action: ActionNode,
  loop: LoopNode,
  'if-else': IfElseNode,
} as const;

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep' as const,
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#6b7280',
  },
  style: {
    strokeWidth: 2,
    stroke: '#6b7280',
  },
};

// Tipo auxiliar para nodos tipados
type TypedNode = Node<ActionNodeData>;

interface LoopCanvasEditorProps {
  loopId: string;
  loopLabel: string;
  initialNodes: TypedNode[];
  initialEdges: Edge[];
  onClose: () => void;
  onSave: (nodes: TypedNode[], edges: Edge[]) => void;
  onOpenNestedLoop?: (loopId: string) => void;
}

export function LoopCanvasEditor({
  loopId: _loopId, // Mantenido para identificación, se usa en el componente padre
  loopLabel,
  initialNodes,
  initialEdges,
  onClose,
  onSave,
  onOpenNestedLoop,
}: LoopCanvasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6b7280',
        },
        style: {
          strokeWidth: 2,
          stroke: '#6b7280',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const actionData = event.dataTransfer.getData('application/reactflow');
      if (!actionData) return;

      const action: ActionTemplate = JSON.parse(actionData);
      
      const dropPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const createInitialConfig = (actionType: string): ActionNodeData['config'] => {
        const baseConfig = { type: actionType, label: action.label };
        switch (actionType) {
          case 'type':
            return { ...baseConfig, selector: '', text: '', clearBefore: true } as any;
          case 'click':
            return { ...baseConfig, selector: '', clickType: 'left' } as any;
          case 'wait':
            return { ...baseConfig, waitType: 'time', duration: 1 } as any;
          case 'navigate':
            return { ...baseConfig, url: '', browser: 'chrome', waitForLoad: true } as any;
          case 'extract':
            return { ...baseConfig, selector: '', variableName: '' } as any;
          case 'loop':
            return { ...baseConfig, loopMode: 'excel', dataSource: '', iterationVariable: 'fila' } as any;
          case 'if-else':
            return { ...baseConfig, condition: '', operator: '==' } as any;
          case 'read-text':
            return { ...baseConfig, selector: '', variableName: '' } as any;
          default:
            return baseConfig as any;
        }
      };

      const nodeType = action.type === 'loop' ? 'loop' : 
                       action.type === 'if-else' ? 'if-else' : 
                       'action';

      const newNode: TypedNode = {
        id: `${action.type}-${Date.now()}`,
        type: nodeType,
        position: dropPosition,
        // NO establecer parentId aquí - se agregará al guardar
        data: {
          label: action.label,
          type: action.type as ActionNodeData['type'],
          config: createInitialConfig(action.type),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = useCallback(() => {
    onSave(nodes, edges);
    onClose();
  }, [nodes, edges, onSave, onClose]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: TypedNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleConfigUpdate = useCallback((nodeId: string, config: ActionNodeData['config']) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, [setNodes]);

  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: TypedNode) => {
    if (node.type === 'loop' && onOpenNestedLoop) {
      // Guardar cambios actuales antes de abrir loop anidado
      onSave(nodes, edges);
      onOpenNestedLoop(node.id);
    }
  }, [nodes, edges, onSave, onOpenNestedLoop]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Canvas Principal</span>
            <span className="text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <h2 className="text-lg font-semibold text-indigo-900">
              Editando Loop: {loopLabel}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar y cerrar
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex">
        <ActionPalette onDragStart={() => {}} />
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPaneClick={handlePaneClick}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            fitView
            className="bg-gray-50"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'loop') return '#6366f1';
                if (node.type === 'if-else') return '#f59e0b';
                if (node.type === 'action') {
                  const data = node.data as ActionNodeData;
                  const colors: Record<string, string> = {
                    click: '#3b82f6',
                    type: '#10b981',
                    navigate: '#8b5cf6',
                    extract: '#f97316',
                    'send-email': '#ef4444',
                    wait: '#6b7280',
                    loop: '#6366f1',
                    'if-else': '#f59e0b',
                    'read-text': '#14b8a6',
                  };
                  return colors[data.type] || '#6b7280';
                }
                return '#6b7280';
              }}
              className="bg-white border border-gray-200"
            />
            
            <Panel position="top-center" className="bg-indigo-100 border border-indigo-200 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-indigo-700 font-medium">
                💡 Arrastra acciones aquí para agregarlas al Loop
              </p>
            </Panel>
          </ReactFlow>
        </div>

        {/* Panel de Propiedades */}
        <PropertiesPanel
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          onUpdate={handleConfigUpdate}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
}

