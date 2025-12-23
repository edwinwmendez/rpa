// Agent Client - Comunicación con agente local
import axios from 'axios';

export interface AgentStatus {
  status: 'connected' | 'disconnected';
  version?: string;
  os?: string;
  python?: string;
  lastSeen?: string;
}

export interface WorkflowExecutionResult {
  status: 'running' | 'completed' | 'error';
  progress?: number;
  currentStep?: number;
  totalSteps?: number;
  logs?: string[];
  error?: string;
}

class AgentClient {
  private baseURL = 'http://localhost:5000';
  private client = axios.create({
    baseURL: this.baseURL,
    timeout: 30000,
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
}

export const agentClient = new AgentClient();
