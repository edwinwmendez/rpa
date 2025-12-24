// Variable Selector - Selector visual de variables para usuarios no técnicos
import { useState } from 'react';
import { FileSpreadsheet, RefreshCw, Type, Database, Search } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import type { WorkflowVariable } from '../../types/workflow';

interface VariableSelectorProps {
  availableVariables: WorkflowVariable[];
  onSelect: (variableName: string) => void;
  trigger?: React.ReactNode;
}

export function VariableSelector({ availableVariables, onSelect, trigger }: VariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupar variables por tipo
  const groupedVariables = availableVariables.reduce((acc, variable) => {
    const type = variable.type || 'custom';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(variable);
    return acc;
  }, {} as Record<string, WorkflowVariable[]>);

  // Filtrar variables por término de búsqueda
  const filteredVariables = availableVariables.filter(v => {
    const search = searchTerm.toLowerCase();
    return (
      v.name.toLowerCase().includes(search) ||
      v.description?.toLowerCase().includes(search) ||
      v.source?.toLowerCase().includes(search)
    );
  });

  // Agrupar variables filtradas
  const filteredGrouped = filteredVariables.reduce((acc, variable) => {
    const type = variable.type || 'custom';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(variable);
    return acc;
  }, {} as Record<string, WorkflowVariable[]>);

  const variablesToShow = searchTerm ? filteredGrouped : groupedVariables;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'excel':
        return '📊 Columnas de Excel/CSV';
      case 'loop':
        return '🔄 Variables de Loop';
      case 'read':
        return '📝 Texto Leído';
      default:
        return '📦 Otras Variables';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case 'loop':
        return <RefreshCw className="h-4 w-4 text-indigo-600" />;
      case 'read':
        return <Type className="h-4 w-4 text-teal-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleVariableClick = (variable: WorkflowVariable) => {
    onSelect(variable.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => setIsOpen(true)}
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Insertar Columna/Variable
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        defaultTrigger
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Columna o Variable</DialogTitle>
            <DialogDescription>
              Haz clic en una columna o variable para insertarla en el texto
            </DialogDescription>
          </DialogHeader>

          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar columna o variable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de variables */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.keys(variablesToShow).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay variables disponibles</p>
                <p className="text-xs mt-1">
                  Carga un archivo Excel/CSV o agrega acciones que generen variables
                </p>
              </div>
            ) : (
              Object.entries(variablesToShow).map(([type, variables]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                    {getTypeIcon(type)}
                    <span>{getTypeLabel(type)}</span>
                    <span className="text-xs font-normal text-gray-500">
                      ({variables.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {variables.map((variable) => {
                      // Para variables de Excel, mostrar solo el nombre de la columna
                      const displayName = variable.name.includes('.')
                        ? variable.name.split('.').pop() || variable.name
                        : variable.name;

                      return (
                        <button
                          key={variable.name}
                          type="button"
                          onClick={() => handleVariableClick(variable)}
                          className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getTypeIcon(type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-semibold text-sm text-gray-900 group-hover:text-blue-700">
                                {displayName}
                              </div>
                              {variable.description && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {variable.description}
                                </div>
                              )}
                              {variable.name.includes('.') && (
                                <div className="text-xs text-gray-400 mt-1 font-mono">
                                  {variable.name}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click para insertar →
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

