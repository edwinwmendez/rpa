// Workflow Editor Page
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkflowEditor } from '../components/workflow/WorkflowEditor';
import type { Node, Edge } from '@xyflow/react';
import { useAuthStore } from '../stores/authStore';
import { useWorkflowsStore } from '../stores/workflowsStore';
import { Loading } from '../components/ui/loading';
// Removido useToast - ahora se maneja automáticamente en el store
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function WorkflowEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuthStore();
  const { 
    currentWorkflow, 
    loading, 
    fetchWorkflow, 
    saveWorkflow,
    clearCurrentWorkflow 
  } = useWorkflowsStore();
  // Los toasts ahora se manejan automáticamente en el store
  const [workflowName, setWorkflowName] = useState('Nuevo Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    } else {
      clearCurrentWorkflow();
      setWorkflowName('Nuevo Workflow');
      setWorkflowDescription('');
    }
  }, [id, fetchWorkflow, clearCurrentWorkflow]);

  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!user) return;

    // Validar nombre antes de guardar
    const nameToUse = workflowName.trim();
    if (!id && (nameToUse === '' || nameToUse === 'Nuevo Workflow')) {
      // Si es nuevo workflow y no tiene nombre válido, pedir nombre
      setTempName(nameToUse || '');
      setPendingSave({ nodes, edges });
      setShowNameDialog(true);
      return;
    }

    try {
      const workflowId = await saveWorkflow(
        id,
        user.uid,
        nodes,
        edges,
        nameToUse || 'Workflow sin nombre',
        workflowDescription
      );
      
      // Toast se muestra automáticamente desde el store
      
      if (!id) {
        // Si es nuevo, navegar al workflow editado
        navigate(`/workflows/${workflowId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error al guardar workflow:', error);
      // Error toast se muestra automáticamente desde el store
    }
  };

  const handleConfirmName = async () => {
    const finalName = tempName.trim();
    if (!finalName || finalName === '') {
      alert('Por favor, ingresa un nombre para el workflow');
      return;
    }

    setWorkflowName(finalName);
    setShowNameDialog(false);

    if (pendingSave && user) {
      try {
        const workflowId = await saveWorkflow(
          id,
          user.uid,
          pendingSave.nodes,
          pendingSave.edges,
          finalName,
          workflowDescription
        );
        
        // Toast se muestra automáticamente desde el store
        
        if (!id) {
          navigate(`/workflows/${workflowId}`, { replace: true });
        }
      } catch (error) {
        console.error('Error al guardar workflow:', error);
        // Error toast se muestra automáticamente desde el store
      }
    }

    setPendingSave(null);
    setTempName('');
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Nombre del workflow"
            />
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="flex-1 text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Descripción (opcional)"
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <WorkflowEditor workflowId={id} onSave={handleSave} />
        </div>
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nombre del Workflow</DialogTitle>
            <DialogDescription>
              Por favor, ingresa un nombre para tu workflow antes de guardarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Nombre *</Label>
              <Input
                id="workflow-name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Mi Workflow"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmName();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-desc">Descripción (opcional)</Label>
              <Input
                id="workflow-desc"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Descripción del workflow"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmName} disabled={!tempName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

