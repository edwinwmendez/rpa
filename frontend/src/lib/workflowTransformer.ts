// Workflow Transformer - Transforma formato frontend → formato agente
import type { Node, Edge } from '@xyflow/react';
import type { ActionNodeData } from '../types/workflow';

/**
 * Transforma un workflow del formato frontend al formato esperado por el agente
 * 
 * Frontend format:
 * - nodes: Node[] con data.type, data.config, etc.
 * - edges: Edge[] con source, target
 * 
 * Agent format:
 * - nodes: Array con type, data.actionType, data.params (para actions)
 * - edges: Array con source, target
 */
export interface AgentWorkflow extends Record<string, unknown> {
  name: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  variables?: Record<string, unknown>;
}

export interface AgentNode {
  id: string;
  type: 'action' | 'loop' | 'ifElse';
  data: AgentNodeData;
  position?: { x: number; y: number };
}

export interface AgentNodeData {
  // Para action nodes
  actionType?: string;
  params?: Record<string, unknown>;
  
  // Para loop nodes
  loopType?: string;
  source?: string;
  iterations?: number;
  condition?: string;
  childNodes?: AgentNode[];
  childEdges?: AgentEdge[];
  
  // Para ifElse nodes
  trueNodes?: AgentNode[];
  falseNodes?: AgentNode[];
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Transforma un nodo del frontend al formato del agente
 */
function transformNode(node: Node, allNodes: Node[], allEdges: Edge[]): AgentNode {
  const nodeData = node.data as ActionNodeData;
  // Convertir config a unknown primero para evitar errores de tipo
  const config = (nodeData.config || {}) as unknown as Record<string, unknown>;
  
  const agentNode: AgentNode = {
    id: node.id,
    type: node.type === 'action' ? 'action' : (node.type === 'loop' ? 'loop' : 'ifElse'),
    position: node.position,
    data: {},
  };

  if (node.type === 'action') {
    // Transformar action node
    const actionType = nodeData.type as string;
    
    // Mapear tipos de acción del frontend al agente
    const actionTypeMap: Record<string, string> = {
      'click': 'click',
      'type': 'type',
      'wait': 'wait',
      'navigate': 'navigate',
      'extract': 'extract',
      'read-text': 'readText',
      'excel-read': 'excel-read', // El agente puede no soportarlo, se manejará
    };
    
    const mappedActionType = actionTypeMap[actionType] || actionType;
    agentNode.data.actionType = mappedActionType;
    
    // Transformar params según el tipo de acción
    const params: Record<string, unknown> = {};
    
    if (actionType === 'click') {
      params.selector = parseSelector(config.selector as string);
      if (config.clickType) {
        params.double = config.clickType === 'double';
      }
    } else if (actionType === 'type') {
      params.selector = parseSelector(config.selector as string);
      params.text = config.text || '';
    } else if (actionType === 'wait') {
      const waitType = config.waitType as string || 'time';
      params.waitType = waitType === 'element-appear' || waitType === 'element-disappear' 
        ? 'element' 
        : 'time';
      
      if (waitType === 'time') {
        params.seconds = config.duration || 1;
      } else {
        params.selector = parseSelector(config.selector as string);
        params.timeout = config.timeout || 30;
      }
    } else if (actionType === 'read-text' || actionType === 'extract') {
      params.selector = parseSelector(config.selector as string);
      params.variableName = config.variableName || 'text';
    } else if (actionType === 'navigate') {
      params.url = config.url || '';
    }
    
    agentNode.data.params = params;
    
  } else if (node.type === 'loop') {
    // Transformar loop node
    const loopMode = config.loopMode as string || 'excel';
    
    // Mapear loopMode del frontend a loopType del agente
    const loopTypeMap: Record<string, string> = {
      'excel': 'excel',
      'count': 'times',
      'until': 'until',
      'while': 'while',
    };
    
    agentNode.data.loopType = loopTypeMap[loopMode] || 'excel';
    
    if (loopMode === 'excel') {
      // Obtener el nombre del archivo sin extensión
      const dataSource = config.dataSource as string || '';
      agentNode.data.source = dataSource; // El agente espera el nombre del archivo
    } else if (loopMode === 'count') {
      agentNode.data.iterations = config.repeatCount as number || 1;
    } else if (loopMode === 'until' || loopMode === 'while') {
      agentNode.data.condition = config.condition as string || '';
    }
    
    // Obtener nodos hijos (nodos con parentId igual a este loop)
    const childNodes = allNodes.filter(n => n.parentId === node.id);
    const childEdges = allEdges.filter(e => {
      const sourceNode = allNodes.find(n => n.id === e.source);
      const targetNode = allNodes.find(n => n.id === e.target);
      return sourceNode?.parentId === node.id && targetNode?.parentId === node.id;
    });
    
    agentNode.data.childNodes = childNodes.map(n => transformNode(n, allNodes, allEdges));
    agentNode.data.childEdges = transformEdges(childEdges);
    
  } else if (node.type === 'ifElse') {
    // Transformar ifElse node
    agentNode.data.condition = config.condition as string || '';
    
    // Obtener nodos hijos según las conexiones
    // Los edges del ifElse tienen sourceHandle 'true' o 'false'
    const trueEdges = allEdges.filter(e => e.source === node.id && e.sourceHandle === 'true');
    const falseEdges = allEdges.filter(e => e.source === node.id && e.sourceHandle === 'false');
    
    const trueNodeIds = new Set(trueEdges.map(e => e.target));
    const falseNodeIds = new Set(falseEdges.map(e => e.target));
    
    // Obtener nodos directamente conectados (no hijos anidados)
    const trueNodes: AgentNode[] = [];
    const falseNodes: AgentNode[] = [];
    
    // Solo considerar nodos que no tienen parentId (están al mismo nivel)
    allNodes.forEach(n => {
      if (!n.parentId && trueNodeIds.has(n.id)) {
        trueNodes.push(transformNode(n, allNodes, allEdges));
      }
      if (!n.parentId && falseNodeIds.has(n.id)) {
        falseNodes.push(transformNode(n, allNodes, allEdges));
      }
    });
    
    agentNode.data.trueNodes = trueNodes;
    agentNode.data.falseNodes = falseNodes;
  }

  return agentNode;
}

/**
 * Transforma edges del frontend al formato del agente
 */
function transformEdges(edges: Edge[]): AgentEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
    targetHandle: edge.targetHandle || undefined,
  }));
}

/**
 * Parsea un selector string a objeto selector del agente
 * El agente espera un objeto con auto_id, title, control_type, class_name
 * El frontend puede tener un selector como:
 * - JSON: '{"auto_id": "btnGuardar"}'
 * - Formato key:value: 'auto_id:btnGuardar', 'title:Mi Botón'
 * - String simple: 'Mi Botón' (se usa como title)
 */
function parseSelector(selectorStr: string | undefined): Record<string, unknown> {
  if (!selectorStr || !selectorStr.trim()) {
    return {};
  }
  
  const trimmed = selectorStr.trim();
  
  // Intentar parsear como JSON primero
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // No es JSON válido, continuar con otros formatos
  }
  
  // Intentar parsear formato key:value (ej: "auto_id:btnGuardar")
  const keyValueMatch = trimmed.match(/^(\w+):(.+)$/);
  if (keyValueMatch) {
    const [, key, value] = keyValueMatch;
    const selectorMap: Record<string, string> = {
      'auto_id': 'auto_id',
      'title': 'title',
      'control_type': 'control_type',
      'class_name': 'class_name',
    };
    
    const mappedKey = selectorMap[key] || key;
    return { [mappedKey]: value };
  }
  
  // Si es un string simple, usar como title (comportamiento por defecto)
  return {
    title: trimmed,
  };
}

/**
 * Transforma un workflow completo del formato frontend al formato del agente
 */
export function transformWorkflowForAgent(
  name: string,
  nodes: Node[],
  edges: Edge[],
  variables?: Record<string, unknown>
): AgentWorkflow {
  // Filtrar solo nodos de nivel raíz (sin parentId)
  const rootNodes = nodes.filter(n => !n.parentId);
  const rootEdges = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    return !sourceNode?.parentId && !targetNode?.parentId;
  });
  
  const agentNodes = rootNodes.map(node => transformNode(node, nodes, edges));
  const agentEdges = transformEdges(rootEdges);
  
  return {
    name,
    nodes: agentNodes,
    edges: agentEdges,
    variables,
  };
}

