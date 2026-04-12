'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      alert("Thank you! We've received your message and will get back to you within 24 hours.");
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 40px)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="section-heading">
          <div className="label">Contact</div>
          <h2>Get In Touch</h2>
          <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
          <div className="card" style={{ padding: 'var(--space-2xl)' }}>
            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Send us a message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input type="text" className="form-input" required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" required placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" required placeholder="How can we help?" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" rows={5} required placeholder="Tell us about your query..."></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message →'}
              </button>
            </form>
          </div>
          
          <div>
            <div className="card" style={{ padding: 'var(--space-2xl)', marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ marginBottom: 'var(--space-xl)' }}>Contact Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(212,168,67,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📧</div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Email</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>support@plan2build.com</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(212,168,67,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📱</div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Phone</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>+91 98765 43210</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(212,168,67,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📍</div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Office</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mumbai, Maharashtra, India</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(212,168,67,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>⏰</div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Hours</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mon - Sat, 9 AM - 7 PM IST</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 'var(--space-2xl)', background: 'linear-gradient(135deg,var(--navy-mid),var(--navy-light))', borderColor: 'transparent' }}>
              <h3 style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>Need urgent help?</h3>
              <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem', lineHeight: 1.7 }}>Premium subscribers get priority support with guaranteed 2-hour response times.</p>
              <Link href="/subscription" className="btn btn-primary mt-3">View Plans →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
