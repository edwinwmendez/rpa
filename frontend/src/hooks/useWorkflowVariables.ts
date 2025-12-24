// Hook para gestionar variables disponibles en el workflow
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ActionNodeData, WorkflowVariable, ExcelData } from '../types/workflow';
import { useExcelFilesStore } from '../stores/excelFilesStore';

export function useWorkflowVariables(
  nodes: Node<ActionNodeData>[],
  edges: Edge[]
): {
  availableVariables: WorkflowVariable[];
  excelData: ExcelData | null;
} {
  const excelFiles = useExcelFilesStore((state) => state.files);
  
  const { availableVariables, excelData } = useMemo(() => {
    const variables: WorkflowVariable[] = [];
    let excel: ExcelData | null = null;

    // Agregar variables de archivos Excel globales
    // Para cada archivo, crear variables por columna para acceso directo
    excelFiles.forEach((file) => {
      const variableName = file.name.replace(/\.(csv|xlsx|xls)$/i, '');
      
      // Variable del archivo completo (para loops)
      variables.push({
        name: variableName,
        type: 'excel',
        description: `Archivo completo: ${file.name} (${file.totalRows} filas)`,
        source: `Archivo global: ${file.name}`,
      });
      
      // Variables por columna del archivo (para acceso directo sin loop)
      // Ejemplo: bd_contratos.dni, bd_contratos.nombre, etc.
      file.headers.forEach(header => {
        variables.push({
          name: `${variableName}.${header}`,
          type: 'excel',
          description: `Columna "${header}" del archivo ${file.name}`,
          source: `Archivo: ${file.name} → Columna: ${header}`,
        });
      });
    });

    // Recorrer nodos en orden de ejecución (topological sort básico)
    const processedNodes = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Función para obtener nodos anteriores (predecesores)
    const getPredecessors = (nodeId: string): Node<ActionNodeData>[] => {
      const incomingEdges = edges.filter(e => e.target === nodeId);
      return incomingEdges
        .map(e => nodeMap.get(e.source))
        .filter((n): n is Node<ActionNodeData> => n !== undefined);
    };

    // Procesar nodos en orden
    const processNode = (node: Node<ActionNodeData>) => {
      if (processedNodes.has(node.id)) return;
      
      const predecessors = getPredecessors(node.id);
      predecessors.forEach(p => processNode(p));

      const config = node.data.config;

      // Si es Excel Read, agregar variable y datos
      if (config.type === 'excel-read') {
        const variableName = config.variableName || 'excel_data';
        variables.push({
          name: variableName,
          type: 'excel',
          description: `Datos de Excel: ${config.filePath}`,
          source: `Excel Read: ${variableName}`,
        });

        // Si hay datos cargados, guardarlos
        if ((config as any).loadedData) {
          excel = (config as any).loadedData as ExcelData;
        }
      }

      // Si es Loop, agregar variables de iteración según el modo
      if (config.type === 'loop') {
        const loopConfig = config as any;
        const loopMode = loopConfig.loopMode || 'excel';
        const iterationVar = loopConfig.iterationVariable || 'item';

        if (loopMode === 'excel') {
          const dataSource = loopConfig.dataSource;

          // Buscar archivo Excel global que coincida con el dataSource
          const matchingExcelFile = excelFiles.find(
            (file) => file.name.replace(/\.(csv|xlsx|xls)$/i, '') === dataSource
          );

          if (matchingExcelFile) {
            // Crear variables por columna del archivo Excel global
            matchingExcelFile.headers.forEach(header => {
              variables.push({
                name: `${iterationVar}.${header}`,
                type: 'loop',
                description: `${header} de la fila actual`,
                source: `Loop: ${iterationVar} (${matchingExcelFile.name})`,
              });
            });
          } else if (excel && dataSource === excel.variableName) {
            // Fallback: si hay Excel de acción anterior (legacy)
            excel.headers.forEach(header => {
              variables.push({
                name: `${iterationVar}.${header}`,
                type: 'loop',
                description: `${header} de la fila actual`,
                source: `Loop: ${iterationVar}`,
              });
            });
          }
        } else {
          // Para modos 'count', 'until', 'while': solo variable de iteración numérica
          variables.push({
            name: iterationVar,
            type: 'loop',
            description: `Número de iteración actual (${loopMode === 'count' ? '1, 2, 3...' : 'contador'})`,
            source: `Loop: ${iterationVar} (modo: ${loopMode})`,
          });
        }
      }

      // Si es Read Text o Extract, agregar variable de salida
      if (config.type === 'read-text' || config.type === 'extract') {
        const varName = config.variableName;
        if (varName) {
          variables.push({
            name: varName,
            type: 'read',
            description: `Texto extraído de: ${config.selector}`,
            source: `${config.type === 'read-text' ? 'Read Text' : 'Extract'}: ${varName}`,
          });
        }
      }

      processedNodes.add(node.id);
    };

    // Procesar todos los nodos
    nodes.forEach(node => processNode(node));

    return { availableVariables: variables, excelData: excel };
  }, [nodes, edges, excelFiles]);

  return { availableVariables, excelData };
}

