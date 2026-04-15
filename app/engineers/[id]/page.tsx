"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { p2b_api_call } from "@/lib/api"; // 🚀 UPDATED
import Link from "next/link";

export default function EngineerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [engineer, setEngineer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Sample Past Works (Realistic data for reference)
  const samplePastWorks = [
    { 
      title: "Luxe Penthouse Design", 
      category: "Interior Design", 
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000&auto=format&fit=crop" 
    },
    { 
      title: "Modern Office Complex", 
      category: "Commercial Construction", 
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop" 
    },
    { 
      title: "Eco-Friendly Villa", 
      category: "Residential Plan", 
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop" 
    },
    { 
      title: "Urban Bridge Renovation", 
      category: "Civil Engineering", 
      image: "https://images.unsplash.com/photo-1513233860451-2cc6aa670fa9?q=80&w=1000&auto=format&fit=crop" 
    }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('p2b_user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const engData = await p2b_api_call(`/api/users/${id}`);
      const revData = await p2b_api_call(`/api/reviews?engineer_id=${id}`);
      setEngineer(engData.user);
      setReviews(revData.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartChat = () => {
     if (!user) {
        router.push('/auth/login');
        return;
     }
     router.push(`/messages?user=${id}`);
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (!engineer) return <div className="error-state">Engineer not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-header-banner"></div>
      <div className="profile-container animate-fadeInUp">
        <div className="profile-sidebar">
          <div className="profile-card-main">
            <div className="profile-avatar-large">
              {engineer.avatar ? (
                <img src={engineer.avatar} alt={engineer.name} />
              ) : (
                engineer.name?.charAt(0)
              )}
            </div>
            <h1 className="profile-name">{engineer.name}</h1>
            <p className="profile-title">{engineer.category}</p>
            <div className="profile-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-count">({reviews.length} reviews)</span>
            </div>
            <div className="profile-actions">
              <button onClick={handleStartChat} className="btn btn-primary btn-block">Message Engineer</button>
            </div>
          </div>

          <div className="profile-card-info">
             <div className="info-item">
                <span className="label">Location</span>
                <span className="value">{engineer.location || 'Mumbai, IN'}</span>
             </div>
             <div className="info-item">
                <span className="label">Experience</span>
                <span className="value">{engineer.experience_years || '8+'} Years</span>
             </div>
             <div className="info-item">
                <span className="label">Member Since</span>
                <span className="value">{engineer.created_at ? new Date(engineer.created_at).getFullYear() : '2024'}</span>
             </div>
          </div>
        </div>

        <div className="profile-content">
           <div className="profile-section">
              <h3><span>👤</span> About the Professional</h3>
              <p style={{ lineHeight: '1.8', opacity: 0.9 }}>{engineer.bio || `Highly experienced ${engineer.category} dedicated to delivering premium construction and design solutions. Specializing in high-end residential and commercial projects with a focus on quality, safety, and modern aesthetics.`}</p>
           </div>

           <div className="profile-section">
              <h3><span>🏗️</span> Past Works & Portfolio</h3>
              <div className="past-works-grid">
                 {samplePastWorks.map((work: any, i: number) => (
                   <div key={i} className="work-item">
                      <div className="work-image">
                        {work.image.startsWith('http') ? (
                          <img src={work.image} alt={work.title} />
                        ) : (
                          work.image
                        )}
                      </div>
                      <div className="work-info">
                         <h4>{work.title}</h4>
                         <p>{work.category}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="profile-section">
              <h3><span>⭐</span> Client Reviews</h3>
              <div className="reviews-list">
                 {reviews.length === 0 ? (
                   <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center' }}>
                     <p>No reviews yet for this professional.</p>
                     <small>Be the first to work with them and leave a review!</small>
                   </div>
                 ) : reviews.map((r, i) => (
                   <div key={i} className="review-item">
                      <div className="review-header">
                         <span className="review-author">{r.reviewer_name || 'Verified Client'}</span>
                         <span className="review-stars">{"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}</span>
                      </div>
                      <p className="review-text">{r.comment}</p>
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>{new Date(r.created_at).toLocaleDateString()}</small>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

