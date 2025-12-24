// Node Search - Utilidades para buscar nodos en el canvas
import type { Node } from '@xyflow/react';
import type { ActionNodeData } from '../types/workflow';

type TypedNode = Node<ActionNodeData>;

export interface SearchResult {
  nodeId: string;
  matchType: 'label' | 'type' | 'description';
  matchedText: string;
  node: TypedNode;
}

/**
 * Busca nodos que coincidan con el término de búsqueda
 */
export function searchNodes(nodes: TypedNode[], searchTerm: string): SearchResult[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const term = searchTerm.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const node of nodes) {
    // Buscar en label
    const label = node.data?.label?.toLowerCase() || '';
    if (label.includes(term)) {
      results.push({
        nodeId: node.id,
        matchType: 'label',
        matchedText: node.data.label,
        node,
      });
      continue;
    }

    // Buscar en type
    const type = node.data?.type?.toLowerCase() || '';
    if (type.includes(term)) {
      results.push({
        nodeId: node.id,
        matchType: 'type',
        matchedText: node.data.type,
        node,
      });
      continue;
    }

    // Buscar en config/description si existe
    if (node.data?.config && typeof node.data.config === 'object') {
      const config = node.data.config as Record<string, unknown>;
      const description = String(config.description || '').toLowerCase();
      if (description.includes(term)) {
        results.push({
          nodeId: node.id,
          matchType: 'description',
          matchedText: String(config.description || ''),
          node,
        });
      }
    }
  }

  return results;
}

/**
 * Resalta un nodo específico centrándolo en la vista
 */
export function focusNode(nodeId: string, reactFlowInstance: any): void {
  if (!reactFlowInstance) return;

  const node = reactFlowInstance.getNode(nodeId);
  if (!node) return;

  // Centrar el nodo en la vista
  reactFlowInstance.setCenter(node.position.x, node.position.y, {
    zoom: 1.5,
    duration: 300,
  });
}

