// Workflow Types - Tipos para workflows y acciones
import type { Node } from '@xyflow/react';

// Tipos de acciones disponibles
export type ActionType =
  | 'click'
  | 'type'
  | 'wait'
  | 'navigate'
  | 'extract'
  | 'send-email'
  | 'excel-read'
  | 'excel-write'
  | 'loop'
  | 'if-else'
  | 'read-text';

// Configuración base de acción
export interface BaseActionConfig {
  type: ActionType;
  label: string;
}

// Configuración específica por tipo de acción
export interface ClickActionConfig extends BaseActionConfig {
  type: 'click';
  selector: string;
  clickType?: 'left' | 'right' | 'double';
  waitAfter?: number; // segundos
  continueOnError?: boolean;
}

export interface TypeActionConfig extends BaseActionConfig {
  type: 'type';
  selector: string;
  text: string; // Puede contener {{variables}}
  clearBefore?: boolean;
  humanLike?: boolean;
  speed?: 'fast' | 'normal' | 'slow';
}

export interface WaitActionConfig extends BaseActionConfig {
  type: 'wait';
  waitType: 'time' | 'element-appear' | 'element-disappear';
  duration?: number; // segundos (si waitType === 'time')
  selector?: string; // (si waitType === 'element-*')
  timeout?: number; // segundos máximo a esperar
}

export interface NavigateActionConfig extends BaseActionConfig {
  type: 'navigate';
  url: string; // Puede contener {{variables}}
  browser?: 'chrome' | 'edge' | 'firefox';
  waitForLoad?: boolean;
}

export interface ExtractActionConfig extends BaseActionConfig {
  type: 'extract';
  selector: string;
  variableName: string;
  trimSpaces?: boolean;
}

export interface ExcelReadActionConfig extends BaseActionConfig {
  type: 'excel-read';
  filePath: string;
  sheetName?: string;
  range?: string; // "A1:Z1000"
  firstRowAsHeaders?: boolean;
  variableName: string; // Donde guardar los datos
  loadedData?: ExcelData; // Datos cargados en el frontend (opcional)
}

export interface LoopActionConfig extends BaseActionConfig {
  type: 'loop';
  loopMode: 'excel' | 'count' | 'until' | 'while'; // Modo de repetición
  // Modo 'excel': iterar sobre archivo Excel/CSV
  dataSource?: string; // Nombre del archivo Excel global (sin extensión)
  iterationVariable?: string; // Nombre de variable para cada item (ej: "fila")
  // Modo 'count': repetir N veces
  repeatCount?: number; // Número de veces a repetir
  // Modo 'until' y 'while': repetir hasta/mientras condición
  condition?: string; // Condición a evaluar (ej: "{{variable}} == 'valor'")
  // Opciones comunes
  maxIterations?: number; // Límite máximo de seguridad (para evitar loops infinitos)
  breakOnError?: boolean; // Detener si hay error
}

export interface IfElseActionConfig extends BaseActionConfig {
  type: 'if-else';
  condition: string; // Ej: "{{variable}} == 'valor'"
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'exists';
  value?: string;
}

export interface ReadTextActionConfig extends BaseActionConfig {
  type: 'read-text';
  selector: string;
  variableName: string;
  trimSpaces?: boolean;
}

// Union type para todas las configuraciones
export type ActionConfig =
  | ClickActionConfig
  | TypeActionConfig
  | WaitActionConfig
  | NavigateActionConfig
  | ExtractActionConfig
  | ExcelReadActionConfig
  | LoopActionConfig
  | IfElseActionConfig
  | ReadTextActionConfig;

// Variable disponible en el workflow
export interface WorkflowVariable {
  name: string; // Ej: "fila.dni", "contratos", "texto_leido"
  type: 'excel' | 'read' | 'loop' | 'custom';
  description?: string;
  value?: unknown;
  source?: string; // De dónde viene (ej: "Excel Read: contratos")
}

// Datos de Excel cargado
export interface ExcelData {
  filePath: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  variableName: string;
}

// Nodo de acción con configuración completa
// Index signature requerida por @xyflow/react v12
export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  type: ActionType;
  config: ActionConfig;
}

// Tipo para nodo de ReactFlow con datos de acción
export type ActionNode = Node<ActionNodeData>;

