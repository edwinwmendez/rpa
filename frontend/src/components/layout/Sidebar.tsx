// Sidebar Navigation Component
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Workflow, 
  FileText, 
  Settings, 
  HelpCircle,
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Nuevo Workflow', href: '/workflows/new', icon: FileText },
  { name: 'Diagnóstico', href: '/diagnostic', icon: HelpCircle },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarExpanded, toggleSidebar } = useUIStore();

  return (
    <div 
      className={cn(
        'flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        sidebarExpanded ? 'w-64' : 'w-20'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex h-16 items-center border-b border-gray-200 transition-all duration-300',
        sidebarExpanded ? 'px-6 gap-3' : 'px-3 justify-center'
      )}>
        <Bot className="h-8 w-8 text-blue-600 flex-shrink-0" />
        {sidebarExpanded && (
          <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
            Sistema RPA
          </h1>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors group',
                sidebarExpanded ? 'gap-3 px-3 py-2' : 'justify-center px-2 py-2',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={!sidebarExpanded ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarExpanded && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full justify-center"
          title={sidebarExpanded ? 'Contraer sidebar' : 'Expandir sidebar'}
        >
          {sidebarExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

