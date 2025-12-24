// Loop Action Form - Formulario para acción "Loop" con múltiples modos
import { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ExcelPreview } from '../ExcelPreview';
import type { LoopActionConfig, WorkflowVariable, ExcelData } from '../../../types/workflow';
import { useExcelFilesStore } from '../../../stores/excelFilesStore';

interface LoopActionFormProps {
  config: LoopActionConfig;
  onChange: (config: Partial<LoopActionConfig>) => void;
  availableVariables: WorkflowVariable[];
  excelData: ExcelData | null;
}

export function LoopActionForm({
  config,
  onChange,
  availableVariables,
  excelData: excelDataFromProps,
}: LoopActionFormProps) {
  const loopMode = config.loopMode || 'excel';
  const [dataSource, setDataSource] = useState(config.dataSource || '');
  const [iterationVariable, setIterationVariable] = useState(config.iterationVariable || 'fila');
  const [repeatCount, setRepeatCount] = useState(config.repeatCount?.toString() || '');
  const [condition, setCondition] = useState(config.condition || '');
  const [maxIterations, setMaxIterations] = useState(config.maxIterations?.toString() || '');
  const [breakOnError, setBreakOnError] = useState(config.breakOnError ?? true);
  
  const excelFiles = useExcelFilesStore((state) => state.files);

  // Variables disponibles para iterar (archivos Excel globales)
  const excelVariables = availableVariables.filter(v => v.type === 'excel');
  
  // Buscar el archivo Excel correspondiente al dataSource
  const currentExcelFile = excelFiles.find(
    (file) => file.name.replace(/\.(csv|xlsx|xls)$/i, '') === dataSource
  );
  
  // Convertir ExcelFile a ExcelData para el preview
  const currentExcelDataForPreview: ExcelData | null = currentExcelFile
    ? {
        filePath: currentExcelFile.filePath,
        sheetName: currentExcelFile.sheetName || 'CSV',
        headers: currentExcelFile.headers,
        rows: currentExcelFile.rows,
        totalRows: currentExcelFile.totalRows,
        variableName: currentExcelFile.name.replace(/\.(csv|xlsx|xls)$/i, ''),
      }
    : (excelDataFromProps && excelDataFromProps.variableName === dataSource ? excelDataFromProps : null);

  useEffect(() => {
    // Si no hay dataSource seleccionado y hay Excel disponible, seleccionar el primero
    if (loopMode === 'excel' && !dataSource && excelVariables.length > 0) {
      const firstExcel = excelVariables[0];
      setDataSource(firstExcel.name);
      onChange({ loopMode: 'excel', dataSource: firstExcel.name });
    }
  }, [loopMode, excelVariables, dataSource, onChange]);

  const handleModeChange = (mode: 'excel' | 'count' | 'until' | 'while') => {
    onChange({ loopMode: mode });
  };

  const handleDataSourceChange = (value: string) => {
    setDataSource(value);
    onChange({ dataSource: value });
  };

  const handleIterationVariableChange = (value: string) => {
    const validName = value.replace(/[^a-zA-Z0-9_]/g, '');
    setIterationVariable(validName);
    onChange({ iterationVariable: validName });
  };

  const handleRepeatCountChange = (value: string) => {
    const num = value ? parseInt(value, 10) : undefined;
    setRepeatCount(value);
    onChange({ repeatCount: num });
  };

  const handleConditionChange = (value: string) => {
    setCondition(value);
    onChange({ condition: value });
  };

  const handleMaxIterationsChange = (value: string) => {
    const num = value ? parseInt(value, 10) : undefined;
    setMaxIterations(value);
    onChange({ maxIterations: num });
  };

  const handleBreakOnErrorChange = (checked: boolean) => {
    setBreakOnError(checked);
    onChange({ breakOnError: checked });
  };

  return (
    <div className="space-y-4">
      {/* Selector de Modo */}
      <div className="space-y-2">
        <Label htmlFor="loop-mode">Modo de repetición *</Label>
        <Select value={loopMode} onValueChange={handleModeChange}>
          <SelectTrigger id="loop-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excel">Por Excel/CSV (iterar sobre filas)</SelectItem>
            <SelectItem value="count">Repetir N veces</SelectItem>
            <SelectItem value="until">Repetir hasta condición</SelectItem>
            <SelectItem value="while">Repetir mientras condición</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {loopMode === 'excel' && 'Itera sobre cada fila de un archivo Excel/CSV'}
          {loopMode === 'count' && 'Repite un número fijo de veces'}
          {loopMode === 'until' && 'Repite hasta que una condición sea verdadera'}
          {loopMode === 'while' && 'Repite mientras una condición sea verdadera'}
        </p>
      </div>

      {/* Configuración según el modo */}
      {loopMode === 'excel' && (
        <>
          {/* Variable de datos a iterar */}
          <div className="space-y-2">
            <Label htmlFor="loop-datasource">Archivo Excel/CSV *</Label>
            {excelVariables.length > 0 ? (
              <Select value={dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger id="loop-datasource">
                  <SelectValue placeholder="Selecciona un archivo" />
                </SelectTrigger>
                <SelectContent>
                  {excelVariables.map((variable) => (
                    <SelectItem key={variable.name} value={variable.name}>
                      {variable.name} {variable.source && `(${variable.source})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="loop-datasource"
                value={dataSource}
                onChange={(e) => handleDataSourceChange(e.target.value)}
                placeholder="nombre_archivo"
              />
            )}
            {!dataSource && (
              <p className="text-xs text-amber-600">
                ⚠️ Debes seleccionar un archivo Excel/CSV cargado globalmente
              </p>
            )}
          </div>

          {/* Variable de iteración */}
          <div className="space-y-2">
            <Label htmlFor="loop-iteration-var">Variable de iteración *</Label>
            <Input
              id="loop-iteration-var"
              value={iterationVariable}
              onChange={(e) => handleIterationVariableChange(e.target.value)}
              placeholder="fila"
            />
            <p className="text-xs text-gray-500">
              Nombre de la variable que representará cada fila (ej: "fila", "item", "row")
            </p>
            {!iterationVariable && (
              <p className="text-xs text-amber-600">
                ⚠️ Debes ingresar un nombre de variable
              </p>
            )}
          </div>

          {/* Variables disponibles en cada iteración */}
          {currentExcelDataForPreview && currentExcelDataForPreview.headers.length > 0 && (
            <div className="space-y-2">
              <Label>Variables disponibles en cada iteración:</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {currentExcelDataForPreview.headers.map((header) => (
                    <div key={header} className="text-sm">
                      <code className="text-blue-700 font-mono">
                        {`{{${iterationVariable}.${header}}}`}
                      </code>
                      <span className="text-blue-600 ml-2">→ {header}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Usa estas variables en las acciones dentro del loop
              </p>
            </div>
          )}

          {/* Preview de datos */}
          {currentExcelDataForPreview && (
            <div className="space-y-2">
              <Label>Preview de datos a procesar</Label>
              <ExcelPreview data={currentExcelDataForPreview} maxRows={3} />
              <p className="text-xs text-gray-500">
                El loop procesará {currentExcelDataForPreview.totalRows} filas
              </p>
            </div>
          )}
        </>
      )}

      {loopMode === 'count' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="loop-repeat-count">Número de repeticiones *</Label>
            <Input
              id="loop-repeat-count"
              type="number"
              min="1"
              value={repeatCount}
              onChange={(e) => handleRepeatCountChange(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-gray-500">
              Cuántas veces se repetirán las acciones dentro del loop
            </p>
            {!repeatCount && (
              <p className="text-xs text-amber-600">
                ⚠️ Debes ingresar un número de repeticiones
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loop-iteration-var-count">Variable de iteración</Label>
            <Input
              id="loop-iteration-var-count"
              value={iterationVariable}
              onChange={(e) => handleIterationVariableChange(e.target.value)}
              placeholder="iteracion"
            />
            <p className="text-xs text-gray-500">
              Variable que contendrá el número de iteración actual (1, 2, 3...). Usa <code className="bg-gray-100 px-1 rounded">{`{{${iterationVariable}}}`}</code> en las acciones.
            </p>
          </div>
        </>
      )}

      {(loopMode === 'until' || loopMode === 'while') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="loop-condition">Condición *</Label>
            <Input
              id="loop-condition"
              value={condition}
              onChange={(e) => handleConditionChange(e.target.value)}
              placeholder="Ej: {{variable}} == 'valor'"
            />
            <p className="text-xs text-gray-500">
              {loopMode === 'until' 
                ? 'El loop se detendrá cuando esta condición sea verdadera'
                : 'El loop continuará mientras esta condición sea verdadera'}
            </p>
            {!condition && (
              <p className="text-xs text-amber-600">
                ⚠️ Debes ingresar una condición
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loop-iteration-var-cond">Variable de iteración</Label>
            <Input
              id="loop-iteration-var-cond"
              value={iterationVariable}
              onChange={(e) => handleIterationVariableChange(e.target.value)}
              placeholder="iteracion"
            />
            <p className="text-xs text-gray-500">
              Variable que contendrá el número de iteración actual. Usa <code className="bg-gray-100 px-1 rounded">{`{{${iterationVariable}}}`}</code> en las acciones.
            </p>
          </div>
        </>
      )}

      {/* Máximo de iteraciones (seguridad para todos los modos) */}
      <div className="space-y-2">
        <Label htmlFor="loop-max">Límite máximo de iteraciones (seguridad)</Label>
        <Input
          id="loop-max"
          type="number"
          min="1"
          value={maxIterations}
          onChange={(e) => handleMaxIterationsChange(e.target.value)}
          placeholder="1000"
        />
        <p className="text-xs text-gray-500">
          Límite de seguridad para evitar loops infinitos. El loop se detendrá automáticamente si alcanza este número.
        </p>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        <Label>Opciones</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="break-error"
            checked={breakOnError}
            onCheckedChange={handleBreakOnErrorChange}
          />
          <Label htmlFor="break-error" className="font-normal cursor-pointer">
            Detener loop si hay un error en alguna iteración
          </Label>
        </div>
      </div>
    </div>
  );
}
