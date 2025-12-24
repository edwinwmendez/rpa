// Dashboard Page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Globe, Clock, CheckCircle, XCircle, Edit, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loading } from '../components/ui/loading';
import { useAgentStore } from '../stores/agentStore';
import { useAuthStore } from '../stores/authStore';
import { useWorkflowsStore } from '../stores/workflowsStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { status } = useAgentStore();
  const { user } = useAuthStore();
  const { workflows, fetchWorkflows, loading } = useWorkflowsStore();
  const isConnected = status.status === 'connected';

  useEffect(() => {
    if (user) {
      fetchWorkflows(user.uid);
    }
  }, [user, fetchWorkflows]);

  // Calcular estadísticas
  const totalWorkflows = workflows.length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0);
  const totalSuccess = workflows.reduce((sum, w) => sum + w.successCount, 0);
  const totalFailures = workflows.reduce((sum, w) => sum + w.failureCount, 0);

  // Obtener workflows recientes
  const recentWorkflows = workflows
    .sort((a, b) => {
      const aTime = a.lastExecutedAt?.toMillis() || a.updatedAt.toMillis();
      const bTime = b.lastExecutedAt?.toMillis() || b.updatedAt.toMillis();
      return bTime - aTime;
    })
    .slice(0, 5);

  const stats = [
    { label: 'Workflows Totales', value: totalWorkflows.toString(), icon: FolderOpen, color: 'text-blue-600' },
    { label: 'Ejecuciones Totales', value: totalExecutions.toString(), icon: Clock, color: 'text-green-600' },
    { label: 'Exitosas', value: totalSuccess.toString(), icon: CheckCircle, color: 'text-green-600' },
    { label: 'Fallidas', value: totalFailures.toString(), icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bienvenido al Sistema RPA</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? 'success' : 'destructive'}>
            {isConnected ? 'Agente Conectado' : 'Agente Desconectado'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/workflows/new')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Nuevo Workflow</CardTitle>
                  <CardDescription>Crear un nuevo workflow de automatización</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/workflows')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Mis Workflows</CardTitle>
                  <CardDescription>Ver y gestionar tus workflows</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-3">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Galería</CardTitle>
                  <CardDescription>Explorar workflows de la comunidad</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Recent Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows Recientes</CardTitle>
          <CardDescription>Últimos workflows ejecutados o modificados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : recentWorkflows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay workflows todavía</p>
              <Button
                className="mt-4"
                onClick={() => navigate('/workflows/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Workflow
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{workflow.nodes.length} pasos</span>
                      {workflow.lastExecutedAt && (
                        <span>
                          Última ejecución: {new Date(workflow.lastExecutedAt.toMillis()).toLocaleDateString()}
                        </span>
                      )}
                      {workflow.executionCount > 0 && (
                        <Badge variant={workflow.successCount > workflow.failureCount ? 'success' : 'default'}>
                          {workflow.successCount}/{workflow.executionCount} exitosas
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/workflows/${workflow.id}`)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ejecutar"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
