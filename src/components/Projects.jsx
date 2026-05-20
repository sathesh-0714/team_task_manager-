import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderPlus, 
  FolderGit2, 
  Plus, 
  X, 
  UserPlus, 
  UserMinus, 
  Calendar, 
  User, 
  ChevronRight,
  Trash2,
  Settings
} from 'lucide-react';

export default function Projects({ selectedProjectId, setSelectedProjectId }) {
  const { apiFetch, user, showToast } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetail, setProjectDetail] = useState(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberUserId, setMemberUserId] = useState('');

  // Fetch projects list
  const fetchProjects = async () => {
    try {
      const data = await apiFetch('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users list (for member invites)
  const fetchUsers = async () => {
    try {
      if (user?.role === 'Admin') {
        const users = await apiFetch('/api/users');
        setAllUsers(users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch specific project details
  const fetchProjectDetail = async (id) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/projects/${id}`);
      setProjectDetail(data);
    } catch (err) {
      showToast('Error loading project details.', 'error');
      setSelectedProjectId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetail(selectedProjectId);
    } else {
      setProjectDetail(null);
    }
  }, [selectedProjectId]);

  // Handle Project Creation (Admin only)
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const newProj = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      showToast('Project initialized successfully.', 'success');
      setName('');
      setDescription('');
      setIsCreateModalOpen(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Project Deletion (Admin only)
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this project? All associated tasks will be permanently removed.')) {
      return;
    }

    try {
      await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      showToast('Project deleted successfully.', 'success');
      setSelectedProjectId(null);
      fetchProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Add Member (Admin only)
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId || !selectedProjectId) return;

    try {
      const res = await apiFetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: memberUserId }),
      });
      showToast('Team member added to project.', 'success');
      setMemberUserId('');
      // Update details
      setProjectDetail(prev => ({
        ...prev,
        members: res.members
      }));
      fetchProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Remove Member (Admin only)
  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Remove this member from the project?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/projects/${selectedProjectId}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      showToast('Member removed from project.', 'success');
      // Update details
      setProjectDetail(prev => ({
        ...prev,
        members: res.members
      }));
      fetchProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading && !projectDetail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (projectDetail) {
    const isAdmin = user?.role === 'Admin';
    const isOwner = projectDetail.ownerId === user?.id;

    // Filter out users who are already members
    const nonMembers = allUsers.filter(
      u => !projectDetail.members.some(m => m.id === u.id)
    );

    return (
      <div>
        <div className="content-header">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => setSelectedProjectId(null)}>
              &larr; Back to all projects
            </span>
            <h1 className="page-title" style={{ marginTop: '0.5rem' }}>{projectDetail.name}</h1>
          </div>
          {isAdmin && (
            <button className="btn btn-danger" onClick={() => handleDeleteProject(projectDetail.id)}>
              <Trash2 size={16} />
              Archive Project
            </button>
          )}
        </div>

        {/* Project Header Info Card */}
        <div className="glass-panel project-detail-header-card" style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'white', fontSize: '1.05rem', lineHeight: '1.6' }}>
            {projectDetail.description || 'No description provided for this project.'}
          </p>
          <div className="project-detail-meta">
            <div className="meta-item">
              <User size={14} color="#6366f1" />
              <span>Owner: <strong>{projectDetail.owner?.name}</strong></span>
            </div>
            <div className="meta-item">
              <FolderGit2 size={14} color="#a855f7" />
              <span>Scope size: <strong>{projectDetail.tasks?.length || 0} tasks</strong></span>
            </div>
          </div>
        </div>

        {/* Members and Tasks Grid */}
        <div className="split-dashboard-layout">
          {/* Left Column: Member management */}
          <div className="glass-panel dashboard-section-card">
            <h3 className="section-header-title">
              <UserPlus size={18} color="#6366f1" />
              Project Active Team ({projectDetail.members?.length || 0})
            </h3>

            {/* Admin Member invite box */}
            {isAdmin && (
              <form onSubmit={handleAddMember} className="filter-bar" style={{ gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1.25rem' }}>
                <div style={{ flexGrow: 1 }}>
                  <select
                    className="text-input select-input"
                    style={{ width: '100%' }}
                    value={memberUserId}
                    onChange={(e) => setMemberUserId(e.target.value)}
                    required
                  >
                    <option value="">Select User to Invite...</option>
                    {nonMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                  <Plus size={16} />
                  Add Member
                </button>
              </form>
            )}

            <div className="flex-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {projectDetail.members?.map(member => (
                <div key={member.id} className="member-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={member.avatarUrl} alt={member.name} className="project-owner-avatar" />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{member.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: member.role === 'Admin' ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {member.role}
                    </span>
                    {isAdmin && member.id !== projectDetail.ownerId && (
                      <button 
                        className="logout-btn" 
                        style={{ padding: '0.25rem', color: 'var(--text-muted)' }} 
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tasks outline */}
          <div className="glass-panel dashboard-section-card">
            <h3 className="section-header-title">
              <FolderGit2 size={18} color="#a855f7" />
              Sprints Tasks ({projectDetail.tasks?.length || 0})
            </h3>

            {projectDetail.tasks?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks assigned inside this project.</p>
              </div>
            ) : (
              <div className="flex-list" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {projectDetail.tasks?.map(task => (
                  <div key={task.id} className="task-list-row" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{task.title}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Assignee: {task.assignee ? task.assignee.name : 'Unassigned'}
                        </span>
                        {task.dueDate && (
                          <span style={{ color: 'var(--text-muted)' }}>| Due: {task.dueDate}</span>
                        )}
                      </div>
                    </div>
                    <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`} style={{ scale: '0.85' }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- GRID LIST VIEW ---
  return (
    <div>
      <div className="content-header">
        <div>
          <h1 className="page-title">Active Projects</h1>
          <p className="page-subtitle">Track and configure your software development modules.</p>
        </div>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <FolderPlus size={18} />
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel no-data-card" style={{ padding: '4rem 2rem' }}>
          <FolderGit2 size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No Active Projects</h3>
          <p style={{ marginTop: '0.5rem' }}>
            {user?.role === 'Admin' 
              ? 'Get started by creating a new collaborative project pipeline!' 
              : 'You are not assigned to any project. Contact an administrator to get access.'
            }
          </p>
          {user?.role === 'Admin' && (
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setIsCreateModalOpen(true)}>
              Initialize Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              className="glass-panel project-card glass-panel-interactive"
              onClick={() => setSelectedProjectId(proj.id)}
            >
              <div>
                <div className="project-card-header">
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.35rem', borderRadius: '8px' }}>
                    <FolderGit2 size={20} />
                  </span>
                  <ChevronRight size={18} color="#64748b" />
                </div>
                <h3 className="project-card-title">{proj.name}</h3>
                <p className="project-card-desc">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="project-card-footer">
                <div className="project-owner-info">
                  <img src={proj.owner?.avatarUrl} alt="Owner" className="project-owner-avatar" />
                  <span className="project-owner-name">{proj.owner?.name}</span>
                </div>
                
                <div className="project-members-stack">
                  {proj.members?.slice(0, 3).map((member) => (
                    <img 
                      key={member.id} 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      title={member.name}
                      className="project-member-bubble" 
                    />
                  ))}
                  {proj.members?.length > 3 && (
                    <div className="project-member-count">+{proj.members.length - 3}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE MODAL (Admin only) --- */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
              <X size={18} />
            </button>
            <h3 className="modal-title">
              <FolderPlus size={20} color="#6366f1" />
              Initialize Project
            </h3>
            
            <form onSubmit={handleCreateProject}>
              <div className="input-group">
                <label className="input-label">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Android App Remake"
                  className="text-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  placeholder="Explain goals, key deliverables, and target sprint scopes..."
                  className="text-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Initialize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
