"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'approvals' | 'users' | 'settings'>('stats');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("p2b_user") || "{}");
    if (user.role !== 'admin') {
      router.push("/auth/login");
      return;
    }
    fetchData();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    try {
      const statsRes = await apiCall('/api/admin/stats');
      const usersRes = await apiCall('/api/admin/users');
      setStats(statsRes);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(id: string, approved: boolean) {
    let reason = "";
    if (!approved) {
      reason = prompt("Enter rejection reason:") || "Verification failed";
    }
    try {
      await apiCall('/api/admin/users', {
        method: 'PUT',
        body: { engineer_id: id, approved, reason }
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function toggleMaintenance(current: boolean) {
    try {
      await apiCall('/api/admin/stats', {
        method: 'PUT',
        body: { maintenance_mode: !current }
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <div className="avatar">A</div>
            <div className="sidebar-user-info"><h4>Administrator</h4><p>Super Admin</p></div>
          </div>
          <nav className="sidebar-nav">
            <button className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>📊 Overview</button>
            <button className={`sidebar-link ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>⏳ Approvals ({stats?.stats?.pending_approvals || 0})</button>
            <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
            <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'stats' && (
            <>
              <div className="dashboard-header"><h1>Admin Overview</h1></div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header"><div className="stat-icon gold">👥</div></div>
                  <div className="stat-value">{stats?.stats?.total_users}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header"><div className="stat-icon green">📋</div></div>
                  <div className="stat-value">{stats?.stats?.total_projects}</div>
                  <div className="stat-label">Total Projects</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header"><div className="stat-icon red">⏳</div></div>
                  <div className="stat-value">{stats?.stats?.pending_approvals}</div>
                  <div className="stat-label">Pending Verifications</div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'approvals' && (
            <>
              <div className="dashboard-header"><h1>Engineer Approvals</h1></div>
              <div className="dashboard-card">
                <div className="card-body">
                  {users.filter(u => u.role === 'engineer' && !u.is_approved).length === 0 ? (
                    <div className="empty-state"><h3>No pending approvals</h3></div>
                  ) : users.filter(u => u.role === 'engineer' && !u.is_approved).map(u => (
                    <div key={u.id} className="project-item">
                      <div className="project-info">
                        <h4>{u.name}</h4>
                        <p style={{ fontSize: '0.8rem' }}>{u.email} | {u.category}</p>
                      </div>
                      <div className="proposal-actions">
                        <button className="btn btn-success btn-sm" onClick={() => handleApproval(u.id, true)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleApproval(u.id, false)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="dashboard-header"><h1>User Directory</h1></div>
              <div className="dashboard-card">
                <div className="card-body">
                  {users.map(u => (
                    <div key={u.id} className="project-item">
                      <div className="project-info">
                        <h4>{u.name} <span className={`badge badge-${u.role === 'admin' ? 'red' : u.role === 'engineer' ? 'gold' : 'blue'}`} style={{ fontSize: '0.6rem' }}>{u.role}</span></h4>
                        <p style={{ fontSize: '0.8rem' }}>{u.email}</p>
                      </div>
                      <span className={`badge badge-${u.is_active ? 'green' : 'gray'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="dashboard-header"><h1>System Settings</h1></div>
              <div className="dashboard-card" style={{ padding: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Maintenance Mode</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>If enabled, only admins can log in to the platform.</p>
                  </div>
                  <button 
                    className={`btn ${stats?.settings?.maintenance_mode ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleMaintenance(stats?.settings?.maintenance_mode)}
                  >
                    {stats?.settings?.maintenance_mode ? '🛑 Disable' : '✅ Enable'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
