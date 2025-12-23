// Dashboard Page
export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🤖 Sistema RPA</h1>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <button className="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-4xl mb-2">➕</div>
          <div className="font-semibold">Nuevo Workflow</div>
        </button>
        
        <button className="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-4xl mb-2">📂</div>
          <div className="font-semibold">Mis Workflows</div>
        </button>
        
        <button className="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
          <div className="text-4xl mb-2">🌐</div>
          <div className="font-semibold">Galería</div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workflows Recientes</h2>
        <p className="text-gray-500">No hay workflows todavía</p>
      </div>
    </div>
  );
}
