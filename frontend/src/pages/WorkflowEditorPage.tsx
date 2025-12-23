// Workflow Editor Page
import { useNavigate, useParams } from 'react-router-dom';
import { WorkflowEditor } from '../components/workflow/WorkflowEditor';
import { Node, Edge } from 'reactflow';

export default function WorkflowEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const handleSave = (nodes: Node[], edges: Edge[]) => {
    // TODO: Implementar guardado en Firebase
    console.log('Guardando workflow:', { nodes, edges });
    // Después de guardar, navegar a la lista
    navigate('/workflows');
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkflowEditor workflowId={id} onSave={handleSave} />
    </div>
  );
}

