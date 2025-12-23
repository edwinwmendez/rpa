// Settings Page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestiona la configuración del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agente</CardTitle>
          <CardDescription>Configuración de conexión con el agente local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-url">URL del Agente</Label>
            <Input id="agent-url" defaultValue="http://localhost:5000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-timeout">Timeout (ms)</Label>
            <Input id="agent-timeout" type="number" defaultValue="30000" />
          </div>
          <Button>Guardar Configuración</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firebase</CardTitle>
          <CardDescription>Configuración de Firebase</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            La configuración de Firebase se gestiona mediante variables de entorno.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

