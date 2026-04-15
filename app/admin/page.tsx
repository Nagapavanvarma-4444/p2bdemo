"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { p2b_api_call } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'approvals' | 'users' | 'settings'>('stats');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
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
      const t = Date.now();
      const statsRes = await p2b_api_call(`/api/admin/stats?t=${t}`);
      const usersRes = await p2b_api_call(`/api/admin/users?t=${t}`);
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
      await p2b_api_call('/api/admin/users', {
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
      const res = await p2b_api_call('/api/admin/stats', {
        method: 'PUT',
        body: { maintenance_mode: !current }
      });
      alert(res.message || "Maintenance status updated!");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function processApproval(id: string, approved: boolean, reason?: string) {
    setProcessing(true);
    try {
      const res = await p2b_api_call('/api/admin/users', {
        method: 'PUT',
        body: { engineer_id: id, approved, reason }
      });
      alert(res.message || `Engineer ${approved ? 'approved' : 'rejected'}`);
      setSelectedUser(null);
      setRejectionReason("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      {stats?.settings?.maintenance_mode && (
        <div className="status-banner" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          ⚠️ SYSTEM IS CURRENTLY IN MAINTENANCE MODE
        </div>
      )}
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

              {/* Prominent Maintenance Control section */}
              <div className="dashboard-card" style={{ 
                marginTop: 'var(--space-xl)', 
                padding: 'var(--space-xl)',
                background: stats?.settings?.maintenance_mode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                border: `2px solid ${stats?.settings?.maintenance_mode ? '#ef4444' : '#22c55e'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ margin: 0, color: stats?.settings?.maintenance_mode ? '#991b1b' : '#14532d' }}>
                      {stats?.settings?.maintenance_mode ? '🔒 System is in Maintenance Mode' : '✅ System is Live'}
                    </h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {stats?.settings?.maintenance_mode 
                        ? "Only administrators can login. Regular users are currently see an 'Under Construction' message." 
                        : "Regular users and engineers can login and use the platform normally."}
                    </p>
                  </div>
                  <button 
                    className={`btn ${stats?.settings?.maintenance_mode ? 'btn-danger' : 'btn-success'}`}
                    style={{ minWidth: '200px', fontWeight: 'bold' }}
                    onClick={() => {
                        if (confirm(`Are you sure you want to ${stats?.settings?.maintenance_mode ? 'TURN OFF' : 'TURN ON'} maintenance mode?`)) {
                            toggleMaintenance(stats?.settings?.maintenance_mode);
                        }
                    }}
                  >
                    {stats?.settings?.maintenance_mode ? '🟢 Turn OFF Maintenance' : '🔴 Put in Maintenance'}
                  </button>
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
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          console.log('Selecting user for review:', u);
                          setSelectedUser(u);
                        }}>🛡️ Review & Badge</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Review Modal (React Component) */}
              {selectedUser && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                    <div className="modal-header">
                        <h2>Engineer Verification Review</h2>
                        <button className="close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h3>Professional Info</h3>
                                <p><strong>Name:</strong> {selectedUser.name}</p>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Category:</strong> {selectedUser.category}</p>
                                <p><strong>Experience:</strong> {selectedUser.experience_years || 0} Years</p>
                                <p><strong>Location:</strong> {selectedUser.location || 'Not provided'}</p>
                            </div>
                            <div>
                                <h3>Bio</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>{selectedUser.bio || 'No bio provided.'}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <h3>Uploaded Documents</h3>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                {(() => {
                                    let certs = selectedUser.certifications;
                                    if (typeof certs === 'string') {
                                        try { certs = JSON.parse(certs); } catch (e) { certs = []; }
                                    }
                                    return certs && Array.isArray(certs) && certs.length > 0 ? (
                                        certs.map((c: string, i: number) => (
                                            <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="badge badge-blue" style={{ margin: '5px', display: 'inline-block' }}>
                                                📄 Certificate {i+1}
                                            </a>
                                        ))
                                    ) : (
                                        <p>No certificates uploaded.</p>
                                    );
                                })()}
                            </div>
                        </div>
                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Rejection Reason (if applicable)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. Documents are unclear" 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn btn-success" 
                                disabled={processing}
                                onClick={() => {
                                    if(confirm('Approve this engineer? This will grant them the Verified badge.')) {
                                        processApproval(selectedUser.id, true);
                                    }
                                }}
                            >
                                {processing ? 'Processing...' : 'Approve & Verify'}
                            </button>
                            <button 
                                className="btn btn-danger" 
                                disabled={processing}
                                onClick={() => {
                                    if(!rejectionReason) return alert('Please enter a rejection reason.');
                                    processApproval(selectedUser.id, false, rejectionReason);
                                }}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
              )}
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
                        <h4>
                            {u.name} 
                            <span className={`badge badge-${u.role === 'admin' ? 'red' : u.role === 'engineer' ? 'gold' : 'blue'}`} style={{ fontSize: '0.6rem', marginLeft: '8px' }}>{u.role}</span>
                            {u.is_verified && <span className="badge badge-green" style={{ fontSize: '0.6rem', marginLeft: '5px' }}>Verified</span>}
                        </h4>
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
