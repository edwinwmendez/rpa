// Agent Client - Comunicación con agente local
import axios from 'axios';

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
      return response.data as WorkflowExecutionResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al ejecutar workflow';
      return {
        status: 'error',
        error: message
      };
    }
  }

  // Iniciar selector de elementos
  async startElementPicker(mode: 'desktop' | 'web' = 'desktop'): Promise<void> {
    await this.client.post('/picker/start', { mode });
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
