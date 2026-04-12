"use client";

import React from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="auth-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      background: 'radial-gradient(circle at center, var(--navy-light), var(--navy-dark))'
    }}>
      <div className="auth-container" style={{ maxWidth: '600px' }}>
        <div style={{ fontSize: '5rem', marginBottom: 'var(--space-xl)' }}>🏗️</div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
          Under <span className="text-gold">Maintenance</span>
        </h1>
        <p className="subtitle" style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
          We are currently upgrading the PLAN 2 BUILD engine to provide you with a smoother, faster construction marketplace experience.
        </p>
        
        <div className="dashboard-card" style={{ marginTop: 'var(--space-4xl)', padding: 'var(--space-xl)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Expected back online shortly.</p>
        </div>

        <div style={{ marginTop: 'var(--space-4xl)' }}>
            <Link href="/auth/login" className="btn btn-secondary">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
