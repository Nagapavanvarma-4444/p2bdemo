"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { p2b_api_call } from "@/lib/api";
import Image from "next/image";

export default function PostProject() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Civil Engineer",
    budget: "",
    location: "Mumbai",
  });
  const [file, setFile] = useState<File | null>(null);
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
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('budget', formData.budget);
      fd.append('location', formData.location);
      if (file) {
        fd.append('attachment', file);
      }

      await p2b_api_call('/api/projects', {
        method: 'POST',
        body: fd
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
    <div className="dashboard-page animate-fadeIn">
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '100px' }}>
        
        <div className="text-center mb-5 animate-fadeInUp">
            <div className="section-heading" style={{ marginBottom: '0' }}>
                <span className="label">New Project</span>
                <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 850, marginBottom: '15px' }}>
                  Post Your <span className="text-gold">Project</span>
                </h1>
                <p style={{ maxWidth: '750px', margin: '0 auto', fontSize: '1.1rem', opacity: 0.8 }}>
                  Tell us what you need, and expert engineers from our vetted network will reach out to you with professional proposals.
                </p>
            </div>
        </div>

        <div className="grid animate-fadeInUp delay-2" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Left Column: Info & Visual */}
          <div className="flex-col gap-lg" style={{ position: 'sticky', top: '100px' }}>
            <div className="card-glass" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(212, 168, 67, 0.2)' }}>
                <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                    <Image 
                        src="/img/post_project_visual.png" 
                        alt="Project Visual" 
                        fill 
                        style={{ objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--navy-dark), transparent)' }}></div>
                </div>
                <div style={{ padding: 'var(--space-xl)', marginTop: '-80px', position: 'relative', zIndex: 1 }}>
                    <h3 className="text-gold mb-3" style={{ fontSize: '1.5rem' }}>Professional Standards</h3>
                    <div className="flex-col gap-md">
                        <div className="flex gap-md">
                            <div className="badge-gold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '1.2rem' }}>👷</div>
                            <div>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Vetted Engineers</h4>
                                <p className="text-muted small">Every proposal comes from a verified construction professional.</p>
                            </div>
                        </div>
                        <div className="flex gap-md">
                            <div className="badge-gold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '1.2rem' }}>💰</div>
                            <div>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Transparent Budgeting</h4>
                                <p className="text-muted small">Receive competitive bids tailored to your specific project needs.</p>
                            </div>
                        </div>
                        <div className="flex gap-md">
                            <div className="badge-gold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '1.2rem' }}>⚡</div>
                            <div>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Rapid Response</h4>
                                <p className="text-muted small">Engineers typically respond within 24 hours of project posting.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ padding: 'var(--space-lg)' }}>
              <p className="small text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                Your project details are secure. Only authorized engineers can view your attachment and contact info.
              </p>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="card-glass" style={{ padding: 'var(--space-2xl)', background: 'rgba(10, 22, 40, 0.7)' }}>
            <h2 className="mb-4" style={{ fontSize: '1.8rem' }}>Project Specifications</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>PROJECT TITLE</label>
                <input 
                    type="text" 
                    className="form-input" 
                    id="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g., Structural Analysis for G+2 Residential Building" 
                    required 
                    style={{ fontSize: '1.1rem', padding: '15px 20px' }}
                />
              </div>

              <div className="grid grid-2 gap-lg mb-4">
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>CATEGORY</label>
                  <select className="form-select" id="category" value={formData.category} onChange={handleChange} style={{ height: '54px' }}>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="Architect">Architect</option>
                    <option value="Interior Designer">Interior Designer</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Structural Engineer">Structural Engineer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>ESTIMATED BUDGET (INR)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    id="budget" 
                    value={formData.budget} 
                    onChange={handleChange} 
                    placeholder="e.g., 75000" 
                    required 
                    style={{ height: '54px' }}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>PROJECT LOCATION</label>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        className="form-input" 
                        id="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        placeholder="City, State" 
                        required 
                        style={{ height: '54px', paddingLeft: '45px' }}
                    />
                    <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>📍</span>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>DETAILED DESCRIPTION</label>
                <textarea 
                    className="form-input" 
                    id="description" 
                    rows={8} 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Provide a comprehensive description of the project scope, required materials, site dimensions, and any specific constraints..." 
                    required
                    style={{ padding: '20px', lineHeight: '1.6' }}
                ></textarea>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>REFERENCE DOCUMENT / ARCHITECTURE PLAN (OPTIONAL)</label>
                <div className="file-upload-container" style={{ 
                  border: '2px dashed rgba(212, 168, 67, 0.3)', 
                  borderRadius: '12px', 
                  padding: '30px', 
                  textAlign: 'center',
                  background: 'rgba(212, 168, 67, 0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }} onClick={() => document.getElementById('attachment')?.click()}>
                  <input 
                    type="file" 
                    id="attachment" 
                    hidden 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
                  {file ? (
                    <div className="text-gold" style={{ fontWeight: '600' }}>
                      Selected: {file.name}
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                      >✕</button>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: '500' }}>Click to upload any document (PDF, Images, etc.)</p>
                      <p className="text-muted small" style={{ marginTop: '5px' }}>Show engineers the type of architecture you want</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ height: '60px', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {loading ? (
                    <>
                        <span className="spinner-sm"></span> Processing your request...
                    </>
                    ) : (
                    <>🚀 Submit Project for Review</>
                    )}
                </button>
                <div className="text-center mt-3">
                  <span className="text-muted small">All projects are reviewed by our moderation team for quality assurance.</span>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
