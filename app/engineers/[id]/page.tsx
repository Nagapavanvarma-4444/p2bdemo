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

  useEffect(() => {
    const stored = localStorage.getItem('p2b_user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      // 🚀 UPDATED CALLS
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
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-card-main">
            <div className="profile-avatar-large">
              {engineer.name?.charAt(0)}
            </div>
            <h1 className="profile-name">{engineer.name}</h1>
            <p className="profile-title">{engineer.category}</p>
            <div className="profile-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-count">({reviews.length} reviews)</span>
            </div>
            <div className="profile-actions">
              <button onClick={handleStartChat} className="btn btn-gold btn-block">Message Engineer</button>
            </div>
          </div>

          <div className="profile-card-info">
             <div className="info-item">
                <span className="label">Location</span>
                <span className="value">{engineer.location || 'Mumbai, IN'}</span>
             </div>
             <div className="info-item">
                <span className="label">Experience</span>
                <span className="value">8+ Years</span>
             </div>
          </div>
        </div>

        <div className="profile-content">
           <div className="profile-section">
              <h3>About the Professional</h3>
              <p>{engineer.bio || `Highly experienced ${engineer.category} dedicated to delivering premium construction and design solutions. Specializing in high-end residential and commercial projects.`}</p>
           </div>

           <div className="profile-section">
              <h3>Client Reviews</h3>
              <div className="reviews-list">
                 {reviews.length === 0 ? (
                   <div style={{ opacity: 0.5, padding: '20px' }}>No reviews yet for this professional.</div>
                 ) : reviews.map((r, i) => (
                   <div key={i} className="review-item">
                      <div className="review-header">
                         <span className="review-author">{r.reviewer_name || 'Verified Client'}</span>
                         <span className="review-stars">★★★★★</span>
                      </div>
                      <p className="review-text">{r.comment}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
