// Login Page
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loading } from '../components/ui/loading';
import { Bot, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, error, clearError, user, initialized } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirigir automáticamente si el usuario ya está autenticado
  useEffect(() => {
    if (initialized && user) {
      navigate('/', { replace: true });
    }
  }, [user, initialized, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    
    try {
      await signIn(email, password);
      // No navegar aquí, el useEffect se encargará cuando el usuario esté disponible
    } catch (err) {
      // Error ya está manejado en el store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema RPA</CardTitle>
          <CardDescription>
            Inicia sesión para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Regístrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

