'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { p2b_api_call } from '@/lib/api';

export default function Register() {
  const [role, setRole] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('role', role);
      fd.append('phone', formData.phone);
      fd.append('location', formData.location);

      if (role === 'engineer') {
        if (!formData.category) {
          setError('Please select a category');
          setLoading(false);
          return;
        }
        fd.append('category', formData.category);
        
        // Handling files (limited for now in migration)
        const fileInput = document.getElementById('reg-certs') as HTMLInputElement;
        if (fileInput && fileInput.files) {
          for (let i = 0; i < fileInput.files.length; i++) {
            fd.append('certificates', fileInput.files[i]);
          }
        }
      }

      const data = await apiCall('/api/auth/register', { method: 'POST', body: fd });
      
      localStorage.setItem('p2b_token', data.token);
      localStorage.setItem('p2b_user', JSON.stringify(data.user));
      
      router.push(data.user.role === 'engineer' ? '/dashboard/engineer' : '/dashboard/customer');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-branding">
          <h2>Join <span className="text-gold">PLAN 2 BUILD</span></h2>
          <p>Create your account and start connecting with the construction industry's finest professionals.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="icon">✓</div> Free for customers
            </div>
            <div className="auth-feature">
              <div className="icon">🏆</div> Top-rated professionals
            </div>
            <div className="auth-feature">
              <div className="icon">📱</div> Mobile-friendly platform
            </div>
            <div className="auth-feature">
              <div className="icon">🚀</div> Get started in minutes
            </div>
          </div>
        </div>
        
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <h2>Create Account</h2>
            <p className="subtitle">Choose your role and fill in your details</p>
            
            {error && <div className="toast toast-error" style={{ position: 'relative', top: '0', right: '0', marginBottom: '20px', width: '100%', minWidth: '100%' }}>{error}</div>}

            <div className="role-selector">
              <div className={`role-option ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>
                <div className="icon">👤</div>
                <div className="name">Customer</div>
                <div className="desc">Looking to build</div>
              </div>
              <div className={`role-option ${role === 'engineer' ? 'active' : ''}`} onClick={() => setRole('engineer')}>
                <div className="icon">👷</div>
                <div className="name">Engineer</div>
                <div className="desc">Offer services</div>
              </div>
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" id="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" id="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" id="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 9876543210" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" id="location" value={formData.location} onChange={handleInputChange} placeholder="Mumbai, Maharashtra" />
              </div>
              
              {role === 'engineer' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Professional Category</label>
                    <select className="form-select" id="category" value={formData.category} onChange={handleInputChange}>
                      <option value="">Select category...</option>
                      <option value="Civil Engineer">Civil Engineer</option>
                      <option value="Electrical Engineer">Electrical Engineer</option>
                      <option value="Architect">Architect</option>
                      <option value="Interior Designer">Interior Designer</option>
                      <option value="Exterior Designer">Exterior Designer</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Certificates / Documents</label>
                    <input type="file" className="form-input" id="reg-certs" multiple accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" id="password" value={formData.password} onChange={handleInputChange} placeholder="Min 8 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" id="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm your password" required />
              </div>
              
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            
            <div className="auth-footer">
              Already have an account? <Link href="/auth/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
