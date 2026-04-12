'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Sync User Session (Real-time)
    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUser({ ...session.user, ...profile });
        
        // Backup to localStorage for legacy client pieces
        localStorage.setItem('p2b_user', JSON.stringify({ ...session.user, ...profile }));
      } else {
        setUser(null);
      }
    };

    syncUser();

    // 2. Listen for Auth Changes (Instant reactivity)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncUser();
      } else {
        setUser(null);
        localStorage.removeItem('p2b_user');
      }
    });

    // 3. Theme
    const savedTheme = localStorage.getItem('p2b_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="nav-logo">
          <div className="logo-icon">P2B</div>
          <span>PLAN 2 BUILD</span>
        </Link>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link href="/engineers" className={pathname === '/engineers' ? 'active' : ''}>Find Engineers</Link>
          <Link href="/subscription" className={pathname === '/subscription' ? 'active' : ''}>Pricing</Link>
          <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>Contact</Link>
          
          {user && (
            <Link href={`/dashboard/${user.role}`} className={pathname.includes('dashboard') ? 'active' : ''}>Dashboard</Link>
          )}
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={() => {
             const next = theme === 'dark' ? 'light' : 'dark';
             setTheme(next);
             document.documentElement.setAttribute('data-theme', next);
             localStorage.setItem('p2b_theme', next);
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <Link href="/messages" className="notification-bell" title="Messages">💬</Link>
              <div className="avatar" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} style={{ cursor: 'pointer' }} title={user.name}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              
              {isUserMenuOpen && (
                <div className="user-dropdown" style={{ display: 'block' }}>
                  <div className="user-dropdown-header">
                    <strong>{user.name || 'User'}</strong>
                    <span>{user.role}</span>
                  </div>
                  <Link href={`/dashboard/${user.role}`}>Dashboard</Link>
                  <Link href="/messages">Messages</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
