"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { p2b_api_call } from "@/lib/api"; // 🚀 UPDATED

export default function PostProject() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Civil Engineer",
    budget: "",
    location: "Mumbai",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('p2b_user');
    if (!stored) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🚀 UPDATED CALL
      await p2b_api_call('/api/projects', {
        method: 'POST',
        body: {
          ...formData,
          budget: parseFloat(formData.budget) || 0
        }
      });
      alert("Project posted successfully!");
      router.push('/dashboard/customer');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        <div className="dashboard-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem' }}>Post Your Project</h1>
          <p style={{ opacity: 0.6 }}>Tell us what you need, and expert engineers will reach out to you.</p>
        </div>

        <div className="dashboard-card glass">
          <div className="card-body" style={{ padding: '40px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input type="text" className="form-input" id="title" value={formData.title} onChange={handleChange} placeholder="e.g., Support Wall Construction" required />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" id="category" value={formData.category} onChange={handleChange}>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="Architect">Architect</option>
                    <option value="Interior Designer">Interior Designer</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Budget (INR)</label>
                  <input type="number" className="form-input" id="budget" value={formData.budget} onChange={handleChange} placeholder="e.g., 50000" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" id="location" value={formData.location} onChange={handleChange} placeholder="e.g., Mumbai, Maharashtra" required />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea className="form-input" id="description" rows={6} value={formData.description} onChange={handleChange} placeholder="Describe the project scope, materials needed, and timeline..." required></textarea>
              </div>

              <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={loading}>
                {loading ? 'Posting Project...' : '🚀 Post Project Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
