// Node Validation - Validación de nodos en workflows
import type { Node, Edge } from '@xyflow/react';
import type { ActionNodeData } from '../types/workflow';

type TypedNode = Node<ActionNodeData>;

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  nodeId: string;
  severity: ValidationSeverity;
  message: string;
  type: ValidationType;
}

export type ValidationType =
  | 'missing-config'
  | 'invalid-selector'
  | 'missing-variable'
  | 'orphan-node'
  | 'no-connections'
  | 'circular-reference'
  | 'missing-excel-file';

/**
 * Valida todos los nodos en el workflow
 */
export function validateWorkflow(nodes: TypedNode[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Validar cada nodo individualmente
  for (const node of nodes) {
    issues.push(...validateNode(node, nodes, edges));
  }

  // Validar estructura del workflow
  issues.push(...validateWorkflowStructure(nodes, edges));

  return issues;
}

/**
 * Valida un nodo individual
 */
function validateNode(node: TypedNode, allNodes: TypedNode[], allEdges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Validar que tenga configuración
  if (!node.data?.config) {
    issues.push({
      nodeId: node.id,
      severity: 'error',
      message: 'El nodo no tiene configuración',
      type: 'missing-config',
    });
    return issues; // No continuar si no hay config
  }

  const config = node.data.config;

  // Validaciones específicas por tipo de acción
  switch (node.data.type) {
    case 'click':
    case 'type':
    case 'extract':
    case 'read-text':
      if (!config.selector || typeof config.selector !== 'string' || !config.selector.trim()) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'El selector es requerido',
          type: 'invalid-selector',
        });
      }
      break;

    case 'navigate':
      if (!config.url || typeof config.url !== 'string' || !config.url.trim()) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'La URL es requerida',
          type: 'invalid-selector',
        });
      }
      break;

    case 'excel-read':
      if (config.filePath && typeof config.filePath === 'string') {
        // Verificar que el archivo exista en el contexto (esto se verificaría con el store)
        // Por ahora solo validamos que tenga un filePath
        if (!config.filePath.trim()) {
          issues.push({
            nodeId: node.id,
            severity: 'error',
            message: 'La ruta del archivo Excel es requerida',
            type: 'missing-excel-file',
          });
        }
      }
      break;

    case 'loop':
      if (config.loopMode === 'excel' && !config.dataSource) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'La fuente de datos Excel es requerida para loops de tipo Excel',
          type: 'missing-excel-file',
        });
      }
      if (config.loopMode === 'count' && (!config.repeatCount || config.repeatCount <= 0)) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'El número de repeticiones debe ser mayor a 0',
          type: 'missing-config',
        });
      }
      break;

    case 'if-else':
      if (!config.condition || typeof config.condition !== 'string' || !config.condition.trim()) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'La condición es requerida',
          type: 'missing-config',
        });
      }
      break;
  }

  return issues;
}

/**
 * Valida la estructura del workflow
 */
function validateWorkflowStructure(nodes: TypedNode[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Validar que los edges apunten a nodos existentes
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      issues.push({
        nodeId: edge.source,
        severity: 'error',
        message: `El edge apunta a un nodo fuente inexistente: ${edge.source}`,
        type: 'orphan-node',
      });
    }
    if (!nodeIds.has(edge.target)) {
      issues.push({
        nodeId: edge.target,
        severity: 'error',
        message: `El edge apunta a un nodo destino inexistente: ${edge.target}`,
        type: 'orphan-node',
      });
    }
  }

  // Validar que haya al menos un nodo de inicio (sin edges entrantes)
  const targetNodeIds = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !targetNodeIds.has(n.id));
  
  if (nodes.length > 0 && startNodes.length === 0 && edges.length > 0) {
    issues.push({
      nodeId: nodes[0].id,
      severity: 'warning',
      message: 'El workflow no tiene un nodo de inicio claro',
      type: 'no-connections',
    });
  }

  // Validar nodos sin conexiones (solo warning, puede ser intencional)
  const sourceNodeIds = new Set(edges.map((e) => e.source));
  const connectedNodeIds = new Set([...sourceNodeIds, ...targetNodeIds]);
  const orphanNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));

  for (const node of orphanNodes) {
    if (nodes.length > 1) {
      issues.push({
        nodeId: node.id,
        severity: 'warning',
        message: 'Este nodo no está conectado a otros nodos',
        type: 'no-connections',
      });
    }
  }

  return issues;
}

/**
 * Obtiene las validaciones para un nodo específico
 */
export function getNodeValidation(nodeId: string, allIssues: ValidationIssue[]): ValidationIssue[] {
  return allIssues.filter((issue) => issue.nodeId === nodeId);
}

/**
 * Verifica si un nodo tiene errores
 */
export function hasErrors(nodeId: string, allIssues: ValidationIssue[]): boolean {
  return allIssues.some((issue) => issue.nodeId === nodeId && issue.severity === 'error');
}

/**
 * Verifica si un nodo tiene warnings
 */
export function hasWarnings(nodeId: string, allIssues: ValidationIssue[]): boolean {
  return allIssues.some((issue) => issue.nodeId === nodeId && issue.severity === 'warning');
}

