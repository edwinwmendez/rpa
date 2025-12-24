// Workflow Editor - Canvas principal con ReactFlow
import { useCallback, useRef, useState, useEffect } from 'react';
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
import { LoopCanvasEditor } from './LoopCanvasEditor';
import type { ActionNodeData } from '../../types/workflow';
import { ActionPalette } from './ActionPalette';
import type { ActionTemplate } from './ActionPalette';
import { Button } from '../ui/button';
import { Save, Play, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkflowsStore } from '../../stores/workflowsStore';
import { PropertiesPanel } from './PropertiesPanel';
import { useExcelFilesStore } from '../../stores/excelFilesStore';
import { useToast } from '../ui/toast';
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

interface WorkflowEditorProps {
  workflowId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

// Tipo auxiliar para nodos tipados
type TypedNode = Node<ActionNodeData>;

export function WorkflowEditor({ onSave }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { currentWorkflow } = useWorkflowsStore();
  const { clearFiles } = useExcelFilesStore();
  const { showToast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (currentWorkflow?.nodes as TypedNode[]) || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    currentWorkflow?.edges || []
  );
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [draggedAction, setDraggedAction] = useState<ActionTemplate | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Estado para controlar navegación en loops anidados
  const [loopNavigationStack, setLoopNavigationStack] = useState<string[]>([]);

  // Cargar archivos Excel guardados en el workflow (si existen)
  useEffect(() => {
    if (currentWorkflow && (currentWorkflow as any).excelFiles) {
      // TODO: Restaurar archivos Excel desde el workflow guardado
      // Por ahora, los archivos se cargan manualmente en cada sesión
    }
    
    // Limpiar archivos al cambiar de workflow
    return () => {
      // No limpiar automáticamente para permitir trabajar con múltiples workflows
    };
  }, [currentWorkflow]);

  // Cargar workflow cuando cambia
  useEffect(() => {
    if (currentWorkflow) {
      setNodes((currentWorkflow.nodes as TypedNode[]) || []);
      setEdges(currentWorkflow.edges || []);
      
      // Cargar archivos Excel guardados en el workflow
      if (currentWorkflow.excelFiles && currentWorkflow.excelFiles.length > 0) {
        // Restaurar archivos Excel desde el workflow guardado
        // Nota: Solo restauramos metadata, el contenido del archivo se debe recargar
        // o almacenarse en Cloud Storage para restauración completa
        const { addFile } = useExcelFilesStore.getState();
        currentWorkflow.excelFiles.forEach((fileData) => {
          // Verificar si el archivo ya existe
          const existing = useExcelFilesStore.getState().getFile(fileData.id);
          if (!existing) {
            // Crear estructura básica (sin contenido completo por ahora)
            // El archivo se marcará como no sincronizado hasta que se vuelva a cargar
            addFile({
              id: fileData.id,
              name: fileData.name,
              filePath: fileData.filePath,
              fileContent: '', // Contenido vacío, se necesita recargar el archivo
              headers: fileData.headers,
              rows: [], // Se cargaría desde storage si es necesario
              totalRows: fileData.totalRows,
              delimiter: fileData.delimiter,
              firstRowAsHeaders: fileData.firstRowAsHeaders,
              loadedAt: new Date(),
              syncedWithAgent: false, // Asumir que no está sincronizado hasta verificar
            });
          }
        });
      } else {
        // Limpiar archivos si el workflow no tiene archivos guardados
        clearFiles();
      }
    } else {
      clearFiles();
    }
  }, [currentWorkflow, setNodes, setEdges, clearFiles]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Verificar que ambos nodos existan
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;

      // Si ambos nodos tienen el mismo parentId (están dentro del mismo Loop), permitir conexión
      // Si tienen diferentes parentId, no permitir conexión entre loops diferentes
      if (sourceNode.parentId && targetNode.parentId && sourceNode.parentId !== targetNode.parentId) {
        console.warn('No se pueden conectar nodos de diferentes loops');
        return;
      }

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
    [setEdges, nodes]
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
      // Usar screenToFlowPosition (API actualizada) en lugar de project (deprecado)
      const dropPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Verificar si se soltó sobre un Loop (para establecer parentId)
      // Mejorar detección: verificar si el drop está dentro del área del Loop
      // Usar getBoundingClientRect para obtener dimensiones reales del nodo
      const allNodes = reactFlowInstance.getNodes();
      let loopNode: Node | undefined = undefined;
      
      // Buscar el Loop más cercano al punto de drop
      for (const node of allNodes) {
        if (node.type !== 'loop') continue;
        
        // Obtener el elemento DOM del nodo para dimensiones reales
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
        if (!nodeElement) {
          // Fallback: usar dimensiones estimadas
          const nodeWidth = 400;
          const nodeHeight = 300; // Altura más generosa para mejor detección
          const isWithinX = dropPosition.x >= node.position.x && dropPosition.x <= node.position.x + nodeWidth;
          const isWithinY = dropPosition.y >= node.position.y && dropPosition.y <= node.position.y + nodeHeight;
          if (isWithinX && isWithinY) {
            loopNode = node;
            break;
          }
        } else {
          const rect = nodeElement.getBoundingClientRect();
          // Usar screenToFlowPosition para convertir coordenadas de pantalla a coordenadas del flow
          const nodeTopLeft = reactFlowInstance.screenToFlowPosition({
            x: rect.left,
            y: rect.top,
          });
          const nodeBottomRight = reactFlowInstance.screenToFlowPosition({
            x: rect.right,
            y: rect.bottom,
          });
          
          // Verificar si el drop está dentro del área del Loop
          const isWithinX = dropPosition.x >= nodeTopLeft.x && dropPosition.x <= nodeBottomRight.x;
          const isWithinY = dropPosition.y >= nodeTopLeft.y && dropPosition.y <= nodeBottomRight.y;
          
          if (isWithinX && isWithinY) {
            loopNode = node;
            break;
          }
        }
      }

      // Crear configuración inicial según el tipo de acción
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
          // excel-read ya no es una acción
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

      // Determinar el tipo de nodo según la acción
      const nodeType = action.type === 'loop' ? 'loop' : 
                       action.type === 'if-else' ? 'if-else' : 
                       'action';

      // Si se soltó sobre un Loop y no es otro Loop, establecer parentId
      // parentId se usa para agrupación lógica, no para posicionamiento visual rígido
      let finalPosition = dropPosition;
      let parentId: string | undefined = undefined;
      
      if (loopNode && action.type !== 'loop') {
        parentId = loopNode.id;
        // Obtener acciones hijas existentes del Loop para apilarlas
        const existingChildren = reactFlowInstance.getNodes().filter((n: Node) => n.parentId === loopNode!.id);
        
        // Calcular posición relativa al Loop (no absoluta en el canvas)
        // En ReactFlow, cuando un nodo tiene parentId, su posición debe ser relativa al padre
        const relativeX = dropPosition.x - loopNode.position.x;
        const relativeY = dropPosition.y - loopNode.position.y;
        
        // Ajustar posición relativa dentro del Loop
        // Header del Loop: ~80px, luego el área de contenido empieza en ~150px
        if (relativeX >= 0 && relativeX <= 400 && relativeY >= 80) {
          // Dentro del área del Loop
          finalPosition = {
            x: Math.max(20, Math.min(relativeX, 360)), // Offset desde el borde izquierdo del Loop
            y: Math.max(150, relativeY), // Offset desde el top del Loop (después del header)
          };
        } else {
          // Si está fuera del área visual, apilar verticalmente después de las acciones existentes
          finalPosition = {
            x: 20, // Offset desde el borde izquierdo
            y: 150 + (existingChildren.length * 80), // Apilar acciones verticalmente con espaciado
          };
        }
      }

      const newNode: TypedNode = {
        id: `${action.type}-${Date.now()}`,
        type: nodeType,
        position: finalPosition,
        parentId: parentId,
        // NO usar extent: 'parent' - los nodos dentro del Loop no se renderizarán
        // visualmente, solo se listarán en el LoopNode
        data: {
          label: action.label,
          type: action.type as ActionNodeData['type'],
          config: createInitialConfig(action.type),
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

  // Handler para abrir canvas secundario al hacer doble clic en un Loop
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: TypedNode) => {
    if (node.type === 'loop') {
      setLoopNavigationStack(prev => [...prev, node.id]);
      setSelectedNodeId(null);
    }
  }, []);

  // Handler para guardar cambios del canvas secundario
  const handleLoopCanvasSave = useCallback((updatedNodes: TypedNode[], updatedEdges: Edge[]) => {
    const currentLoopId = loopNavigationStack[loopNavigationStack.length - 1];
    
    // IMPORTANTE: Restaurar parentId a los nodos que vienen del canvas secundario
    // En el canvas secundario no tienen parentId para evitar errores de ReactFlow,
    // pero en el canvas principal necesitan el parentId para agruparse correctamente
    const nodesWithParent = updatedNodes.map(n => ({
      ...n,
      parentId: currentLoopId,
    }));
    
    // Actualizar nodos: reemplazar los nodos hijos del loop con los nuevos
    setNodes((nds) => {
      // Filtrar los nodos que NO son hijos del loop actual
      const nodesOutsideLoop = nds.filter(n => n.parentId !== currentLoopId);
      // Agregar los nodos actualizados del loop (con parentId restaurado)
      return [...nodesOutsideLoop, ...nodesWithParent];
    });

    // Actualizar edges: reemplazar los edges que conectan nodos del loop
    setEdges((eds) => {
      // Filtrar edges que NO están dentro del loop
      const nodeIdsInLoop = new Set(updatedNodes.map(n => n.id));
      const edgesOutsideLoop = eds.filter(e => 
        !nodeIdsInLoop.has(e.source) && !nodeIdsInLoop.has(e.target)
      );
      // Agregar los edges actualizados del loop
      return [...edgesOutsideLoop, ...updatedEdges];
    });
    
    // Mostrar toast de éxito
    showToast('Cambios guardados correctamente', 'success');
  }, [loopNavigationStack, setNodes, setEdges, showToast]);

  // Handler para cerrar canvas secundario
  const handleLoopCanvasClose = useCallback(() => {
    setLoopNavigationStack(prev => prev.slice(0, -1));
  }, []);

  // Handler para abrir loop anidado desde canvas secundario
  const handleOpenNestedLoop = useCallback((loopId: string) => {
    setLoopNavigationStack(prev => [...prev, loopId]);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Obtener el loop actual si estamos en un canvas secundario
  const currentLoopId = loopNavigationStack[loopNavigationStack.length - 1] || null;
  const currentLoopNode = currentLoopId ? nodes.find(n => n.id === currentLoopId) : null;

  // Filtrar nodos y edges para el canvas secundario
  // IMPORTANTE: Remover parentId de los nodos para el canvas secundario
  // ReactFlow requiere que el nodo padre exista, pero en el canvas secundario
  // solo tenemos los hijos. Los parentId se restauran al guardar.
  const loopChildNodes = currentLoopId 
    ? nodes
        .filter(n => n.parentId === currentLoopId)
        .map(n => ({ ...n, parentId: undefined }))
    : [];
  const loopChildEdges = currentLoopId
    ? edges.filter(e => {
        const nodeIdsInLoop = new Set(loopChildNodes.map(n => n.id));
        return nodeIdsInLoop.has(e.source) && nodeIdsInLoop.has(e.target);
      })
    : [];

  // Si hay un loop abierto, mostrar el canvas secundario
  if (currentLoopId && currentLoopNode) {
    return (
      <LoopCanvasEditor
        loopId={currentLoopId}
        loopLabel={currentLoopNode.data.label}
        initialNodes={loopChildNodes}
        initialEdges={loopChildEdges}
        onClose={handleLoopCanvasClose}
        onSave={handleLoopCanvasSave}
        onOpenNestedLoop={handleOpenNestedLoop}
      />
    );
  }

  // Ocultar nodos con parentId en el canvas principal usando la prop `hidden`
  // Esto permite que LoopNode pueda acceder a ellos vía getNodes() pero no se renderizan
  const nodesWithHiddenChildren = nodes.map(n => ({
    ...n,
    hidden: n.parentId !== undefined, // Ocultar nodos que tienen un padre
  }));
  
  // Canvas principal
  return (
    <div className="flex h-full w-full">
      <ActionPalette onDragStart={handleDragStart} />
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodesWithHiddenChildren}
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
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          // Habilitar renderizado de nodos hijos dentro de padres
          nodeExtent={undefined}
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
              if (node.type === 'loop') {
                return '#6366f1'; // Indigo para Loop
              }
              if (node.type === 'if-else') {
                return '#f59e0b'; // Amber para If/Else
              }
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

      {/* Panel de Propiedades */}
      <PropertiesPanel
        selectedNode={selectedNode}
        nodes={nodes}
        edges={edges}
        onUpdate={handleConfigUpdate}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}

