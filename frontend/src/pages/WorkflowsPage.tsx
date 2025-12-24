// Workflows List Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Play, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Loading } from '../components/ui/loading';
import { useAuthStore } from '../stores/authStore';
import { useWorkflowsStore } from '../stores/workflowsStore';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { workflows, loading, error, fetchWorkflows, deleteWorkflow } = useWorkflowsStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchWorkflows(user.uid);
    }
  }, [user, fetchWorkflows]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este workflow?')) {
      await deleteWorkflow(id);
    }
  };

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Workflows</h1>
          <p className="text-gray-500 mt-1">Gestiona tus workflows de automatización</p>
        </div>
        <Button onClick={() => navigate('/workflows/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Workflow
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar workflows..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && workflows.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay workflows todavía</p>
            <Button onClick={() => navigate('/workflows/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {workflow.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {workflow.nodes.length} pasos
                    </Badge>
                    {workflow.executionCount > 0 && (
                      <Badge variant={workflow.successCount > workflow.failureCount ? 'success' : 'default'}>
                        {workflow.successCount}/{workflow.executionCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/workflows/${workflow.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Ejecutar">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(workflow.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

