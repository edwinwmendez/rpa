// Excel Files Panel - Panel para gestionar archivos Excel/CSV globales (versión compacta para sidebar)
import { useRef, useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useExcelFilesStore } from '../../stores/excelFilesStore';
import { createExcelFileFromUpload, validateExcelFile } from '../../lib/excelParser';
import { ExcelPreview } from './ExcelPreview';
import { useAgentStore } from '../../stores/agentStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { ExcelData } from '../../types/workflow';

export function ExcelFilesPanel() {
  const { files, addFile, removeFile, syncAllFilesWithAgent } = useExcelFilesStore();
  const { status } = useAgentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ExcelData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sincronizar archivos pendientes cuando el agente se conecte
  useEffect(() => {
    if (status.status === 'connected') {
      syncAllFilesWithAgent().catch((error) => {
        console.warn('Error sincronizando archivos con agente:', error);
      });
    }
  }, [status.status, syncAllFilesWithAgent]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      // Leer contenido del archivo
      const content = await file.text();
      
      // Crear objeto ExcelFile (sin sincronizar con agente aún)
      const excelFile = createExcelFileFromUpload(
        file,
        content,
        {
          firstRowAsHeaders: true,
        },
        undefined, // No hay ruta local aún
        false // No está sincronizado con agente
      );

      // Agregar al store inmediatamente (archivo cargado en memoria)
      addFile(excelFile);

      // Mostrar toast de éxito
      const { getToastInstance } = await import('../../lib/toastHelper');
      const toast = getToastInstance();
      if (toast) {
        toast.success(`✅ Archivo "${file.name}" cargado correctamente`, 2000);
      }

      // Intentar sincronizar con agente si está disponible (sin bloquear)
      try {
        const { useAgentStore } = await import('../../stores/agentStore');
        const agentStatus = useAgentStore.getState().status;
        
        if (agentStatus.status === 'connected') {
          // Sincronizar usando el método del store (que maneja toasts automáticamente)
          const { syncFileWithAgent } = useExcelFilesStore.getState();
          await syncFileWithAgent(excelFile.id);
        }
      } catch (agentError) {
        // No mostrar error si el agente no está disponible
        // El archivo se guardará cuando el agente esté conectado
        console.log('Agente no disponible, archivo se sincronizará cuando el agente esté conectado');
      }
    } catch (error) {
      console.error('Error cargando archivo:', error);
      const { getToastInstance } = await import('../../lib/toastHelper');
      const toast = getToastInstance();
      if (toast) {
        toast.error(`❌ Error al cargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 4000);
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePreview = async (file: typeof files[0]) => {
    // Si no tenemos filas en memoria, intentar leer del archivo local
    let previewRows = file.rows;
    
    if (!previewRows || previewRows.length === 0) {
      // Intentar leer el archivo desde el agente para preview
      try {
        // Por ahora, usar las filas que tenemos (primeras 10)
        // En el futuro, podríamos agregar un endpoint para leer solo las primeras N filas
        previewRows = file.rows || [];
      } catch (error) {
        console.warn('No se pudieron cargar filas para preview:', error);
      }
    }
    
    const excelData: ExcelData = {
      filePath: file.filePath,
      sheetName: file.sheetName || 'CSV',
      headers: file.headers,
      rows: previewRows,
      totalRows: file.totalRows,
      variableName: file.name.replace(/\.(csv|xlsx|xls)$/i, ''),
    };
    setPreviewFile(excelData);
    setIsPreviewOpen(true);
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo? Las acciones que lo usen dejarán de funcionar.')) {
      return;
    }

    // removeFile ahora maneja toasts automáticamente
    await removeFile(id);
  };

  return (
    <>
      <div className="p-4">
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? 'Cargando...' : 'Cargar Archivo'}
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-xs">No hay archivos cargados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    {file.syncedWithAgent ? (
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                    )}
                  </div>
                  {!file.syncedWithAgent && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Pendiente de sincronizar
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {file.totalRows} filas • {file.headers.length} cols
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePreview(file)}
                    title="Ver preview"
                    className="h-6 w-6"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(file.id)}
                    title="Eliminar"
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview de {previewFile?.filePath}</DialogTitle>
            <DialogDescription>
              Primeras 10 filas del archivo ({previewFile?.totalRows} filas totales)
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="mt-4">
              <ExcelPreview data={previewFile} maxRows={10} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
