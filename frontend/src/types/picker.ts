// Tipos para el Element Picker - Selector visual de elementos

/**
 * Estados posibles del Element Picker
 */
export type PickerStatus = 'idle' | 'waiting' | 'captured' | 'error';

/**
 * Rectángulo de posición de un elemento
 */
export interface ElementRectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Propiedades de un elemento capturado
 * 
 * Incluye todos los campos necesarios para Windows 7 y apps antiguas:
 * - auto_id, name, class_name, control_type (identificación)
 * - found_index (crucial para apps sin AutomationId)
 * - process_name, window_title (conexión con pywinauto)
 * - coordinates (fallback para apps problemáticas)
 */
export interface ElementProperties {
  /** AutomationId del elemento (el más confiable, pero apps antiguas no lo tienen) */
  auto_id?: string;
  /** Nombre/texto del elemento */
  name?: string;
  /** Nombre de clase del control Win32 (importante para apps antiguas) */
  class_name?: string;
  /** Tipo de control UIA (Button, Edit, MenuItem, etc.) */
  control_type?: string;
  /** 
   * Índice del elemento entre hermanos del mismo tipo (0-based).
   * CRÍTICO para apps antiguas Win7 que no tienen AutomationId.
   * Permite distinguir entre múltiples controles iguales.
   */
  found_index?: number;
  /** Nombre del proceso ejecutable (.exe) */
  process_name?: string;
  /** Título de la ventana padre */
  window_title?: string;
  /** Coordenadas [x, y] como fallback para apps problemáticas */
  coordinates?: [number, number];
  /** Rectángulo de posición */
  rectangle?: ElementRectangle;
  /** Si el elemento está habilitado */
  is_enabled?: boolean;
  /** Si el elemento es visible */
  is_visible?: boolean;
}

/**
 * Respuesta del estado del picker
 */
export interface PickerStatusResponse {
  status: PickerStatus;
  error?: string;
}

/**
 * Resultado de la captura de un elemento
 */
export interface PickerResult {
  status: 'success' | 'error';
  /** Selector generado (ej: "auto_id:btnGuardar") */
  selector?: string;
  /** Propiedades del elemento */
  properties?: ElementProperties;
  /** Screenshot del elemento en Base64 */
  screenshot?: string;
  /** Mensaje de error si status es 'error' */
  error?: string;
}

/**
 * Respuesta al iniciar el picker
 */
export interface PickerStartResponse {
  status: 'started' | 'error';
  mode?: 'desktop' | 'web';
  error?: string;
}

/**
 * Respuesta al detener el picker
 */
export interface PickerStopResponse {
  status: 'stopped' | 'error';
  error?: string;
}

