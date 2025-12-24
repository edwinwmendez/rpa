// Header Component
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAgentStore } from '../../stores/agentStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const { status } = useAgentStore();
  const { user, logout } = useAuthStore();
  const isConnected = status.status === 'connected';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar workflows..."
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100">
          <User className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">
            {user?.email?.split('@')[0] || 'Usuario'}
          </span>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

