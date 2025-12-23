// Action Palette - Panel lateral con acciones arrastrables
import { useCallback } from 'react';
import { 
  MousePointer2, 
  FileText, 
  Globe, 
  Database, 
  Mail, 
  Clock,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

export interface ActionTemplate {
  id: string;
  label: string;
  type: 'click' | 'type' | 'navigate' | 'extract' | 'send-email' | 'wait';
  icon: typeof MousePointer2;
  description: string;
  color: string;
}

const actions: ActionTemplate[] = [
  {
    id: 'click',
    label: 'Hacer Clic',
    type: 'click',
    icon: MousePointer2,
    description: 'Hacer clic en un elemento',
    color: 'bg-blue-500',
  },
  {
    id: 'type',
    label: 'Escribir Texto',
    type: 'type',
    icon: FileText,
    description: 'Escribir texto en un campo',
    color: 'bg-green-500',
  },
  {
    id: 'navigate',
    label: 'Navegar',
    type: 'navigate',
    icon: Globe,
    description: 'Navegar a una URL',
    color: 'bg-purple-500',
  },
  {
    id: 'extract',
    label: 'Extraer Datos',
    type: 'extract',
    icon: Database,
    description: 'Extraer datos de la página',
    color: 'bg-orange-500',
  },
  {
    id: 'send-email',
    label: 'Enviar Email',
    type: 'send-email',
    icon: Mail,
    description: 'Enviar un correo electrónico',
    color: 'bg-red-500',
  },
  {
    id: 'wait',
    label: 'Esperar',
    type: 'wait',
    icon: Clock,
    description: 'Esperar un tiempo determinado',
    color: 'bg-gray-500',
  },
];

interface ActionPaletteProps {
  onDragStart: (action: ActionTemplate, event: React.DragEvent) => void;
}

export function ActionPalette({ onDragStart }: ActionPaletteProps) {
  const handleDragStart = useCallback(
    (action: ActionTemplate, event: React.DragEvent) => {
      event.dataTransfer.setData('application/reactflow', JSON.stringify(action));
      event.dataTransfer.effectAllowed = 'move';
      onDragStart(action, event);
    },
    [onDragStart]
  );

  return (
    <Card className="h-full w-64 border-r border-gray-200 rounded-none">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg">Acciones</CardTitle>
        <p className="text-xs text-gray-500">Arrastra acciones al canvas</p>
      </CardHeader>
      <CardContent className="p-4 space-y-2 overflow-y-auto">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              draggable
              onDragStart={(e) => handleDragStart(action, e)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-gray-200',
                'bg-white cursor-grab active:cursor-grabbing',
                'hover:shadow-md transition-shadow',
                'group'
              )}
            >
              <div className={cn('rounded-lg p-2 text-white', action.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{action.label}</div>
                <div className="text-xs text-gray-500 truncate">{action.description}</div>
              </div>
              <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

