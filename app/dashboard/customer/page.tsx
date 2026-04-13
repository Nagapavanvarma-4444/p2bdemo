"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { p2b_api_call } from "@/lib/api";

type Tab = 'overview' | 'projects' | 'proposals' | 'notifications' | 'profile';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("p2b_user");
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }
    const userData = JSON.parse(storedUser);
    if (userData.role !== 'customer') {
      router.push("/dashboard/engineer");
      return;
    }
    setUser(userData);
    setLoading(false);
  }, [router]);

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <div className="avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="sidebar-user-info">
              <h4>{user?.name || 'Customer'}</h4>
              <p>Verified Account</p>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <span className="icon">📊</span> Overview
            </button>
            <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              <span className="icon">👤</span> My Profile
            </button>
            <button className={`sidebar-link ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
              <span className="icon">📋</span> My Projects
            </button>
            <button className={`sidebar-link ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => setActiveTab('proposals')}>
              <span className="icon">📨</span> Proposals
            </button>
            <button className={`sidebar-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              <span className="icon">🔔</span> Notifications
            </button>
            <Link href="/messages" className="sidebar-link">
              <span className="icon">💬</span> Messages
            </Link>
            <Link href="/post-project" className="sidebar-link">
              <span className="icon">➕</span> Post Project
            </Link>
          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'proposals' && <ProposalsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'profile' && <ProfileTab user={user} />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const [projectsRes, notifsRes] = await Promise.all([
          p2b_api_call('/projects/my'),
          p2b_api_call('/api/notifications?limit=5').catch(() => ({ notifications: [] }))
        ]);
        setData({ projects: projectsRes.projects, notifications: notifsRes.notifications });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) return <div className="spinner"></div>;

  const projects = data?.projects || [];
  const activeCount = projects.filter((p: any) => p.status === 'open' || p.status === 'in_progress').length;
  const completedCount = projects.filter((p: any) => p.status === 'completed').length;

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Welcome back!</h1>
          <p className="subtitle">Here's what's happening with your projects</p>
        </div>
        <Link href="/post-project" className="btn btn-primary">➕ Post New Project</Link>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon gold">📋</div></div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon green">🟢</div></div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon blue">✅</div></div>
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon red">🔔</div></div>
          <div className="stat-value">{data?.notifications?.filter((n: any) => !n.read).length || 0}</div>
          <div className="stat-label">Notifications</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        <div className="dashboard-card">
          <div className="card-header"><h3>Recent Projects</h3></div>
          <div className="card-body">
            {projects.length === 0 ? (
              <div className="empty-state"><p>No projects yet. <Link href="/post-project">Post one now!</Link></p></div>
            ) : projects.slice(0, 4).map((p: any) => (
              <div key={p.id} className="project-item">
                <div className="project-info">
                  <h4>{p.title}</h4>
                  <div className="project-meta"><span>📍 {p.location}</span></div>
                </div>
                <span className={`badge badge-${p.status === 'open' ? 'green' : p.status === 'in_progress' ? 'blue' : 'gray'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-header"><h3>Notifications</h3></div>
          <div className="card-body">
            {(!data?.notifications || data.notifications.length === 0) ? (
              <div className="empty-state"><p>No notifications</p></div>
            ) : data.notifications.map((n: any) => (
              <div key={n.id} className="project-item" style={{ opacity: n.read ? 0.6 : 1 }}>
                <div className="project-info">
                  <h4 style={{ fontSize: '0.9rem' }}>{n.message}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    p2b_api_call('/projects/my').then(res => {
      setProjects(res.projects || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner"></div>;

  return (
    <>
      <div className="dashboard-header">
        <div><h1>My Projects</h1><p className="subtitle">{projects.length} projects</p></div>
        <Link href="/post-project" className="btn btn-primary">➕ New Project</Link>
      </div>
      <div className="dashboard-card">
        <div className="card-body">
          {projects.length === 0 ? (
            <div className="empty-state"><h3>No projects yet</h3><Link href="/post-project" className="btn btn-primary mt-3">Post Project</Link></div>
          ) : projects.map((p: any) => (
            <div key={p.id} className="project-item">
              <div className="project-info">
                <h4>{p.title}</h4>
                <div className="project-meta">
                  <span>📍 {p.location}</span>
                  <span>🏷️ {p.category}</span>
                </div>
              </div>
              <span className={`badge badge-${p.status === 'open' ? 'green' : p.status === 'in_progress' ? 'blue' : 'gray'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProposalsTab() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllProposals() {
      try {
        const res = await p2b_api_call('/proposals');
        // Map data to match the UI expectations
        const formatted = (res.proposals || []).map((p: any) => ({
          ...p,
          projectTitle: p.project?.title || 'Unknown Project'
        }));
        setProposals(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllProposals();
  }, []);

  const handleProposal = async (id: string, status: string) => {
    try {
      await p2b_api_call(`/proposals/${id}`, { method: 'PUT', body: { status } });
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <>
      <div className="dashboard-header"><div><h1>Proposals</h1><p className="subtitle">Manage received offers</p></div></div>
      <div className="dashboard-card">
        <div className="card-body">
          {proposals.length === 0 ? (
            <div className="empty-state"><h3>No proposals received</h3></div>
          ) : proposals.map((prop: any) => (
            <div key={prop.id} className="proposal-item">
              <div className="proposal-content">
                <h4>{prop.engineer?.name} → {prop.projectTitle}</h4>
                <p>{prop.cover_letter?.substring(0, 150)}...</p>
                <div className="project-meta">
                  <span>💰 ₹{prop.price}</span>
                  <span>⏰ {prop.timeline}</span>
                </div>
              </div>
              <div className="proposal-actions">
                {prop.status === 'pending' ? (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => handleProposal(prop.id, 'accepted')}>Accept</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleProposal(prop.id, 'rejected')}>Reject</button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge badge-${prop.status === 'accepted' ? 'green' : 'red'}`}>{prop.status}</span>
                    {prop.status === 'accepted' && (
                       <Link href={`/messages?user=${prop.engineer_id}`} className="btn btn-primary btn-sm">💬 Message</Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function NotificationsTab() {
  return <div className="empty-state"><h3>No recent notifications</h3></div>;
}

function ProfileTab({ user }: any) {
  return (
    <form className="dashboard-card" style={{ padding: 'var(--space-2xl)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" defaultValue={user.name} /></div>
        <div className="form-group"><label className="form-label">Phone</label><input type="text" className="form-input" defaultValue={user.phone} /></div>
      </div>
      <div className="form-group"><label className="form-label">Location</label><input type="text" className="form-input" defaultValue={user.location} /></div>
      <button type="button" className="btn btn-primary mt-4">Save Changes</button>
    </form>
  );
}
