import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  FolderGit2, 
  Calendar,
  AlertTriangle,
  Play
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setSelectedProjectId }) {
  const { apiFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const { summary, myTasks, overdueList, projects } = stats || {
    summary: { total: 0, todo: 0, inProgress: 0, review: 0, done: 0, overdue: 0 },
    myTasks: [],
    overdueList: [],
    projects: []
  };

  // Calculate overall progress percentage
  const progressPercent = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <div>
      <div className="content-header">
        <div>
          <h1 className="page-title">Workspace Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}! Here is a snapshot of your team's velocity.</p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card glass-panel-hover">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.total}</span>
            <span className="stat-label">Total Scope</span>
          </div>
        </div>

        <div className="glass-panel stat-card glass-panel-hover">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.inProgress + summary.review}</span>
            <span className="stat-label">Active Sprint</span>
          </div>
        </div>

        <div className="glass-panel stat-card glass-panel-hover">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.done}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="glass-panel stat-card glass-panel-hover" style={{ borderLeft: summary.overdue > 0 ? '3px solid var(--color-overdue)' : '' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.overdue}</span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
        </div>
      </div>

      {/* Critical Overdue Warning Banner */}
      {summary.overdue > 0 && (
        <div className="glass-panel" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={28} color="#f43f5e" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'white', fontWeight: 600 }}>Action Required: Overdue Tasks Detected</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.15rem' }}>
              There are {summary.overdue} tasks past their deadline that remain uncompleted. Please review schedules or update statuses.
            </p>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="split-dashboard-layout">
        {/* Left Side: My Tasks & Project Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* My Tasks */}
          <div className="glass-panel dashboard-section-card">
            <h3 className="section-header-title">
              <CheckCircle2 size={20} color="#6366f1" />
              My Assigned Tasks ({myTasks.length})
            </h3>

            {myTasks.length === 0 ? (
              <div className="no-data-card">
                <p>No tasks currently assigned to you.</p>
                {user?.role === 'Admin' && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => { setActiveTab('tasks'); }}
                  >
                    Delegate Tasks
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-list">
                {myTasks.map((task) => (
                  <div key={task.id} className="task-list-row">
                    <div className="task-row-details">
                      <span className="task-row-title">{task.title}</span>
                      <span className="task-row-project">{task.projectName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {task.dueDate && (
                        <span className="task-row-date">
                          <Calendar size={12} />
                          {task.dueDate}
                        </span>
                      )}
                      <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Progress Breakdowns */}
          <div className="glass-panel dashboard-section-card">
            <h3 className="section-header-title">
              <FolderGit2 size={20} color="#a855f7" />
              Team Project Pipelines ({projects.length})
            </h3>

            {projects.length === 0 ? (
              <div className="no-data-card">
                <p>No active projects found. Create a project to start planning.</p>
                {user?.role === 'Admin' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => setActiveTab('projects')}
                  >
                    Initialize Project
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {projects.map((proj) => {
                  const projPercent = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0;
                  return (
                    <div key={proj.id} className="progress-container glass-panel-hover" style={{ padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }} onClick={() => {
                      setSelectedProjectId(proj.id);
                      setActiveTab('projects');
                    }}>
                      <div className="progress-header">
                        <span style={{ fontWeight: 600, color: 'white' }}>{proj.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {projPercent}% ({proj.done}/{proj.total} tasks)
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${projPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Overall progress chart and Overdue details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Progress Card */}
          <div className="glass-panel dashboard-section-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.75rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Overall Completion</h3>
            
            {/* Visual Ring Chart */}
            <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3.2"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="url(#gradientPrimary)"
                  strokeWidth="3.2"
                  strokeDasharray={`${progressPercent} ${100 - progressPercent}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
                <defs>
                  <linearGradient id="gradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{progressPercent}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Done</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {summary.done} out of {summary.total} tasks completed across all assigned projects.
              </p>
            </div>
          </div>

          {/* Overdue Task List details */}
          <div className="glass-panel dashboard-section-card">
            <h3 className="section-header-title">
              <AlertCircle size={20} color="#f43f5e" />
              Critical Overdue
            </h3>

            {overdueList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
                <p style={{ fontSize: '0.85rem' }}>Splendid! All deadlines are fully in order.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overdueList.map((task) => (
                  <div 
                    key={task.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      background: 'rgba(244, 63, 94, 0.04)', 
                      borderColor: 'rgba(244, 63, 94, 0.15)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedProjectId(task.projectId);
                      setActiveTab('projects');
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{task.title}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{task.projectName}</span>
                      <span style={{ color: '#f43f5e', fontWeight: 600 }}>Due {task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
