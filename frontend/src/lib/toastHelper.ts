// Toast Helper - Helper centralizado para mostrar toasts automáticamente
// Sigue principios DRY, KISS, SOLID - Single Responsibility

// Singleton para acceder al toast sin importar el hook en stores
let toastInstance: {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
} | null = null;

export function setToastInstance(instance: typeof toastInstance) {
  toastInstance = instance;
}

export function getToastInstance() {
  return toastInstance;
}

// Helper para ejecutar operaciones async con feedback automático
export async function withToast<T>(
  operation: () => Promise<T>,
  messages: {
    success: string;
    error?: string;
    loading?: string;
  },
  options?: {
    showLoading?: boolean;
    duration?: number;
  }
): Promise<T> {
  const toast = getToastInstance();
  
  try {
    if (options?.showLoading && messages.loading && toast) {
      toast.info(messages.loading, 1000);
    }
    
    const result = await operation();
    
    if (toast) {
      toast.success(messages.success, options?.duration);
    }
    
    return result;
  } catch (error) {
    const errorMessage = messages.error || 
      (error instanceof Error ? error.message : 'Error desconocido');
    
    if (toast) {
      toast.error(errorMessage, options?.duration || 4000);
    }
    
    throw error;
  }
}

// Mensajes predefinidos para operaciones comunes (DRY)
export const ToastMessages = {
  workflows: {
    create: {
      success: '✅ Workflow creado correctamente',
      error: '❌ Error al crear el workflow',
    },
    update: {
      success: '✅ Workflow actualizado correctamente',
      error: '❌ Error al actualizar el workflow',
    },
    delete: {
      success: '✅ Workflow eliminado correctamente',
      error: '❌ Error al eliminar el workflow',
    },
    save: {
      success: '✅ Workflow guardado correctamente',
      error: '❌ Error al guardar el workflow',
    },
    load: {
      success: '✅ Workflow cargado correctamente',
      error: '❌ Error al cargar el workflow',
    },
  },
  excel: {
    upload: {
      success: '✅ Archivo cargado correctamente',
      error: '❌ Error al cargar el archivo',
    },
    delete: {
      success: '✅ Archivo eliminado correctamente',
      error: '❌ Error al eliminar el archivo',
    },
    sync: {
      success: '✅ Archivo sincronizado con el agente',
      error: '❌ Error al sincronizar el archivo',
    },
    syncAll: {
      success: '✅ Todos los archivos sincronizados',
      error: '❌ Error al sincronizar archivos',
    },
  },
  properties: {
    update: {
      success: '✅ Cambios aplicados correctamente',
      error: '❌ Error al aplicar los cambios',
    },
  },
  auth: {
    login: {
      success: '✅ Sesión iniciada correctamente',
      error: '❌ Error al iniciar sesión',
    },
    register: {
      success: '✅ Cuenta creada correctamente',
      error: '❌ Error al crear la cuenta',
    },
    logout: {
      success: '✅ Sesión cerrada correctamente',
      error: '❌ Error al cerrar sesión',
    },
  },
} as const;

