/**
 * Note Node Component - Nodo simple para comentarios/notas en el canvas
 * 
 * Características:
 * - Tamaño automático según contenido
 * - Edición inline
 * - Selector de color simple
 */
import { memo, useState, useRef, useEffect } from 'react';
import { FileText, X, Edit2, Check, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NoteNodeData extends Record<string, unknown> {
  title?: string;
  content: string;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'pink';
}

interface NoteNodeProps {
  data: NoteNodeData;
  selected?: boolean;
  id: string;
}

const colorClasses = {
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-green-50 border-green-200 text-green-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  pink: 'bg-pink-50 border-pink-200 text-pink-900',
};

export const NoteNode = memo(function NoteNode({ data, selected, id }: NoteNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorClass = colorClasses[data.color || 'yellow'];

  // Cerrar color picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  // Inicializar contenido de edición cuando se entra en modo edición
  const startEditing = () => {
    setEditContent(data.content || '');
    setIsEditing(true);
  };

  const startEditingTitle = () => {
    setEditTitle(data.title || '');
    setIsEditingTitle(true);
  };

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editContent]);

  const handleSave = () => {
    const event = new CustomEvent('note-update', {
      detail: { nodeId: id, content: editContent },
    });
    window.dispatchEvent(event);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(data.content || '');
    setIsEditing(false);
  };

  const handleTitleSave = () => {
    const event = new CustomEvent('note-update', {
      detail: { nodeId: id, title: editTitle },
    });
    window.dispatchEvent(event);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(data.title || '');
    setIsEditingTitle(false);
  };

  const handleColorChange = (color: 'yellow' | 'blue' | 'green' | 'purple' | 'pink') => {
    const event = new CustomEvent('note-update', {
      detail: { nodeId: id, color },
    });
    window.dispatchEvent(event);
    setShowColorPicker(false);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 shadow-lg transition-all relative group inline-block',
        colorClass,
        selected ? 'border-blue-500' : 'hover:border-opacity-80',
        'min-w-[200px] max-w-[400px]'
      )}
    >
      {/* Header simple */}
      <div className="flex items-center justify-between p-2 border-b border-opacity-30 border-current">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTitleSave();
                } else if (e.key === 'Escape') {
                  handleTitleCancel();
                }
              }}
              className="flex-1 min-w-0 text-xs font-semibold bg-transparent border-none outline-none focus:ring-1 focus:ring-current focus:ring-opacity-50 rounded px-1"
              placeholder="Título..."
              autoFocus
            />
          ) : (
            <span
              onClick={startEditingTitle}
              className="text-xs font-semibold cursor-text hover:opacity-70 transition-opacity flex-1 min-w-0 truncate"
              title="Clic para editar título"
            >
              {data.title || 'Nota'}
            </span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {!isEditing && (
            <>
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-1 rounded hover:bg-current hover:bg-opacity-20 transition-colors opacity-0 group-hover:opacity-100"
                  title="Cambiar color"
                >
                  <Palette className="h-3 w-3" />
                </button>
                {showColorPicker && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg p-1 z-50 flex gap-1">
                    {(['yellow', 'blue', 'green', 'purple', 'pink'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(color);
                        }}
                        className={cn(
                          'w-6 h-6 rounded border-2 transition-all',
                          colorClasses[color].split(' ')[0], // bg color
                          (data.color || 'yellow') === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-110'
                        )}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={startEditing}
                className="p-1 rounded hover:bg-current hover:bg-opacity-20 transition-colors opacity-0 group-hover:opacity-100"
                title="Editar"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </>
          )}
          {isEditing && (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="p-1 rounded hover:bg-current hover:bg-opacity-20 transition-colors"
                title="Guardar (Ctrl+Enter)"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded hover:bg-current hover:bg-opacity-20 transition-colors"
                title="Cancelar (Esc)"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - tamaño automático */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              // Ajustar altura automáticamente
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
              }
            }}
            className="w-full min-h-[60px] p-2 text-sm bg-white bg-opacity-80 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
            placeholder="Escribe tu nota aquí..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {data.content || <span className="opacity-50 italic">Clic para editar</span>}
          </p>
        )}
      </div>
    </div>
  );
});

