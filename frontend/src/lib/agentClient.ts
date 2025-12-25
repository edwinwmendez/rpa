// Agent Client - Comunicación con agente local
import axios from 'axios';
import type {
  PickerStatusResponse,
  PickerResult,
  PickerStartResponse,
  PickerStopResponse,
} from '../types/picker';

export type AgentStatus = {
  status: 'connected' | 'disconnected';
  version?: string;
  os?: string;
  python?: string;
  lastSeen?: string;
};

export type WorkflowExecutionResult = {
  status: 'running' | 'completed' | 'error';
  progress?: number;
  currentStep?: number;
  totalSteps?: number;
  logs?: string[];
  error?: string;
};

class AgentClient {
  private baseURL = import.meta.env.VITE_AGENT_URL || 'http://localhost:5000';
  private client = axios.create({
    baseURL: this.baseURL,
    timeout: Number(import.meta.env.VITE_AGENT_TIMEOUT) || 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Verificar si agente está conectado
  async checkStatus(): Promise<AgentStatus> {
    try {
      const response = await this.client.get('/health');
      return {
        status: 'connected',
        ...response.data
      };
    } catch (error) {
      return {
        status: 'disconnected'
      };
    }
  }

  // Ejecutar workflow
  async executeWorkflow(workflow: Record<string, unknown>): Promise<WorkflowExecutionResult> {
    try {
      const response = await this.client.post('/execute', workflow);
      const data = response.data;
      
      // Transformar formato del agente al formato esperado por el frontend
      const result: WorkflowExecutionResult = {
        status: data.status === 'success' ? 'completed' : 'error',
        logs: data.logs || [],
        error: data.error,
      };
      
      // Agregar información adicional si está disponible
      if (data.executed_nodes !== undefined) {
        result.totalSteps = data.executed_nodes;
        result.currentStep = data.executed_nodes;
      }
      
      if (data.duration_seconds !== undefined) {
        // Calcular progress basado en nodos ejecutados
        // Por ahora, si está completado, progress es 100%
        result.progress = result.status === 'completed' ? 100 : 0;
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al ejecutar workflow';
      return {
        status: 'error',
        error: message
      };
    }
  }

  // ==================== ELEMENT PICKER ====================

  /**
   * Inicia el selector de elementos.
   * El usuario podrá mover el mouse sobre la aplicación y ver
   * elementos resaltados en rojo. CTRL+Click captura el elemento.
   */
  async startElementPicker(mode: 'desktop' | 'web' = 'desktop'): Promise<PickerStartResponse> {
    try {
      const response = await this.client.post('/picker/start', { mode });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar picker';
      return { status: 'error', error: message };
    }
  }

  /**
   * Obtiene el estado actual del picker.
   * Usar para polling mientras el usuario selecciona elemento.
   */
  async getPickerStatus(): Promise<PickerStatusResponse> {
    try {
      const response = await this.client.get('/picker/status');
      return response.data;
    } catch (error) {
      return { status: 'error', error: 'Error obteniendo estado del picker' };
    }
  }

  /**
   * Obtiene el resultado de la captura (elemento seleccionado).
   * Solo llamar cuando getPickerStatus retorna status='captured'.
   */
  async getPickerResult(): Promise<PickerResult> {
    try {
      const response = await this.client.get('/picker/result');
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error obteniendo resultado';
      return { status: 'error', error: message };
    }
  }

  /**
   * Detiene el picker y limpia recursos.
   * Llamar siempre al cerrar el modal o cancelar.
   */
  async stopPicker(): Promise<PickerStopResponse> {
    try {
      const response = await this.client.post('/picker/stop');
      return response.data;
    } catch (error) {
      return { status: 'error', error: 'Error deteniendo picker' };
    }
  }

  // Obtener logs en tiempo real
  async getLogs(limit: number = 100): Promise<string[]> {
    try {
      const response = await this.client.get('/logs', { params: { limit } });
      return response.data.logs || [];
    } catch (error) {
      return [];
    }
  }

  // Ejecutar diagnóstico del sistema
  async runDiagnostic(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get('/diagnostic');
      return response.data as Record<string, unknown>;
    } catch (error) {
      throw new Error('No se pudo conectar con el agente');
    }
  }

  // Guardar archivo localmente en el agente
  async saveFile(
    filename: string,
    content: string,
    fileType: 'csv' | 'xlsx' | 'xls' = 'csv'
  ): Promise<{ success: boolean; filePath?: string; relativePath?: string; error?: string }> {
    try {
      const response = await this.client.post('/files/save', {
        filename,
        content,
        fileType,
      });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar archivo';
      return {
        success: false,
        error: message,
      };
    }
  }

  // Eliminar archivo localmente en el agente
  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.post('/files/delete', {
        filePath,
      });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar archivo';
      return {
        success: false,
        error: message,
      };
    }
  }
}

export const agentClient = new AgentClient();
