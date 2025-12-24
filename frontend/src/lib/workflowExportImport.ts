// Workflow Export/Import - Funciones para exportar e importar workflows
import type { Node, Edge } from '@xyflow/react';
import type { Workflow } from './workflowsService';

/**
 * Interfaz para el formato de exportación de workflow
 * Incluye metadata y datos del workflow
 */
export interface ExportedWorkflow {
  version: string; // Versión del formato de exportación
  exportedAt: string; // ISO timestamp
  workflow: {
    name: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
    excelFiles?: Array<{
      id: string;
      name: string;
      filePath: string;
      headers: string[];
      totalRows: number;
      firstRowAsHeaders: boolean;
      delimiter?: string;
    }>;
  };
}

const CURRENT_EXPORT_VERSION = '1.0.0';

/**
 * Valida que un objeto sea un workflow exportado válido
 */
export function validateExportedWorkflow(data: unknown): {
  valid: boolean;
  error?: string;
  workflow?: ExportedWorkflow;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'El archivo no contiene un objeto JSON válido' };
  }

  const obj = data as Record<string, unknown>;

  // Validar estructura básica
  if (!obj.workflow || typeof obj.workflow !== 'object') {
    return { valid: false, error: 'El archivo no contiene la estructura de workflow válida' };
  }

  const workflow = obj.workflow as Record<string, unknown>;

  // Validar campos requeridos
  if (!workflow.name || typeof workflow.name !== 'string') {
    return { valid: false, error: 'El workflow debe tener un nombre válido' };
  }

  if (!Array.isArray(workflow.nodes)) {
    return { valid: false, error: 'El workflow debe tener un array de nodos válido' };
  }

  if (!Array.isArray(workflow.edges)) {
    return { valid: false, error: 'El workflow debe tener un array de edges válido' };
  }

  // Validar estructura básica de nodos
  for (const node of workflow.nodes) {
    if (!node || typeof node !== 'object') {
      return { valid: false, error: 'Uno o más nodos tienen formato inválido' };
    }
    const nodeObj = node as Record<string, unknown>;
    if (!nodeObj.id || typeof nodeObj.id !== 'string') {
      return { valid: false, error: 'Uno o más nodos no tienen un ID válido' };
    }
    if (!nodeObj.data || typeof nodeObj.data !== 'object') {
      return { valid: false, error: 'Uno o más nodos no tienen datos válidos' };
    }
  }

  // Validar estructura básica de edges
  for (const edge of workflow.edges) {
    if (!edge || typeof edge !== 'object') {
      return { valid: false, error: 'Uno o más edges tienen formato inválido' };
    }
    const edgeObj = edge as Record<string, unknown>;
    if (!edgeObj.id || typeof edgeObj.id !== 'string') {
      return { valid: false, error: 'Uno o más edges no tienen un ID válido' };
    }
    if (!edgeObj.source || typeof edgeObj.source !== 'string') {
      return { valid: false, error: 'Uno o más edges no tienen un source válido' };
    }
    if (!edgeObj.target || typeof edgeObj.target !== 'string') {
      return { valid: false, error: 'Uno o más edges no tienen un target válido' };
    }
  }

  return { valid: true, workflow: obj as unknown as ExportedWorkflow };
}

/**
 * Exporta un workflow a formato JSON
 */
export function exportWorkflow(
  name: string,
  description: string | undefined,
  nodes: Node[],
  edges: Edge[],
  excelFiles?: Workflow['excelFiles']
): string {
  const exported: ExportedWorkflow = {
    version: CURRENT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    workflow: {
      name,
      description,
      nodes,
      edges,
      excelFiles,
    },
  };

  return JSON.stringify(exported, null, 2);
}

/**
 * Descarga un workflow como archivo JSON
 */
export function downloadWorkflowAsFile(
  name: string,
  description: string | undefined,
  nodes: Node[],
  edges: Edge[],
  excelFiles?: Workflow['excelFiles']
): void {
  const jsonContent = exportWorkflow(name, description, nodes, edges, excelFiles);
  
  // Crear nombre de archivo seguro (remover caracteres especiales)
  const safeName = name
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50) || 'workflow';
  
  const filename = `${safeName}_${new Date().toISOString().split('T')[0]}.json`;
  
  // Crear blob y descargar
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON y lo parsea
 */
export async function readWorkflowFile(file: File): Promise<ExportedWorkflow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          reject(new Error('El archivo está vacío'));
          return;
        }

        const parsed = JSON.parse(text);
        const validation = validateExportedWorkflow(parsed);
        
        if (!validation.valid || !validation.workflow) {
          reject(new Error(validation.error || 'Formato de workflow inválido'));
          return;
        }

        resolve(validation.workflow);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al leer el archivo';
        reject(new Error(`Error al parsear JSON: ${message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsText(file);
  });
}

/**
 * Importa un workflow desde un archivo
 * Retorna los datos del workflow para ser cargados en el editor
 */
export async function importWorkflowFromFile(
  file: File
): Promise<{
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  excelFiles?: Workflow['excelFiles'];
}> {
  const exported = await readWorkflowFile(file);
  
  return {
    name: exported.workflow.name,
    description: exported.workflow.description,
    nodes: exported.workflow.nodes,
    edges: exported.workflow.edges,
    excelFiles: exported.workflow.excelFiles,
  };
}

