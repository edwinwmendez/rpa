// Excel Read Action Form - Formulario para acción "Leer Excel"
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { ExcelPreview } from '../ExcelPreview';
import type { ExcelReadActionConfig, ExcelData } from '../../../types/workflow';

interface ExcelReadActionFormProps {
  config: ExcelReadActionConfig;
  onChange: (config: Partial<ExcelReadActionConfig>) => void;
  onExcelLoaded?: (data: ExcelData) => void;
}

export function ExcelReadActionForm({
  config,
  onChange,
  onExcelLoaded,
}: ExcelReadActionFormProps) {
  const [filePath, setFilePath] = useState(config.filePath || '');
  const [sheetName, setSheetName] = useState(config.sheetName || '');
  const [range, setRange] = useState(config.range || '');
  const [firstRowAsHeaders, setFirstRowAsHeaders] = useState(config.firstRowAsHeaders ?? true);
  const [variableName, setVariableName] = useState(config.variableName || 'excel_data');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea Excel o CSV
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }

    setIsLoading(true);
    setFilePath(file.name);

    try {
      // Leer el archivo usando FileReader para CSV o enviar a backend para Excel
      if (fileExtension === '.csv') {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = firstRowAsHeaders 
          ? lines[0].split(',').map(h => h.trim())
          : lines[0].split(',').map((_, i) => `Columna${i + 1}`);
        
        const rows = (firstRowAsHeaders ? lines.slice(1) : lines)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            const row: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            return row;
          });

        const data: ExcelData = {
          filePath: file.name,
          sheetName: 'CSV',
          headers,
          rows,
          totalRows: rows.length,
          variableName,
        };

        setExcelData(data);
        onChange({ filePath: file.name, loadedData: data } as Partial<ExcelReadActionConfig>);
        onExcelLoaded?.(data);
      } else {
        // Para Excel, necesitaríamos enviar al backend o usar una librería
        // Por ahora, solo guardamos el nombre del archivo
        // TODO: Implementar lectura real de Excel en el frontend o backend
        alert('La lectura completa de Excel se realizará en el agente. El archivo se procesará al ejecutar el workflow.');
        onChange({ filePath: file.name });
      }
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      alert('Error al leer el archivo. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetNameChange = (newSheet: string) => {
    setSheetName(newSheet);
    onChange({ sheetName: newSheet });
  };

  const handleRangeChange = (value: string) => {
    setRange(value);
    onChange({ range: value });
  };

  const handleFirstRowAsHeadersChange = (checked: boolean) => {
    setFirstRowAsHeaders(checked);
    onChange({ firstRowAsHeaders: checked });
  };

  const handleVariableNameChange = (value: string) => {
    const validName = value.replace(/[^a-zA-Z0-9_]/g, '');
    setVariableName(validName);
    onChange({ variableName: validName });
  };

  const handleRemoveFile = () => {
    setFilePath('');
    setExcelData(null);
    onChange({ filePath: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Selección de archivo */}
      <div className="space-y-2">
        <Label htmlFor="excel-file">Archivo Excel/CSV *</Label>
        {!filePath ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              id="excel-file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Cargando...' : 'Seleccionar archivo'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Formatos soportados: .xlsx, .xls, .csv
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{filePath}</p>
              {excelData && (
                <p className="text-xs text-gray-500">
                  {excelData.totalRows} filas, {excelData.headers.length} columnas
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Hoja (solo para Excel) */}
      {filePath && !filePath.endsWith('.csv') && (
        <div className="space-y-2">
          <Label htmlFor="excel-sheet">Hoja</Label>
          <Input
            id="excel-sheet"
            value={sheetName}
            onChange={(e) => handleSheetNameChange(e.target.value)}
            placeholder="Hoja1"
          />
          <p className="text-xs text-gray-500">
            Deja vacío para usar la primera hoja
          </p>
        </div>
      )}

      {/* Rango (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="excel-range">Rango (opcional)</Label>
        <Input
          id="excel-range"
          value={range}
          onChange={(e) => handleRangeChange(e.target.value)}
          placeholder="A1:Z1000"
        />
        <p className="text-xs text-gray-500">
          Ejemplo: A1:Z1000 (deja vacío para leer todo)
        </p>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        <Label>Opciones</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="first-row-headers"
            checked={firstRowAsHeaders}
            onCheckedChange={handleFirstRowAsHeadersChange}
          />
          <Label htmlFor="first-row-headers" className="font-normal cursor-pointer">
            Primera fila como encabezados
          </Label>
        </div>
      </div>

      {/* Variable donde guardar */}
      <div className="space-y-2">
        <Label htmlFor="excel-variable">Guardar en variable *</Label>
        <Input
          id="excel-variable"
          value={variableName}
          onChange={(e) => handleVariableNameChange(e.target.value)}
          placeholder="excel_data"
        />
        <p className="text-xs text-gray-500">
          Usa esta variable en un Loop para iterar sobre las filas
        </p>
        {!variableName && (
          <p className="text-xs text-amber-600">
            ⚠️ Debes ingresar un nombre de variable
          </p>
        )}
      </div>

      {/* Preview de datos */}
      {excelData && (
        <div className="space-y-2">
          <Label>Preview (primeras 5 filas)</Label>
          <ExcelPreview data={excelData} maxRows={5} />
        </div>
      )}
    </div>
  );
}

