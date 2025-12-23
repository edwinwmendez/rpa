// Workflow Editor - Canvas principal con ReactFlow
import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ActionNode, ActionNodeData } from './ActionNode';
import { ActionPalette, ActionTemplate } from './ActionPalette';
import { Button } from '../ui/button';
import { Save, Play, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const nodeTypes = {
  action: ActionNode,
};

const initialNodes: Node<ActionNodeData>[] = [];
const initialEdges: Edge[] = [];

interface WorkflowEditorProps {
  workflowId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

export function WorkflowEditor({ workflowId, onSave }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [draggedAction, setDraggedAction] = useState<ActionTemplate | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const actionData = event.dataTransfer.getData('application/reactflow');
      if (!actionData) return;

      const action: ActionTemplate = JSON.parse(actionData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<ActionNodeData> = {
        id: `${action.type}-${Date.now()}`,
        type: 'action',
        position,
        data: {
          label: action.label,
          type: action.type,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedAction(null);
    },
    [reactFlowInstance, setNodes]
  );

  const handleDragStart = useCallback((action: ActionTemplate) => {
    setDraggedAction(action);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="flex h-full w-full">
      <ActionPalette onDragStart={handleDragStart} />
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className={cn(
            'bg-gray-50',
            draggedAction && 'cursor-grabbing'
          )}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'action') {
                const data = node.data as ActionNodeData;
                const colors: Record<string, string> = {
                  click: '#3b82f6',
                  type: '#10b981',
                  navigate: '#8b5cf6',
                  extract: '#f97316',
                  'send-email': '#ef4444',
                  wait: '#6b7280',
                };
                return colors[data.type] || '#6b7280';
              }
              return '#6b7280';
            }}
            className="bg-white border border-gray-200"
          />
          
          <Panel position="top-right" className="flex gap-2 m-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={!nodes.some((n) => n.selected) && !edges.some((e) => e.selected)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button size="sm" onClick={() => console.log('Ejecutar workflow')}>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

