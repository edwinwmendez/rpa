// Main App Component
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AgentStatusBanner } from './components/AgentStatusBanner';
import Dashboard from './pages/Dashboard';
import Diagnostic from './pages/Diagnostic';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AgentStatusBanner />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
