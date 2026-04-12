"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import Link from "next/link";

export default function EngineerProfile() {
  const { id } = useParams();
  const [engineer, setEngineer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const engData = await apiCall(`/api/users/${id}`);
      const revData = await apiCall(`/api/reviews?engineer_id=${id}`);
      setEngineer(engData.user);
      setReviews(revData.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (!engineer) return <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}><h1>Engineer not found</h1></div>;

  return (
    <div className="dashboard-page" style={{ paddingTop: '100px' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-2xl)' }}>
          {/* Sidebar Info */}
          <aside>
            <div className="dashboard-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <div className="avatar" style={{ width: '120px', height: '120px', margin: '0 auto var(--space-lg)' }}>
                {engineer.avatar_url ? <img src={engineer.avatar_url} /> : engineer.name.charAt(0)}
              </div>
              <h2 style={{ margin: 0 }}>{engineer.name}</h2>
              <p style={{ color: 'var(--gold)', fontWeight: 600 }}>{engineer.category}</p>
              <div style={{ marginTop: '10px', fontSize: '1.2rem' }}>⭐ {engineer.average_rating || '5.0'}</div>
              {engineer.is_verified && <div className="badge badge-gold" style={{ marginTop: '10px' }}>✓ Verified Pro</div>}
              
              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href={`/messages?to=${engineer.id}`} className="btn btn-primary btn-block">Send Message</Link>
                <button className="btn btn-secondary btn-block">Share Profile</button>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
              <h4>Stats</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Experience</span>
                <strong>{engineer.experience_years || 0} Years</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Location</span>
                <strong>{engineer.location || 'Remote'}</strong>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <div className="dashboard-card" style={{ padding: 'var(--space-2xl)' }}>
              <h3 style={{ marginTop: 0 }}>About Me</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{engineer.bio || 'This engineer hasn\'t added a bio yet.'}</p>
            </div>

            <div className="dashboard-header" style={{ marginTop: 'var(--space-2xl)' }}>
              <h3>Customer Reviews ({reviews.length})</h3>
            </div>
            {reviews.length === 0 ? (
              <div className="empty-state">No reviews yet</div>
            ) : reviews.map(r => (
              <div key={r.id} className="dashboard-card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{r.customer?.name}</strong>
                  <span style={{ color: 'var(--gold)' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.comment}</p>
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
