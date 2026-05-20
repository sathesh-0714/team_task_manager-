import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

// Base API URL configuration: checks VITE_API_URL from environment or defaults to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast Notification System
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Helper to safely parse JSON response, throwing a clean error if non-JSON (like HTML fallback)
  const safeParseJson = async (response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error(`Server returned invalid response (HTTP ${response.status}). Please check if the backend is running.`);
    }
  };

  // Helper fetch function that automatically injects auth headers
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await safeParseJson(response);

      if (!response.ok) {
        // If 401 (Unauthorized), trigger logout
        if (response.status === 401 && token) {
          logout();
          showToast('Session expired. Please log in again.', 'error');
        }
        throw new Error(data.message || 'Something went wrong.');
      }

      return data;
    } catch (error) {
      console.error(`API Fetch Error [${endpoint}]:`, error);
      throw error;
    }
  };

  // Hydrate user session on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await safeParseJson(response);
          setUser(userData);
        } else {
          // Token invalid/expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeParseJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Welcome back! Login successful.', 'success');
      return data.user;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  // SIGNUP
  const signup = async (name, email, password, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await safeParseJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Account created! Welcome to AetherFlow.', 'success');
      return data.user;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'success');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      apiFetch,
      toasts,
      showToast,
      removeToast
    }}>
      {children}
      {/* Toast container renders notification system globally */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => removeToast(toast.id)}>
            <div style={{ flexGrow: 1 }}>{toast.message}</div>
            <span style={{ fontSize: '1.25rem', cursor: 'pointer', opacity: 0.7 }}>&times;</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
