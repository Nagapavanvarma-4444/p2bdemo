"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { p2b_api_call } from "@/lib/api";

type Tab = 'overview' | 'projects' | 'proposals' | 'reviews' | 'profile';

export default function EngineerDashboard() {
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
    if (userData.role !== 'engineer') {
      router.push("/dashboard/customer");
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
                <img src={user.avatar} alt={user?.name || 'Engineer'} />
              ) : (
                (user?.name || 'E').charAt(0).toUpperCase()
              )}
            </div>
            <div className="sidebar-user-info">
              <h4>{user?.name || 'Engineer'}</h4>
              <p>{user?.category || 'Professional'}</p>
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
              <span className="icon">🔍</span> Browse Projects
            </button>
            <button className={`sidebar-link ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => setActiveTab('proposals')}>
              <span className="icon">📑</span> My Proposals
            </button>
            <button className={`sidebar-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              <span className="icon">⭐</span> Reviews
            </button>
            <Link href="/messages" className="sidebar-link"><span className="icon">💬</span> Messages</Link>
            <Link href="/subscription" className="sidebar-link"><span className="icon">💎</span> Subscription</Link>
          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'projects' && <BrowseProjectsTab />}
          {activeTab === 'proposals' && <ProposalsTab />}
          {activeTab === 'profile' && <ProfileTab user={user} />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ user }: any) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    p2b_api_call('/proposals')
      .then(res => {
        setProposals(res.proposals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner"></div>;

  const accepted = proposals.filter((p: any) => p.status === 'accepted').length;
  const pending = proposals.filter((p: any) => p.status === 'pending').length;

  return (
    <>
      <div className="dashboard-header">
        <div><h1>Engineer Dashboard</h1><p className="subtitle">Manage your portfolio and active proposals</p></div>
      </div>

      {!user.is_verified && (
        <div className="dashboard-card" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--gold)', background: 'rgba(212,175,55,0.05)' }}>
          <div className="card-body">
            <h3 style={{ color: 'var(--gold)', margin: 0 }}>Verification Pending</h3>
            <p style={{ marginTop: '5px', fontSize: '0.9rem' }}>The admin team is reviewing your documents. Once verified, you'll get a professional badge.</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon gold">📑</div></div>
          <div className="stat-value">{proposals.length}</div>
          <div className="stat-label">Total Proposals</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon green">✅</div></div>
          <div className="stat-value">{accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon blue">⏳</div></div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon gold">⭐</div></div>
          <div className="stat-value">{user.average_rating || '5.0'}</div>
          <div className="stat-label">Rating</div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header"><h3>Recent Activity</h3></div>
        <div className="card-body">
          {proposals.length === 0 ? (
            <div className="empty-state"><p>No proposals sent yet. Start browsing projects to find work!</p></div>
          ) : proposals.slice(0, 5).map((p: any) => (
            <div key={p.id} className="project-item">
              <div className="project-info">
                <h4>{p.project?.title || 'Project'}</h4>
                <div className="project-meta"><span>💰 ₹{p.price}</span></div>
              </div>
              <span className={`badge badge-${p.status === 'accepted' ? 'green' : p.status === 'pending' ? 'blue' : 'red'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BrowseProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [proposalForm, setProposalForm] = useState({ price: '', timeline: '', cover: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    p2b_api_call('/projects').then(res => {
      setProjects(res.projects || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);

    try {
      await p2b_api_call('/proposals', {
        method: 'POST',
        body: { 
          project_id: selectedProject.id, 
          price: parseInt(proposalForm.price), 
          timeline: proposalForm.timeline, 
          cover_letter: proposalForm.cover 
        }
      });
      alert("Proposal submitted successfully!");
      setSelectedProject(null);
      setProposalForm({ price: '', timeline: '', cover: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <>
      <div className="dashboard-header text-center">
        <div><h1>Open Projects</h1><p className="subtitle">{projects.length} available opportunities</p></div>
      </div>
      
      <div className="projects-grid mt-4">
        {projects.length === 0 ? (
          <div className="empty-state"><h3>No projects found</h3></div>
        ) : projects.map((p: any) => (
          <div key={p.id} className="project-card-premium">
            <span className="category-tag">{p.category}</span>
            <h4>{p.title}</h4>
            <p>{p.description.substring(0, 120)}...</p>
            <div className="project-footer">
              <div className="meta">
                <span>📍 {p.location}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedProject(p)}>Submit Bid</button>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content-3d" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Proposal</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project: {selectedProject.title}</p>
            </div>
            <form className="modal-form" onSubmit={handleProposalSubmit}>
              <div className="form-group">
                <label className="form-label">Your Bid Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={proposalForm.price} 
                  onChange={e => setProposalForm({...proposalForm, price: e.target.value})}
                  placeholder="e.g. 50000" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Timeline</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={proposalForm.timeline} 
                  onChange={e => setProposalForm({...proposalForm, timeline: e.target.value})}
                  placeholder="e.g. 3 Weeks" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cover Letter / Approach</label>
                <textarea 
                  className="form-textarea" 
                  rows={4} 
                  value={proposalForm.cover} 
                  onChange={e => setProposalForm({...proposalForm, cover: e.target.value})}
                  placeholder="Describe how you will execute this project..." 
                  required
                ></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProject(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ProposalsTab() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    p2b_api_call('/proposals').then(res => {
      setProposals(res.proposals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner"></div>;

  return (
    <>
      <div className="dashboard-header"><div><h1>My Submitted Proposals</h1></div></div>
      <div className="dashboard-card">
        <div className="card-body">
          {proposals.length === 0 ? (
            <div className="empty-state"><h3>You haven't sent any proposals</h3></div>
          ) : proposals.map((p: any) => (
            <div key={p.id} className="proposal-item">
              <div className="proposal-content">
                <h4>{p.project?.title}</h4>
                <p>{p.cover_letter?.substring(0, 100)}...</p>
                <div className="project-meta"><span>💰 ₹{p.price}</span><span>⏰ {p.timeline}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge badge-${p.status === 'accepted' ? 'green' : p.status === 'pending' ? 'blue' : 'red'}`}>{p.status}</span>
                {p.status === 'accepted' && (
                  <Link href={`/messages?user=${p.project?.customer_id}`} className="btn btn-primary btn-sm">💬 Chat</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProfileTab({ user }: any) {
  return (
    <div className="dashboard-card" style={{ padding: 'var(--space-2xl)' }}>
      <h3>Portfolio Details</h3>
      <p className="subtitle">This info is visible to customers when you send proposals.</p>
      <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="form-group"><label className="form-label">Professional Category</label><input type="text" className="form-input" defaultValue={user.category} disabled /></div>
        <div className="form-group"><label className="form-label">Years of Experience</label><input type="number" className="form-input" defaultValue={user.experience_years} /></div>
      </div>
      <div className="form-group"><label className="form-label">Bio / Expertise</label><textarea className="form-textarea" rows={4} defaultValue={user.bio}></textarea></div>
      <button className="btn btn-primary mt-4">Update Portfolio</button>
    </div>
  );
}
