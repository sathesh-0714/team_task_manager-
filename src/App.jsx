import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Trello, 
  LogOut,
  Layers
} from 'lucide-react';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // loading state
  if (loading) {
    return (
      <div id="initial-loader">
        <div className="spinner"></div>
        <h2 className="brand-title">AETHERFLOW</h2>
        <div className="brand-sub">Loading Secure Workspace...</div>
      </div>
    );
  }

  // Not logged in -> Auth Screen
  if (!user) {
    return <Auth />;
  }

  // Helper to handle switching project details
  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab('projects');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-logo">
              <Layers size={22} color="white" />
            </div>
            <span className="brand-name">AetherFlow</span>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <div 
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedProjectId(null);
                  }}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('projects');
                    setSelectedProjectId(null);
                  }}
                >
                  <FolderGit2 size={18} />
                  Projects
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('tasks');
                    setSelectedProjectId(null);
                  }}
                >
                  <Trello size={18} />
                  Tasks Board
                </div>
              </li>
            </ul>
          </nav>
        </div>

        {/* User Info Footing */}
        <div className="user-profile-section">
          <img src={user.avatarUrl} alt={user.name} className="user-avatar" />
          <div className="user-info">
            <span className="user-name" title={user.name}>{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="logout-btn" title="Sign Out" onClick={logout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedProjectId={handleSelectProject} 
          />
        )}
        
        {activeTab === 'projects' && (
          <Projects 
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        )}

        {activeTab === 'tasks' && (
          <Tasks 
            preselectedProjectId={selectedProjectId} 
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
