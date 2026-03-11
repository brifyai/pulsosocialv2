import { useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { SurveyDashboard } from './components/dashboard/SurveyDashboard';
import { AgentList } from './components/dashboard/AgentList';
import { EventViewer } from './components/dashboard/EventViewer';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://blessed-anaconda-376.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

type TabType = 'dashboard' | 'agents' | 'events';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Panel Sintético Chile</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Sistema de encuestas con población sintética
                </p>
              </div>
              <nav className="flex gap-2">
                <TabButton
                  label="Dashboard"
                  active={activeTab === 'dashboard'}
                  onClick={() => setActiveTab('dashboard')}
                />
                <TabButton
                  label="Agentes"
                  active={activeTab === 'agents'}
                  onClick={() => setActiveTab('agents')}
                />
                <TabButton
                  label="Eventos"
                  active={activeTab === 'events'}
                  onClick={() => setActiveTab('events')}
                />
              </nav>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'dashboard' && <SurveyDashboard />}
          {activeTab === 'agents' && <AgentList />}
          {activeTab === 'events' && <EventViewer />}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-400 text-sm">
            Panel Sintético Chile - Powered by Convex + Supabase
          </div>
        </footer>
      </div>
    </ConvexProvider>
  );
}

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}
