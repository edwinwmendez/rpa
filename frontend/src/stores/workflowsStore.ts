// Workflows Store - Gestión de workflows con Zustand
import { create } from 'zustand';
import { workflowsService, type Workflow, type CreateWorkflowInput, type UpdateWorkflowInput } from '../lib/workflowsService';
import { withToast, ToastMessages } from '../lib/toastHelper';
import type { Node, Edge } from '@xyflow/react';

interface WorkflowsStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
  fetchWorkflows: (userId: string) => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (userId: string, input: CreateWorkflowInput) => Promise<string>;
  updateWorkflow: (id: string, input: UpdateWorkflowInput) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  saveWorkflow: (id: string | undefined, userId: string, nodes: Node[], edges: Edge[], name: string, description?: string) => Promise<string>;
  clearCurrentWorkflow: () => void;
  clearError: () => void;
}

export const useWorkflowsStore = create<WorkflowsStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,

  fetchWorkflows: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const workflows = await workflowsService.getUserWorkflows(userId);
      set({ workflows, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar workflows';
      set({ loading: false, error: message });
    }
  },

  fetchWorkflow: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const workflow = await workflowsService.getWorkflow(id);
      set({ currentWorkflow: workflow, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar workflow';
      set({ loading: false, error: message });
    }
  },

  createWorkflow: async (userId: string, input: CreateWorkflowInput) => {
    return withToast(
      async () => {
        set({ loading: true, error: null });
        try {
          const id = await workflowsService.createWorkflow(userId, input);
          await get().fetchWorkflows(userId);
          set({ loading: false });
          return id;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al crear workflow';
          set({ loading: false, error: message });
          throw error;
        }
      },
      ToastMessages.workflows.create
    );
  },

  updateWorkflow: async (id: string, input: UpdateWorkflowInput) => {
    return withToast(
      async () => {
        set({ loading: true, error: null });
        try {
          await workflowsService.updateWorkflow(id, input);
          const { currentWorkflow } = get();
          if (currentWorkflow?.id === id) {
            set({ 
              currentWorkflow: { ...currentWorkflow, ...input } as Workflow,
              loading: false 
            });
          }
          const userId = currentWorkflow?.userId || '';
          if (userId) {
            await get().fetchWorkflows(userId);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar workflow';
          set({ loading: false, error: message });
          throw error;
        }
      },
      ToastMessages.workflows.update
    );
  },

  deleteWorkflow: async (id: string) => {
    return withToast(
      async () => {
        set({ loading: true, error: null });
        try {
          await workflowsService.deleteWorkflow(id);
          const { workflows, currentWorkflow } = get();
          const userId = currentWorkflow?.userId || workflows.find(w => w.id === id)?.userId;
          
          set({ 
            workflows: workflows.filter(w => w.id !== id),
            currentWorkflow: currentWorkflow?.id === id ? null : currentWorkflow,
            loading: false 
          });
          
          // Recargar workflows para actualizar la lista
          if (userId) {
            await get().fetchWorkflows(userId);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar workflow';
          set({ loading: false, error: message });
          throw error;
        }
      },
      ToastMessages.workflows.delete
    );
  },

  saveWorkflow: async (id: string | undefined, userId: string, nodes: Node[], edges: Edge[], name: string, description?: string) => {
    // Importar dinámicamente para evitar dependencia circular
    const excelFilesStoreModule = await import('./excelFilesStore');
    
    // Obtener archivos Excel globales del store
    const excelFiles = excelFilesStoreModule.useExcelFilesStore.getState().files;
    const excelFilesData = excelFiles.map((file) => ({
      id: file.id,
      name: file.name,
      filePath: file.filePath,
      headers: file.headers,
      totalRows: file.totalRows,
      firstRowAsHeaders: file.firstRowAsHeaders,
      delimiter: file.delimiter,
    }));

    if (id) {
      // updateWorkflow ya maneja el toast automáticamente
      await get().updateWorkflow(id, { nodes, edges, name, description, excelFiles: excelFilesData });
      await get().fetchWorkflows(userId);
      return id;
    } else {
      // createWorkflow ya maneja el toast automáticamente
      const workflowId = await get().createWorkflow(userId, { nodes, edges, name, description, excelFiles: excelFilesData });
      await get().fetchWorkflows(userId);
      return workflowId;
    }
  },

  clearCurrentWorkflow: () => {
    set({ currentWorkflow: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

