// Excel Types - Tipos para archivos Excel/CSV globales del workflow
export interface ExcelFile {
  id: string; // ID único del archivo
  name: string; // Nombre del archivo (ej: "bd_contratos.csv")
  filePath: string; // Ruta local completa donde se guardó el archivo (ej: "C:/ruta/excel_csv/bd_contratos.csv") o nombre temporal si no está sincronizado
  fileContent: string; // Contenido completo del archivo (guardado en memoria del frontend)
  sheetName?: string; // Nombre de la hoja (solo para Excel)
  headers: string[]; // Nombres de las columnas
  rows: Record<string, unknown>[]; // Datos de las filas (solo primeras 10 para preview, no se guarda en Firebase)
  totalRows: number; // Total de filas
  delimiter?: string; // Delimitador para CSV (por defecto: ',')
  firstRowAsHeaders: boolean; // Si la primera fila son encabezados
  loadedAt: Date; // Fecha de carga
  syncedWithAgent: boolean; // Si el archivo está guardado en el agente local
}

export interface ExcelFilePreview {
  id: string;
  name: string;
  totalRows: number;
  headers: string[];
  previewRows: Record<string, unknown>[]; // Primeras 5 filas para preview
}

