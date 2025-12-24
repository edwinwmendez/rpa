// Agent Store - Estado del agente usando Zustand
import { create } from 'zustand';
import { agentClient } from '../lib/agentClient';
import type { AgentStatus } from '../lib/agentClient';

interface AgentStore {
  status: AgentStatus;
  isChecking: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  checkStatus: () => Promise<void>;
  startAutoCheck: () => void;
  stopAutoCheck: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  status: { status: 'disconnected' },
  isChecking: false,
  intervalId: null,

  checkStatus: async () => {
    set({ isChecking: true });
    const status = await agentClient.checkStatus();
    set({ status, isChecking: false });
  },

  startAutoCheck: () => {
    // Detener cualquier verificación previa
    get().stopAutoCheck();

    // Verificar inmediatamente
    get().checkStatus();

    // Verificar estado cada 30 segundos
    const interval = setInterval(() => {
      get().checkStatus();
    }, 30000);

    set({ intervalId: interval });
  },

  stopAutoCheck: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  }
}));
