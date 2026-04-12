'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: {
          email: formData.email,
          password: formData.password
        }
      });
      
      localStorage.setItem('p2b_token', data.token);
      localStorage.setItem('p2b_user', JSON.stringify(data.user));
      
      if (data.user.role === 'admin') router.push('/admin');
      else if (data.user.role === 'engineer') router.push('/dashboard/engineer');
      else router.push('/dashboard/customer');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-branding">
          <h2>Welcome Back to<br /><span className="text-gold">PLAN 2 BUILD</span></h2>
          <p>Access your dashboard, manage projects, and connect with construction professionals.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="icon">🏗️</div> Verified professionals at your fingertips
            </div>
            <div className="auth-feature">
              <div className="icon">💬</div> Real-time messaging with engineers
            </div>
            <div className="auth-feature">
              <div className="icon">📊</div> Track your projects seamlessly
            </div>
            <div className="auth-feature">
              <div className="icon">🔒</div> Secure and trusted platform
            </div>
          </div>
        </div>
        
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <h2>Sign In</h2>
            <p className="subtitle">Enter your credentials to access your account</p>
            
            {error && <div className="toast toast-error" style={{ position: 'relative', top: '0', right: '0', marginBottom: '20px', width: '100%', minWidth: '100%' }}>{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" id="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" id="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" /> Remember me
                </label>
                <Link href="#" style={{ fontSize: '0.85rem' }}>Forgot password?</Link>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            <div className="auth-footer">
              Don't have an account? <Link href="/auth/register">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
