"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";

export default function PostProject() {
  const [formData, setFormData] = useState({
    title: "",
    category: "Architecture",
    location: "",
    budget_min: "",
    budget_max: "",
    timeline: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("p2b_user") || "{}");
    if (user.role !== 'customer') router.push("/auth/login");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/api/projects', {
        method: 'POST',
        body: {
          ...formData,
          budget_min: parseInt(formData.budget_min),
          budget_max: parseInt(formData.budget_max)
        }
      });
      router.push("/dashboard/customer");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'var(--navy-dark)', minHeight: '100vh', padding: 'var(--space-4xl) 0' }}>
      <div className="auth-container" style={{ maxWidth: '800px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h1>Post a New Project</h1>
            <p className="subtitle">Tell experts what you need and get professional proposals.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input 
                type="text" className="form-input" placeholder="e.g. Modern Residential Villa Design" required 
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Architecture</option>
                  <option>Civil Engineering</option>
                  <option>Interior Design</option>
                  <option>Structural Analysis</option>
                  <option>Landscape Design</option>
                  <option>Construction</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text" className="form-input" placeholder="e.g. Hyderabad, Telangana" required 
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Min Budget (₹)</label>
                <input 
                  type="number" className="form-input" placeholder="Min" 
                  value={formData.budget_min} onChange={e => setFormData({...formData, budget_min: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Budget (₹)</label>
                <input 
                  type="number" className="form-input" placeholder="Max" 
                  value={formData.budget_max} onChange={e => setFormData({...formData, budget_max: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Timeline</label>
              <input 
                type="text" className="form-input" placeholder="e.g. 2 months" 
                value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea 
                className="form-textarea" rows={6} placeholder="Provide details about your site, style preferences, and specific requirements..." required 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? "Posting..." : "🚀 Post Project Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
