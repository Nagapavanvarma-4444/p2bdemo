'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { p2b_api_call } from '@/lib/api'; // 🚀 UPDATED
import EngineerCard from '@/components/Engineers/EngineerCard';

function EngineersContent() {
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetchEngineers();
  }, [categoryFilter]);

  async function fetchEngineers() {
    setLoading(true);
    try {
      // 🚀 UPDATED CALL
      const data = await p2b_api_call('/api/engineers');
      let filtered = data.engineers || [];
      
      if (categoryFilter) {
        filtered = filtered.filter((eng: any) => 
          eng.category?.toLowerCase() === categoryFilter.toLowerCase()
        );
      }
      
      setEngineers(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="engineers-feed">
      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : (
        <div className="engineers-grid">
           {engineers.map((eng, i) => (
             <EngineerCard key={eng.id || i} eng={eng} />
           ))}
        </div>
      )}
    </div>
  );
}

export default function FindEngineers() {
  return (
    <div className="feed-page">
      <div className="hero-section mini">
        <div className="container">
          <h1>Find Expert Engineers</h1>
          <p>Browse through our verified construction professionals.</p>
        </div>
      </div>
      <div className="container py-xl">
        <Suspense fallback={<div>Loading...</div>}>
          <EngineersContent />
        </Suspense>
      </div>
    </div>
  );
}
