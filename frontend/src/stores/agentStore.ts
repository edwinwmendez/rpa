// Agent Store - Estado del agente usando Zustand
import { create } from 'zustand';
import { agentClient, AgentStatus } from '../lib/agentClient';

interface AgentStore {
  status: AgentStatus;
  isChecking: boolean;
  checkStatus: () => Promise<void>;
  startAutoCheck: () => void;
  stopAutoCheck: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  status: { status: 'disconnected' },
  isChecking: false,

  checkStatus: async () => {
    set({ isChecking: true });
    const status = await agentClient.checkStatus();
    set({ status, isChecking: false });
  },

  startAutoCheck: () => {
    // Verificar estado cada 30 segundos
    const interval = setInterval(async () => {
      await get().checkStatus();
    }, 30000);

    // Verificar inmediatamente
    get().checkStatus();

    // Guardar interval ID para poder detenerlo
    (window as any).__agentCheckInterval = interval;
  },

  stopAutoCheck: () => {
    if ((window as any).__agentCheckInterval) {
      clearInterval((window as any).__agentCheckInterval);
    }
  }
}));
