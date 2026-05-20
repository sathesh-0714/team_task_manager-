import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  X, 
  Calendar, 
  User, 
  Filter, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export default function Tasks({ preselectedProjectId }) {
  const { apiFetch, user, showToast } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterProjectId, setFilterProjectId] = useState(preselectedProjectId || '');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Task Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Edit Task fields (status, etc.)
  const [editStatus, setEditStatus] = useState('TODO');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Load baseline resources
  const loadResources = async () => {
    try {
      setLoading(true);
      // Fetch projects
      const projs = await apiFetch('/api/projects');
      setProjects(projs);
      
      // If we have a preselected project ID from the Dashboard, use it!
      if (preselectedProjectId) {
        setFilterProjectId(preselectedProjectId);
      }

      // Fetch users
      const usersList = await apiFetch('/api/users');
      setAllUsers(usersList);

      // Fetch tasks
      await fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      // Form query parameters
      const params = new URLSearchParams();
      if (filterProjectId) params.append('projectId', filterProjectId);
      if (filterPriority) params.append('priority', filterPriority);
      
      const data = await apiFetch(`/api/tasks?${params.toString()}`);
      
      // Perform assignee filtering locally for complete client-side filter flexibility
      let filtered = data;
      if (filterAssigneeId) {
        filtered = data.filter(t => t.assigneeId === parseInt(filterAssigneeId));
      }
      
      setTasks(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filterProjectId, filterAssigneeId, filterPriority]);

  // Handle Task Creation (Admin only)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !projectId) return;

    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || null,
          projectId: parseInt(projectId),
          assigneeId: assigneeId ? parseInt(assigneeId) : null
        })
      });

      showToast('Task added successfully.', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setProjectId('');
      setAssigneeId('');
      setIsCreateModalOpen(false);
      
      fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Modal & Populate details
  const openEditModal = (task) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditAssigneeId(task.assigneeId || '');
    setEditPriority(task.priority);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate || '');
    setIsEditModalOpen(true);
  };

  // Handle Edit/Status Update
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    const isAdmin = user?.role === 'Admin';
    let body = {};

    if (isAdmin) {
      // Admin can update everything
      body = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        assigneeId: editAssigneeId ? parseInt(editAssigneeId) : null
      };
    } else {
      // Member can ONLY update status
      body = {
        status: editStatus
      };
    }

    try {
      await apiFetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      showToast('Task update saved successfully.', 'success');
      setIsEditModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Delete (Admin only)
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      showToast('Task removed from board.', 'success');
      setIsEditModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Kanban logic helper: Organize tasks by status column
  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  const columns = [
    { title: 'To Do', status: 'TODO', color: 'var(--color-todo)' },
    { title: 'In Progress', status: 'IN_PROGRESS', color: 'var(--color-in-progress)' },
    { title: 'Review', status: 'REVIEW', color: 'var(--color-review)' },
    { title: 'Done', status: 'DONE', color: 'var(--color-done)' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin';
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="content-header">
        <div>
          <h1 className="page-title">Sprint Kanban Board</h1>
          <p className="page-subtitle">Manage project deliverables, assign tasks, and track statuses.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={18} />
            Create Task
          </button>
        )}
      </div>

      {/* Filter Controls Panel */}
      <div className="glass-panel filter-bar" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
        <div className="filter-item">
          <Filter size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filters:</span>
        </div>

        <select 
          className="text-input select-input" 
          style={{ width: '180px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select 
          className="text-input select-input" 
          style={{ width: '180px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          value={filterAssigneeId}
          onChange={(e) => setFilterAssigneeId(e.target.value)}
        >
          <option value="">All Assignees</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select 
          className="text-input select-input" 
          style={{ width: '140px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        {(filterProjectId || filterAssigneeId || filterPriority) && (
          <span 
            style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setFilterProjectId('');
              setFilterAssigneeId('');
              setFilterPriority('');
            }}
          >
            Clear Filters
          </span>
        )}
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.status);
          return (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header">
                <div className="column-header-left">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></div>
                  <span className="column-title">{col.title}</span>
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <div className="kanban-column-list">
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    Column Empty
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'DONE';
                    return (
                      <div 
                        key={task.id} 
                        className="glass-panel task-card glass-panel-interactive"
                        onClick={() => openEditModal(task)}
                      >
                        <div className="task-card-header">
                          <span 
                            className="task-priority-indicator"
                            style={{ 
                              color: task.priority === 'HIGH' ? 'var(--priority-high)' : task.priority === 'MEDIUM' ? 'var(--priority-medium)' : 'var(--priority-low)' 
                            }}
                          >
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span title="Overdue Task!" style={{ color: 'var(--color-overdue)', display: 'flex', alignItems: 'center' }}>
                              <AlertTriangle size={14} />
                            </span>
                          )}
                        </div>

                        <h4 className="task-card-title">{task.title}</h4>
                        <p className="task-card-desc">{task.description}</p>
                        
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Project: <strong style={{ color: 'white' }}>{task.project?.name}</strong>
                        </div>

                        <div className="task-card-footer">
                          <div className="task-assignee">
                            {task.assignee ? (
                              <>
                                <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="task-assignee-avatar" />
                                <span className="task-assignee-name" title={task.assignee.name}>{task.assignee.name}</span>
                              </>
                            ) : (
                              <>
                                <div className="task-assignee-avatar" style={{ background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User size={12} color="#64748b" />
                                </div>
                                <span className="task-assignee-name" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                              </>
                            )}
                          </div>

                          {task.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: isOverdue ? 'var(--color-overdue)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                              <Calendar size={12} />
                              <span>{task.dueDate.substring(5)}</span> {/* MM-DD view */}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- TASK CREATION MODAL (Admin only) --- */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
              <X size={18} />
            </button>
            <h3 className="modal-title">
              <PlusCircle size={20} color="#6366f1" />
              New Sprint Task
            </h3>

            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design Dashboard Prototypes"
                  className="text-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description / Scope Details</label>
                <textarea
                  placeholder="List task parameters, instructions, and verification steps..."
                  className="text-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="grid-2col">
                <div className="input-group">
                  <label className="input-label">Project Pipeline</label>
                  <select
                    className="text-input select-input"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    <option value="">Select Project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Assignee</label>
                  <select
                    className="text-input select-input"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2col">
                <div className="input-group">
                  <label className="input-label">Priority Level</label>
                  <select
                    className="text-input select-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Target Due Date</label>
                  <input
                    type="date"
                    className="text-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Deploy Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TASK EDIT / DETAILS MODAL (Role-Bound rules) --- */}
      {isEditModalOpen && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
              <X size={18} />
            </button>
            <h3 className="modal-title">
              <Edit3 size={20} color="#a855f7" />
              Configure Task
            </h3>

            <form onSubmit={handleUpdateTask}>
              {isAdmin ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Task Title</label>
                    <input
                      type="text"
                      className="text-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description / Scope Details</label>
                    <textarea
                      className="text-input"
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    ></textarea>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>{selectedTask.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedTask.description || 'No description.'}</p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Project: <span style={{ color: 'var(--primary)' }}>{selectedTask.project?.name}</span> | Priority: <span style={{ color: 'white' }}>{selectedTask.priority}</span>
                  </div>
                </div>
              )}

              {/* Status Update (Available to both Admin and Members!) */}
              <div className="input-group">
                <label className="input-label">Task Status</label>
                <select
                  className="text-input select-input"
                  style={{ border: '1px solid rgba(99, 102, 241, 0.4)' }}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {isAdmin && (
                <>
                  <div className="grid-2col">
                    <div className="input-group">
                      <label className="input-label">Delegate To</label>
                      <select
                        className="text-input select-input"
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Priority Level</label>
                      <select
                        className="text-input select-input"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Target Due Date</label>
                    <input
                      type="date"
                      className="text-input"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {!isAdmin && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '6px' }}>
                  💡 <em>Members can only modify the status column. Title, details, priorities, and deadlines are locked by the project Admin.</em>
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  {isAdmin && (
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                    >
                      <Trash2 size={16} />
                      Delete Task
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
