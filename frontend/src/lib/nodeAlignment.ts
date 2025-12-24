// Node Alignment - Utilidades para alinear nodos en el canvas
import type { Node } from '@xyflow/react';
import type { ActionNodeData } from '../types/workflow';

type TypedNode = Node<ActionNodeData>;

export type AlignmentDirection = 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical';

/**
 * Alinea nodos seleccionados según la dirección especificada
 */
export function alignNodes(
  nodes: TypedNode[],
  direction: AlignmentDirection
): TypedNode[] {
  const selectedNodes = nodes.filter((node) => node.selected);
  
  if (selectedNodes.length < 2) {
    return nodes; // Necesitamos al menos 2 nodos para alinear
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  
  switch (direction) {
    case 'left':
      return alignLeft(selectedNodes, nodeMap);
    case 'right':
      return alignRight(selectedNodes, nodeMap);
    case 'top':
      return alignTop(selectedNodes, nodeMap);
    case 'bottom':
      return alignBottom(selectedNodes, nodeMap);
    case 'center-horizontal':
      return alignCenterHorizontal(selectedNodes, nodeMap);
    case 'center-vertical':
      return alignCenterVertical(selectedNodes, nodeMap);
    default:
      return nodes;
  }
}

function alignLeft(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Encontrar el X más pequeño
  const minX = Math.min(...selectedNodes.map((node) => node.position.x));
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, x: minX },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

function alignRight(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Encontrar el X más grande (necesitamos considerar el ancho del nodo)
  // Por simplicidad, usamos un ancho estimado de 200px
  const NODE_WIDTH = 200;
  const maxX = Math.max(...selectedNodes.map((node) => node.position.x + NODE_WIDTH));
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, x: maxX - NODE_WIDTH },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

function alignTop(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Encontrar el Y más pequeño
  const minY = Math.min(...selectedNodes.map((node) => node.position.y));
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, y: minY },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

function alignBottom(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Encontrar el Y más grande (considerando altura estimada)
  const NODE_HEIGHT = 80;
  const maxY = Math.max(...selectedNodes.map((node) => node.position.y + NODE_HEIGHT));
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, y: maxY - NODE_HEIGHT },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

function alignCenterHorizontal(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Calcular el centro horizontal del grupo
  const NODE_WIDTH = 200;
  const minX = Math.min(...selectedNodes.map((node) => node.position.x));
  const maxX = Math.max(...selectedNodes.map((node) => node.position.x + NODE_WIDTH));
  const centerX = (minX + maxX) / 2 - NODE_WIDTH / 2;
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, x: centerX },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

function alignCenterVertical(selectedNodes: TypedNode[], nodeMap: Map<string, TypedNode>): TypedNode[] {
  // Calcular el centro vertical del grupo
  const NODE_HEIGHT = 80;
  const minY = Math.min(...selectedNodes.map((node) => node.position.y));
  const maxY = Math.max(...selectedNodes.map((node) => node.position.y + NODE_HEIGHT));
  const centerY = (minY + maxY) / 2 - NODE_HEIGHT / 2;
  
  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, y: centerY },
  })).map((alignedNode) => {
    nodeMap.set(alignedNode.id, alignedNode);
    return alignedNode;
  });
}

