// Variable Autocomplete - Input con autocompletado de variables
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { FileSpreadsheet, Database, RefreshCw, Type } from 'lucide-react';
import type { WorkflowVariable } from '../../types/workflow';

interface VariableAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: WorkflowVariable[];
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export function VariableAutocomplete({
  value,
  onChange,
  availableVariables,
  placeholder = 'Escribe texto o usa {{variable}}',
  multiline = false,
  className,
}: VariableAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<WorkflowVariable[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    
    // Obtener posición del cursor
    const input = inputRef.current;
    if (input) {
      const cursorPos = input.selectionStart || newValue.length;
      setCursorPosition(cursorPos);
      
      // Buscar variables que coincidan
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const match = textBeforeCursor.match(/\{\{([^}]*)$/);
      
      if (match) {
        const searchTerm = match[1].toLowerCase();
        // Filtrar variables que coincidan con el término de búsqueda
        const filtered = availableVariables.filter(v => {
          const nameLower = v.name.toLowerCase();
          const descLower = v.description?.toLowerCase() || '';
          return nameLower.includes(searchTerm) || descLower.includes(searchTerm);
        });
        
        // Ordenar: primero las que empiezan con el término, luego las que lo contienen
        const sorted = filtered.sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(searchTerm);
          const bStarts = b.name.toLowerCase().startsWith(searchTerm);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setSuggestions(sorted.slice(0, 10)); // Limitar a 10 sugerencias
        setShowSuggestions(sorted.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleVariableSelect = (variable: WorkflowVariable) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Encontrar dónde empieza {{ y reemplazar
    const lastOpen = textBeforeCursor.lastIndexOf('{{');
    if (lastOpen !== -1) {
      const beforeVar = value.substring(0, lastOpen);
      const newValue = `${beforeVar}{{${variable.name}}}${textAfterCursor}`;
      onChange(newValue);
      setShowSuggestions(false);
      
      // Mover cursor después de la variable
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = lastOpen + `{{${variable.name}}}`.length;
          inputRef.current.setSelectionRange(newPosition, newPosition);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        // TODO: Implementar navegación con teclado
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Si ya hay {{ en el texto, mostrar sugerencias
          if (value.includes('{{')) {
            const textBeforeCursor = value.substring(0, cursorPosition || value.length);
            const match = textBeforeCursor.match(/\{\{([^}]*)$/);
            if (match) {
              const searchTerm = match[1].toLowerCase();
              const filtered = availableVariables.filter(v =>
                v.name.toLowerCase().includes(searchTerm) || 
                v.description?.toLowerCase().includes(searchTerm)
              );
              setSuggestions(filtered.slice(0, 10));
              setShowSuggestions(filtered.length > 0);
            } else if (availableVariables.length > 0) {
              // Mostrar primeras variables si no hay término de búsqueda
              setSuggestions(availableVariables.slice(0, 10));
              setShowSuggestions(true);
            }
          } else if (availableVariables.length > 0) {
            // Mostrar sugerencias al hacer focus si hay variables disponibles
            setSuggestions(availableVariables.slice(0, 10));
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
        >
          <div className="p-2 text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
            <strong>Variables disponibles:</strong> {suggestions.length} encontradas
          </div>
          {suggestions.map((variable) => {
            // Icono según tipo de variable
            const getIcon = () => {
              switch (variable.type) {
                case 'excel':
                  return <FileSpreadsheet className="h-3 w-3 text-emerald-600" />;
                case 'loop':
                  return <RefreshCw className="h-3 w-3 text-indigo-600" />;
                case 'read':
                  return <Type className="h-3 w-3 text-teal-600" />;
                default:
                  return <Database className="h-3 w-3 text-gray-600" />;
              }
            };

            // Badge de tipo
            const getTypeLabel = () => {
              switch (variable.type) {
                case 'excel':
                  return 'Excel/CSV';
                case 'loop':
                  return 'Loop';
                case 'read':
                  return 'Leído';
                default:
                  return 'Variable';
              }
            };

            return (
              <button
                key={variable.name}
                type="button"
                onClick={() => handleVariableSelect(variable)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-sm text-blue-700">
                        {`{{${variable.name}}}`}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {getTypeLabel()}
                      </span>
                    </div>
                    {variable.description && (
                      <div className="text-xs text-gray-600 mb-0.5">
                        {variable.description}
                      </div>
                    )}
                    {variable.source && (
                      <div className="text-xs text-gray-400">
                        {variable.source}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

