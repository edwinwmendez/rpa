// Excel Files Store - Gestión de archivos Excel/CSV globales del workflow
import { create } from 'zustand';
import { withToast, ToastMessages } from '../lib/toastHelper';
import type { ExcelFile } from '../types/excel';

interface ExcelFilesStore {
  files: ExcelFile[];
  addFile: (file: ExcelFile) => void;
  removeFile: (id: string) => Promise<void>;
  updateFile: (id: string, updates: Partial<ExcelFile>) => void;
  getFile: (id: string) => ExcelFile | undefined;
  getFileByName: (name: string) => ExcelFile | undefined;
  clearFiles: () => void;
  syncFileWithAgent: (id: string) => Promise<boolean>; // Sincronizar archivo con agente
  syncAllFilesWithAgent: () => Promise<void>; // Sincronizar todos los archivos pendientes
}

export const useExcelFilesStore = create<ExcelFilesStore>((set, get) => ({
  files: [],

  addFile: (file: ExcelFile) => {
    set((state) => ({
      files: [...state.files, file],
    }));
  },

  removeFile: async (id: string) => {
    const file = get().files.find((f) => f.id === id);
    
    await withToast(
      async () => {
        // Si el archivo está sincronizado con el agente, intentar eliminarlo también
        if (file?.syncedWithAgent && file.filePath) {
          try {
            const { agentClient } = await import('../lib/agentClient');
            await agentClient.deleteFile(file.filePath);
          } catch (error) {
            console.warn('Error eliminando archivo del agente:', error);
            // Continuar con la eliminación local aunque falle en el agente
          }
        }
        
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }));
      },
      {
        success: ToastMessages.excel.delete.success,
        error: ToastMessages.excel.delete.error,
      }
    );
  },

  updateFile: (id: string, updates: Partial<ExcelFile>) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  },

  getFile: (id: string) => {
    return get().files.find((f) => f.id === id);
  },

  getFileByName: (name: string) => {
    return get().files.find((f) => f.name === name);
  },

  clearFiles: () => {
    set({ files: [] });
  },

  syncFileWithAgent: async (id: string) => {
    const file = get().files.find((f) => f.id === id);
    if (!file || file.syncedWithAgent) {
      return true; // Ya está sincronizado
    }

    try {
      await withToast(
        async () => {
          const { agentClient } = await import('../lib/agentClient');
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'csv';
          const fileType = fileExtension === 'csv' ? 'csv' : (fileExtension === 'xlsx' ? 'xlsx' : 'xls');
          
          const saveResult = await agentClient.saveFile(file.name, file.fileContent, fileType);
          
          if (saveResult.success && saveResult.filePath) {
            get().updateFile(id, {
              filePath: saveResult.filePath,
              syncedWithAgent: true,
            });
            return true;
          }
          throw new Error('Error al guardar archivo en el agente');
        },
        {
          success: `${ToastMessages.excel.sync.success}: ${file.name}`,
          error: `${ToastMessages.excel.sync.error}: ${file.name}`,
        }
      );
      return true;
    } catch (error) {
      console.warn('Error sincronizando archivo con agente:', error);
      return false;
    }
  },

  syncAllFilesWithAgent: async () => {
    const files = get().files.filter((f) => !f.syncedWithAgent);
    if (files.length === 0) return;
    
    await withToast(
      async () => {
        for (const file of files) {
          await get().syncFileWithAgent(file.id);
        }
      },
      ToastMessages.excel.syncAll
    );
  },
}));

