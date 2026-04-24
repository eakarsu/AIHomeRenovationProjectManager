import React, { useState } from 'react';
import API from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const quickFill = () => {
    setEmail('john@example.com');
    setPassword('password123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <span className="icon">🏠</span>
          <h1>AI Home Renovation</h1>
          <p>Project Manager</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-fill">
          <p>Demo Account</p>
          <button className="btn btn-secondary btn-sm btn-full" onClick={quickFill}>
            Fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
