import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, User, LayoutGrid } from 'lucide-react';

export default function Auth() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member'); // Admin or Member

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, role);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo-center">
            <LayoutGrid size={26} color="white" />
          </div>
          <h1 className="auth-title">AetherFlow</h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to access your task dashboard' 
              : 'Create your developer account to begin'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="text-input"
                  style={{ paddingLeft: '38px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}>
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="text-input"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: isLogin ? '1.5rem' : '1.25rem' }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}>
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="text-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group" style={{ marginBottom: '1.75rem' }}>
              <label className="input-label">Choose Role</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}>
                  <Shield size={18} />
                </span>
                <select
                  className="text-input select-input"
                  style={{ paddingLeft: '38px', appearance: 'none', WebkitAppearance: 'none' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Member">Member (View & update task status)</option>
                  <option value="Admin">Admin (Create projects & delegate tasks)</option>
                </select>
                <div style={{ position: 'absolute', right: '15px', top: '15px', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #94a3b8', pointerEvents: 'none' }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.35rem', background: 'rgba(99, 102, 241, 0.08)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <strong>Testing Tip:</strong> Create one <strong>Admin</strong> account to set up projects/tasks, and one <strong>Member</strong> account to assign tasks to.
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Processing Transaction...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            className="auth-toggle-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}
