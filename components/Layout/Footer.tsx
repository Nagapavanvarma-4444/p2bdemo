'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="nav-logo" style={{ marginBottom: '8px', display: 'inline-flex' }}>
              <div className="logo-icon">P2B</div>
              <span>PLAN 2 BUILD</span>
            </Link>
            <p>The premier marketplace connecting customers with verified engineers and construction professionals. Build your dream project with confidence.</p>
          </div>
          
          <div className="footer-col">
            <h4>Platform</h4>
            <Link href="/engineers">Find Engineers</Link>
            <Link href="/projects/create">Post a Project</Link>
            <Link href="/subscription">Pricing Plans</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
          
          <div className="footer-col">
            <h4>Categories</h4>
            <Link href="/engineers?category=Civil Engineer">Civil Engineers</Link>
            <Link href="/engineers?category=Architect">Architects</Link>
            <Link href="/engineers?category=Interior Designer">Interior Designers</Link>
            <Link href="/engineers?category=Contractor">Contractors</Link>
          </div>
          
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/">About Us</Link>
            <Link href="/">Careers</Link>
            <Link href="/">Privacy Policy</Link>
            <Link href="/">Terms of Service</Link>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {currentYear} PLAN 2 BUILD. All rights reserved.</p>
          <div className="social-links">
            <Link href="/" title="Twitter">𝕏</Link>
            <Link href="/" title="LinkedIn">in</Link>
            <Link href="/" title="Instagram">📷</Link>
            <Link href="/" title="YouTube">▶</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
