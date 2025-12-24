// Excel Parser - Utilidades para parsear archivos Excel/CSV
import type { ExcelFile } from '../types/excel';

/**
 * Detecta el delimitador de un archivo CSV
 */
export function detectDelimiter(text: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = text.split('\n')[0] || '';
  
  let maxCount = 0;
  let detectedDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }
  
  return detectedDelimiter;
}

/**
 * Parsea un archivo CSV y retorna los datos estructurados
 */
export function parseCSV(
  text: string,
  options: {
    firstRowAsHeaders?: boolean;
    delimiter?: string;
  } = {}
): { headers: string[]; rows: Record<string, unknown>[] } {
  const delimiter = options.delimiter || detectDelimiter(text);
  const lines = text.split('\n').filter((line) => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const headers = options.firstRowAsHeaders
    ? firstLine.split(delimiter).map((h) => h.trim())
    : firstLine.split(delimiter).map((_, i) => `Columna${i + 1}`);

  const dataLines = options.firstRowAsHeaders ? lines.slice(1) : lines;
  
  const rows = dataLines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(delimiter);
      const row: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      return row;
    });

  return { headers, rows };
}

/**
 * Crea un objeto ExcelFile desde un archivo cargado
 * 
 * @param file - Archivo original del input
 * @param content - Contenido del archivo como texto
 * @param options - Opciones de parsing
 * @param localFilePath - Ruta local donde se guardó el archivo (opcional, si está sincronizado con agente)
 * @param syncedWithAgent - Si el archivo ya está guardado en el agente
 */
export function createExcelFileFromUpload(
  file: File,
  content: string,
  options: {
    firstRowAsHeaders?: boolean;
    delimiter?: string;
  } = {},
  localFilePath?: string,
  syncedWithAgent: boolean = false
): ExcelFile {
  const isCSV = file.name.endsWith('.csv');
  const { headers, rows } = isCSV
    ? parseCSV(content, { firstRowAsHeaders: options.firstRowAsHeaders ?? true, delimiter: options.delimiter })
    : { headers: [], rows: [] }; // Para Excel real, se procesaría en el backend

  return {
    id: `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    // Usar ruta local si está sincronizado, sino usar nombre temporal
    filePath: localFilePath || `temp/${file.name}`,
    // Guardar contenido completo en memoria para poder sincronizar después
    fileContent: content,
    headers,
    rows: rows.slice(0, 10), // Solo guardar primeras 10 filas para preview
    totalRows: rows.length,
    delimiter: isCSV ? (options.delimiter || detectDelimiter(content)) : undefined,
    firstRowAsHeaders: options.firstRowAsHeaders ?? true,
    loadedAt: new Date(),
    syncedWithAgent,
  };
}

/**
 * Valida que un archivo sea Excel o CSV válido
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: 'Formato no soportado. Use archivos .xlsx, .xls o .csv',
    };
  }

  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo 10MB',
    };
  }

  return { valid: true };
}

