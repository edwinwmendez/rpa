// Workflow Editor - Canvas principal con ReactFlow
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import { LoopCanvasEditor } from './LoopCanvasEditor';
import type { ActionNodeData } from '../../types/workflow';
import { ActionPalette } from './ActionPalette';
import type { ActionTemplate } from './ActionPalette';
import { Button } from '../ui/button';
import { Save, Play, Trash2, Copy, Clipboard, Undo2, Redo2, CopyPlus, MousePointer2, Download, Upload, AlignLeft, AlignRight, AlignCenterVertical, AlignCenterHorizontal, Search, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkflowsStore } from '../../stores/workflowsStore';
import { PropertiesPanel } from './PropertiesPanel';
import { useExcelFilesStore } from '../../stores/excelFilesStore';
import { useToast } from '../ui/toast';
import { ActionNode } from './ActionNode';
import { LoopNode } from './LoopNode';
import { IfElseNode } from './IfElseNode';
import { NoteNode, type NoteNodeData } from './NoteNode';
import { useWorkflowHistory } from '../../hooks/useWorkflowHistory';
import { downloadWorkflowAsFile, importWorkflowFromFile } from '../../lib/workflowExportImport';
import { alignNodes, type AlignmentDirection } from '../../lib/nodeAlignment';
import { searchNodes, focusNode, type SearchResult } from '../../lib/nodeSearch';
import { transformWorkflowForAgent } from '../../lib/workflowTransformer';
import { agentClient } from '../../lib/agentClient';
import { useAgentStore } from '../../stores/agentStore';
import { validateWorkflow, type ValidationIssue } from '../../lib/nodeValidation';

// Definido a nivel de módulo - NUNCA se recrea
const NODE_TYPES = {
  action: ActionNode,
  loop: LoopNode,
  'if-else': IfElseNode,
  note: NoteNode,
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
type TypedNode = Node<ActionNodeData | NoteNodeData>;

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
  const [isPropertiesPanelVisible, setIsPropertiesPanelVisible] = useState(false);
  // Estado para controlar selección múltiple (box selection)
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  // Estado para búsqueda de nodos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Estado para validación
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  
  // Estado para controlar navegación en loops anidados
  const [loopNavigationStack, setLoopNavigationStack] = useState<string[]>([]);

  // Estado para clipboard (copy/paste)
  const [clipboard, setClipboard] = useState<{ nodes: TypedNode[]; edges: Edge[] } | null>(null);

  // Hook de historial (Undo/Redo)
  const { saveState, undo, redo, canUndo, canRedo, resetHistory } = useWorkflowHistory(
    nodes,
    edges
  );

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

  // Guardar estado en historial cuando cambian nodos o edges (con debounce)
  useEffect(() => {
    // No guardar si es la carga inicial
    if (nodes.length === 0 && edges.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      saveState(nodes, edges);
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, saveState]);

  // Cargar workflow cuando cambia
  useEffect(() => {
    if (currentWorkflow) {
      const workflowNodes = (currentWorkflow.nodes as TypedNode[]) || [];
      const workflowEdges = currentWorkflow.edges || [];
      
      setNodes(workflowNodes);
      setEdges(workflowEdges);
      resetHistory(workflowNodes, workflowEdges);
      
      // Ajustar vista solo cuando se carga un workflow existente (con nodos)
      if (reactFlowInstance && workflowNodes.length > 0) {
        // Usar setTimeout para asegurar que los nodos se hayan renderizado
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
        }, 100);
      }
      
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
      resetHistory([], []);
    }
  }, [currentWorkflow, setNodes, setEdges, clearFiles, reactFlowInstance, resetHistory]);

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
    const nodesToDelete = nodes.filter((node) => node.selected);
    const edgesToDelete = edges.filter((edge) => edge.selected);
    
    if (nodesToDelete.length === 0 && edgesToDelete.length === 0) return;
    
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => {
      // Eliminar edges seleccionados y edges conectados a nodos eliminados
      const nodeIdsToDelete = new Set(nodesToDelete.map(n => n.id));
      return eds.filter((edge) => 
        !edge.selected && 
        !nodeIdsToDelete.has(edge.source) && 
        !nodeIdsToDelete.has(edge.target)
      );
    });
    
    saveState(
      nodes.filter((node) => !node.selected),
      edges.filter((edge) => {
        const nodeIdsToDelete = new Set(nodesToDelete.map(n => n.id));
        return !edge.selected && 
               !nodeIdsToDelete.has(edge.source) && 
               !nodeIdsToDelete.has(edge.target);
      })
    );
    
    showToast(`${nodesToDelete.length} nodo(s) y ${edgesToDelete.length} conexión(es) eliminados`, 'success');
  }, [setNodes, setEdges, nodes, edges, saveState, showToast]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: TypedNode) => {
    // No mostrar panel de propiedades para notas
    if (node.type === 'note') {
      return;
    }
    setSelectedNodeId(node.id);
    setIsPropertiesPanelVisible(true);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsPropertiesPanelVisible(false);
  }, []);

  const handleClosePropertiesPanel = useCallback(() => {
    setSelectedNodeId(null);
    setIsPropertiesPanelVisible(false);
  }, []);

  const handleConfigUpdate = useCallback((nodeId: string, config: ActionNodeData['config'] | any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        
        // Si es un nodo de nota, actualizar data directamente
        if (node.type === 'note') {
          return { ...node, data: { ...node.data, ...config } };
        }
        
        // Para otros nodos, actualizar data.config
        return { ...node, data: { ...node.data, config } };
      })
    );
    // Guardar estado después de actualizar configuración
    setTimeout(() => {
      const updatedNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        
        // Si es un nodo de nota, actualizar data directamente
        if (node.type === 'note') {
          return { ...node, data: { ...node.data, ...config } };
        }
        
        // Para otros nodos, actualizar data.config
        return { ...node, data: { ...node.data, config } };
      });
      saveState(updatedNodes, edges);
    }, 0);
  }, [setNodes, nodes, edges, saveState]);

  // Handler para Undo
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setNodes(previousState.nodes as TypedNode[]);
      setEdges(previousState.edges);
      showToast('Cambio deshecho', 'info');
    }
  }, [undo, setNodes, setEdges, showToast]);

  // Handler para Redo
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setNodes(nextState.nodes as TypedNode[]);
      setEdges(nextState.edges);
      showToast('Cambio rehecho', 'info');
    }
  }, [redo, setNodes, setEdges, showToast]);

  // Handler para Copy (copiar nodos seleccionados)
  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) {
      showToast('No hay nodos seleccionados para copiar', 'warning');
      return;
    }

    // Obtener edges conectados a los nodos seleccionados
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    const connectedEdges = edges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    setClipboard({ nodes: selectedNodes, edges: connectedEdges });
    showToast(`${selectedNodes.length} nodo(s) copiado(s)`, 'success');
  }, [nodes, edges, showToast]);

  // Handler para Paste (pegar nodos copiados)
  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) {
      showToast('No hay nada en el portapapeles', 'warning');
      return;
    }

    if (!reactFlowInstance) return;

    // Calcular offset para pegar (desplazar un poco hacia abajo y derecha)
    const offset = { x: 50, y: 50 };
    
    // Crear nuevos nodos con IDs únicos y posiciones desplazadas
    const nodeIdMap = new Map<string, string>();
    const newNodes = clipboard.nodes.map((node) => {
      const newId = `${node.data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
        selected: false, // Deseleccionar al pegar
      } as TypedNode;
    });

    // Crear nuevos edges con IDs actualizados
    const newEdges = clipboard.edges.map((edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      
      return {
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: newSource,
        target: newTarget,
        selected: false,
      };
    });

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    
    saveState([...nodes, ...newNodes], [...edges, ...newEdges]);
    showToast(`${newNodes.length} nodo(s) pegado(s)`, 'success');
  }, [clipboard, reactFlowInstance, setNodes, setEdges, nodes, edges, saveState, showToast]);

  // Handler para Duplicar nodo seleccionado
  const handleDuplicate = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) {
      showToast('Selecciona un nodo para duplicar', 'warning');
      return;
    }

    if (!reactFlowInstance) return;

    const offset = { x: 50, y: 50 };
    const nodeIdMap = new Map<string, string>();
    
    const newNodes = selectedNodes.map((node) => {
      const newId = `${node.data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
        selected: false,
      } as TypedNode;
    });

    // Duplicar edges conectados a los nodos seleccionados
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    const connectedEdges = edges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );
    
    const newEdges = connectedEdges.map((edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      
      return {
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: newSource,
        target: newTarget,
        selected: false,
      };
    });

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    
    saveState([...nodes, ...newNodes], [...edges, ...newEdges]);
    showToast(`${newNodes.length} nodo(s) duplicado(s)`, 'success');
  }, [nodes, edges, reactFlowInstance, setNodes, setEdges, saveState, showToast]);

  // Handler para Seleccionar Todos (Ctrl+A)
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
    setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
  }, [setNodes, setEdges]);

  // Handler para Exportar Workflow
  const handleExportWorkflow = useCallback(() => {
    try {
      const workflowName = currentWorkflow?.name || 'Workflow sin nombre';
      const workflowDescription = currentWorkflow?.description;
      
      downloadWorkflowAsFile(
        workflowName,
        workflowDescription,
        nodes,
        edges,
        (currentWorkflow as any)?.excelFiles
      );
      
      showToast('Workflow exportado correctamente', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error al exportar workflow: ${message}`, 'error');
    }
  }, [currentWorkflow, nodes, edges, showToast]);

  // Handler para Ejecutar Workflow
  const handleExecuteWorkflow = useCallback(async () => {
    try {
      // Verificar que el agente esté conectado
      const agentStatus = useAgentStore.getState().status;
      if (agentStatus.status !== 'connected') {
        showToast('El agente no está conectado. Por favor, inicia el agente local.', 'error');
        return;
      }

      // Validar workflow antes de ejecutar
      const validationIssues = validateWorkflow(nodes as TypedNode[], edges);
      const errorCount = validationIssues.filter(issue => issue.severity === 'error').length;
      if (errorCount > 0) {
        showToast(
          `El workflow tiene ${errorCount} error(es). Por favor, corrígelos antes de ejecutar.`,
          'error'
        );
        setValidationIssues(validationIssues);
        setShowValidation(true);
        return;
      }

      // Obtener nombre del workflow
      const workflowName = currentWorkflow?.name || 'Workflow sin nombre';

      showToast('Ejecutando workflow...', 'info');

      // Transformar workflow al formato del agente
      const agentWorkflow = transformWorkflowForAgent(workflowName, nodes, edges);

      // Ejecutar workflow (convertir a Record para compatibilidad con agentClient)
      const result = await agentClient.executeWorkflow(agentWorkflow as Record<string, unknown>);

      if (result.status === 'error') {
        showToast(`Error ejecutando workflow: ${result.error || 'Error desconocido'}`, 'error');
      } else {
        showToast(
          `Workflow ejecutado exitosamente. ${result.logs?.length || 0} pasos completados.`,
          'success'
        );
        
        // Opcional: Mostrar logs en consola o en un modal
        if (result.logs && result.logs.length > 0) {
          console.log('Logs de ejecución:', result.logs);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error al ejecutar workflow: ${message}`, 'error');
      console.error('Error ejecutando workflow:', error);
    }
  }, [nodes, edges, currentWorkflow, showToast]);

  // Handler para Importar Workflow
  const handleImportWorkflow = useCallback(() => {
    // Crear input file oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        showToast('Importando workflow...', 'info');
        
        const imported = await importWorkflowFromFile(file);
        
        // Cargar el workflow importado
        setNodes(imported.nodes as TypedNode[]);
        setEdges(imported.edges);
        resetHistory(imported.nodes as TypedNode[], imported.edges);
        
        // Si hay archivos Excel, intentar restaurarlos
        if (imported.excelFiles && imported.excelFiles.length > 0) {
          const { addFile } = useExcelFilesStore.getState();
          imported.excelFiles.forEach((fileData) => {
            const existing = useExcelFilesStore.getState().getFile(fileData.id);
            if (!existing) {
              addFile({
                id: fileData.id,
                name: fileData.name,
                filePath: fileData.filePath,
                fileContent: '', // Contenido vacío, se necesita recargar
                headers: fileData.headers,
                rows: [],
                totalRows: fileData.totalRows,
                delimiter: fileData.delimiter,
                firstRowAsHeaders: fileData.firstRowAsHeaders,
                loadedAt: new Date(),
                syncedWithAgent: false,
              });
            }
          });
        }
        
        // Ajustar vista
        if (reactFlowInstance && imported.nodes.length > 0) {
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
          }, 100);
        }
        
        showToast(`Workflow "${imported.name}" importado correctamente`, 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        showToast(`Error al importar workflow: ${message}`, 'error');
      } finally {
        // Limpiar input
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    input.click();
  }, [setNodes, setEdges, resetHistory, reactFlowInstance, showToast]);

  // Handler para alinear nodos
  const handleAlignNodes = useCallback((direction: AlignmentDirection) => {
    const selectedCount = nodes.filter((n) => n.selected).length;
    if (selectedCount < 2) {
      showToast('Selecciona al menos 2 nodos para alinear', 'warning');
      return;
    }

    const alignedNodes = alignNodes(nodes as TypedNode[], direction);
    setNodes(alignedNodes);
    saveState(alignedNodes, edges);
    showToast(`Nodos alineados (${selectedCount} nodos)`, 'success');
  }, [nodes, edges, setNodes, saveState, showToast]);

  // Handler para buscar nodos
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results = searchNodes(nodes as TypedNode[], term);
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [nodes]);

  // Handler para enfocar resultado de búsqueda
  const handleFocusSearchResult = useCallback((nodeId: string) => {
    focusNode(nodeId, reactFlowInstance);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
    setSelectedNodeId(nodeId);
    setIsPropertiesPanelVisible(true);
    setIsSearchOpen(false);
    setSearchTerm('');
  }, [reactFlowInstance, setNodes]);

  // Validar workflow cuando cambian nodos o edges
  useEffect(() => {
    const issues = validateWorkflow(nodes as TypedNode[], edges);
    setValidationIssues(issues);
  }, [nodes, edges]);

  // Handler para agregar nota
  const handleAddNote = useCallback(() => {
    if (!reactFlowInstance) return;

    const viewport = reactFlowInstance.getViewport();
    const centerX = -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
    const centerY = -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

    const newNote: TypedNode = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'note',
      position: { x: centerX - 100, y: centerY - 50 },
      data: {
        title: 'Nota',
        content: '',
        color: 'yellow',
      },
    };

    setNodes((nds) => [...nds, newNote]);
    saveState([...nodes, newNote], edges);
    showToast('Nota agregada', 'success');
  }, [reactFlowInstance, nodes, edges, setNodes, saveState, showToast]);

  // Escuchar actualizaciones de notas
  useEffect(() => {
    const handleNoteUpdate = (event: CustomEvent) => {
      const { nodeId, content, color, title } = event.detail;
      setNodes((nds) => {
        const updated = nds.map((node) => {
          if (node.id !== nodeId) return node;
          const updatedData = { ...node.data };
          if (content !== undefined) updatedData.content = content;
          if (color !== undefined) updatedData.color = color;
          if (title !== undefined) updatedData.title = title;
          return { ...node, data: updatedData };
        });
        // Guardar estado después de actualizar
        setTimeout(() => {
          saveState(updated, edges);
        }, 0);
        return updated;
      });
    };

    window.addEventListener('note-update', handleNoteUpdate as EventListener);
    return () => window.removeEventListener('note-update', handleNoteUpdate as EventListener);
  }, [setNodes]);

  // Handler para atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z o Cmd+Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z o Cmd+Shift+Z: Redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+Y: Redo (alternativo)
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C o Cmd+C: Copy
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V o Cmd+V: Paste
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+D o Cmd+D: Duplicate
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        handleDuplicate();
        return;
      }

      // Ctrl+A o Cmd+A: Select All
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      // Delete o Backspace: Eliminar seleccionados
      if ((event.key === 'Delete' || event.key === 'Backspace') && 
          (nodes.some(n => n.selected) || edges.some(e => e.selected))) {
        event.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Escape: Cerrar panel de propiedades
      if (event.key === 'Escape') {
        handleClosePropertiesPanel();
        return;
      }

      // Ctrl+S o Cmd+S: Guardar
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleSelectAll,
    handleDeleteSelected,
    handleClosePropertiesPanel,
    handleSave,
    nodes,
    edges,
  ]);

  // Handler para abrir canvas secundario al hacer doble clic en un Loop
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: TypedNode) => {
    if (node.type === 'loop') {
      setLoopNavigationStack(prev => [...prev, node.id]);
      setSelectedNodeId(null);
      setIsPropertiesPanelVisible(false);
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

  // Agregar indicadores de validación a los nodos
  const nodesWithValidation = nodes.map(n => {
    const nodeIssues = validationIssues.filter(i => i.nodeId === n.id);
    const errors = nodeIssues.filter(i => i.severity === 'error').length;
    const warnings = nodeIssues.filter(i => i.severity === 'warning').length;
    
    return {
      ...n,
      data: {
        ...n.data,
        validationErrors: errors,
        validationWarnings: warnings,
      },
    };
  });

  // Ocultar nodos con parentId en el canvas principal usando la prop `hidden`
  // Esto permite que LoopNode pueda acceder a ellos vía getNodes() pero no se renderizan
  const nodesWithHiddenChildren = nodesWithValidation.map(n => ({
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
          multiSelectionKeyCode={['Control', 'Meta']}
          panOnDrag={!isSelectionModeActive}
          panOnScroll={true}
          selectionOnDrag={isSelectionModeActive}
          nodeOrigin={[0.5, 0.5]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          // Habilitar renderizado de nodos hijos dentro de padres
          nodeExtent={undefined}
          className={cn(
            'bg-gray-50',
            draggedAction && 'cursor-grabbing'
          )}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          
          <Panel position="top-right" className="flex gap-2 m-4 flex-wrap">
            {/* Undo/Redo */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            {/* Toggle Selección Múltiple */}
            <Button
              variant={isSelectionModeActive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSelectionModeActive(!isSelectionModeActive)}
              title={isSelectionModeActive ? "Desactivar selección múltiple (arrastrar)" : "Activar selección múltiple (arrastrar)"}
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            
            {/* Copy/Paste/Duplicate */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!nodes.some((n) => n.selected)}
              title="Copiar (Ctrl+C)"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              disabled={!clipboard || clipboard.nodes.length === 0}
              title="Pegar (Ctrl+V)"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={!nodes.some((n) => n.selected)}
              title="Duplicar (Ctrl+D)"
            >
              <CopyPlus className="h-4 w-4" />
            </Button>
            
            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={!nodes.some((n) => n.selected) && !edges.some((e) => e.selected)}
              title="Eliminar (Delete)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            {/* Alinear Nodos */}
            {nodes.filter((n) => n.selected).length >= 2 && (
              <>
                <div className="border-l border-gray-300 mx-1" />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlignNodes('left')}
                    title="Alinear izquierda"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlignNodes('right')}
                    title="Alinear derecha"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlignNodes('center-vertical')}
                    title="Centrar verticalmente"
                  >
                    <AlignCenterVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlignNodes('center-horizontal')}
                    title="Centrar horizontalmente"
                  >
                    <AlignCenterHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Búsqueda */}
            <div className="border-l border-gray-300 mx-1" />
            <div className="relative">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchTerm && setIsSearchOpen(true)}
                  placeholder="Buscar nodos..."
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
                <Search className="h-4 w-4 text-gray-400 absolute right-3" />
              </div>
              
              {/* Resultados de búsqueda */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto min-w-[300px]">
                  {searchResults.map((result) => (
                    <button
                      key={result.nodeId}
                      onClick={() => handleFocusSearchResult(result.nodeId)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{result.matchedText}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {result.matchType} • {result.node.data.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Validación */}
            <div className="border-l border-gray-300 mx-1" />
            <Button
              variant={validationIssues.length > 0 ? (validationIssues.some(i => i.severity === 'error') ? "destructive" : "outline") : "outline"}
              size="sm"
              onClick={() => setShowValidation(!showValidation)}
              title={validationIssues.length > 0 ? `${validationIssues.length} problema(s) encontrado(s)` : 'Sin problemas de validación'}
            >
              {validationIssues.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationIssues.filter(i => i.severity === 'error').length}
                </>
              )}
            </Button>

            {/* Agregar Nota */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNote}
              title="Agregar nota/comentario"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            {/* Export/Import */}
            <div className="border-l border-gray-300 mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWorkflow}
              disabled={nodes.length === 0}
              title="Exportar workflow a JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportWorkflow}
              title="Importar workflow desde JSON"
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            {/* Save/Execute */}
            <Button variant="outline" size="sm" onClick={handleSave} title="Guardar (Ctrl+S)">
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button size="sm" onClick={handleExecuteWorkflow}>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Panel de Propiedades */}
      {isPropertiesPanelVisible && (
        <PropertiesPanel
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          onUpdate={handleConfigUpdate}
          onClose={handleClosePropertiesPanel}
          onDuplicate={(nodeId) => {
            // Seleccionar el nodo y duplicarlo
            const nodeToDuplicate = nodes.find(n => n.id === nodeId);
            if (nodeToDuplicate) {
              setNodes((nds) => nds.map(n => ({ ...n, selected: n.id === nodeId })));
              setTimeout(() => handleDuplicate(), 0);
            }
          }}
        />
      )}
    </div>
  );
}

