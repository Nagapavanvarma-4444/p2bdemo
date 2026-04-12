'use client';

import React from 'react';
import Link from 'next/link';

interface Engineer {
  id: string;
  name: string;
  category: string;
  location: string;
  avatar?: string;
  is_verified: boolean;
  is_featured: boolean;
  badge?: string;
  bio?: string;
  average_rating: number;
  experience_years: number;
  completed_projects: number;
}

export default function EngineerCard({ eng }: { eng: Engineer }) {
  return (
    <div className="engineer-card">
      {eng.is_featured && <div className="featured-ribbon">⭐ Featured</div>}
      <div className="engineer-card-header">
        <div className="avatar avatar-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
          {eng.avatar ? <img src={eng.avatar} alt={eng.name} /> : eng.name.charAt(0)}
        </div>
        <div className="engineer-card-main">
          <h3>{eng.name}</h3>
          <div className="category">{eng.category || 'Professional'}</div>
          <div className="location">📍 {eng.location || 'India'}</div>
          <div className="engineer-badges">
            {eng.is_verified && <span className="badge badge-green">✓ Verified</span>}
            {eng.badge && <span className="badge badge-gold">{eng.badge}</span>}
          </div>
        </div>
      </div>
      <div className="engineer-card-body">
        <p className="bio">{eng.bio || 'Experienced construction professional ready to help with your project.'}</p>
      </div>
      <div className="engineer-card-stats">
        <div className="stat">
          <div className="stat-value">{eng.average_rating?.toFixed(1) || '—'}</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat">
          <div className="stat-value">{eng.experience_years || 0}</div>
          <div className="stat-label">Years</div>
        </div>
        <div className="stat">
          <div className="stat-value">{eng.completed_projects || 0}</div>
          <div className="stat-label">Projects</div>
        </div>
      </div>
      <div className="engineer-card-footer">
        <Link href={`/engineers/${eng.id}`} className="btn btn-primary btn-sm">View Profile</Link>
        <Link href={`/messages?to=${eng.id}`} className="btn btn-outline btn-sm">Message</Link>
        <button className="bookmark-btn" title="Bookmark">🔖</button>
      </div>
    </div>
  );
}
