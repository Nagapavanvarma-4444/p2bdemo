'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import EngineerCard from '@/components/Engineers/EngineerCard';

function EngineersContent() {
  const searchParams = useSearchParams();
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    location: '',
    sort: '',
    minRating: 0,
    verifiedOnly: false,
  });

  const loadEngineers = async (page = 1) => {
    setLoading(true);
    setCurrentPage(page);
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '12');

    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.minRating) params.set('min_rating', filters.minRating.toString());
    if (filters.verifiedOnly) params.set('verified', 'true');

    try {
      const data = await apiCall(`/engineers?${params.toString()}`);
      setEngineers(data.engineers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error loading engineers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.id.replace('filter-', '').replace('sort-', 'sort')]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      sort: '',
      minRating: 0,
      verifiedOnly: false,
    });
  };

  return (
    <div className="engineers-page">
      <div className="container">
        <div className="section-heading" style={{ textAlign: 'left', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '2rem' }}>Find Engineers & Professionals</h2>
          <p style={{ margin: 0 }}>Browse verified professionals across all construction disciplines</p>
        </div>

        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="form-input" 
              id="filter-search" 
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, specialty, or location..." 
            />
          </div>
          <select 
            className="form-select" 
            id="sort-select" 
            style={{ maxWidth: '200px' }}
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="">Sort By</option>
            <option value="rating">Highest Rating</option>
            <option value="experience">Most Experience</option>
            <option value="projects">Most Projects</option>
          </select>
        </div>

        <div className="engineers-layout">
          <div className="filter-sidebar">
            <h3>Filters <button className="btn btn-sm btn-outline" onClick={clearFilters}>Clear</button></h3>
            <div className="filter-group">
              <label>Category</label>
              <select 
                className="form-select" 
                id="filter-category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="Civil Engineer">Civil Engineer</option>
                <option value="Electrical Engineer">Electrical Engineer</option>
                <option value="Architect">Architect</option>
                <option value="Interior Designer">Interior Designer</option>
                <option value="Exterior Designer">Exterior Designer</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Location</label>
              <input 
                type="text" 
                className="form-input" 
                id="filter-location" 
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Mumbai" 
              />
            </div>
            <div className="filter-group">
              <label>Min Rating</label>
              <div className="filter-chips">
                <button className={`filter-chip ${filters.minRating === 0 ? 'active' : ''}`} onClick={() => setFilters({ ...filters, minRating: 0 })}>All</button>
                <button className={`filter-chip ${filters.minRating === 3 ? 'active' : ''}`} onClick={() => setFilters({ ...filters, minRating: 3 })}>3+</button>
                <button className={`filter-chip ${filters.minRating === 4 ? 'active' : ''}`} onClick={() => setFilters({ ...filters, minRating: 4 })}>4+</button>
                <button className={`filter-chip ${filters.minRating === 4.5 ? 'active' : ''}`} onClick={() => setFilters({ ...filters, minRating: 4.5 })}>4.5+</button>
              </div>
            </div>
            <div className="filter-group">
              <label>Verification</label>
              <div className="filter-chips">
                <button className={`filter-chip ${!filters.verifiedOnly ? 'active' : ''}`} onClick={() => setFilters({ ...filters, verifiedOnly: false })}>All</button>
                <button className={`filter-chip ${filters.verifiedOnly ? 'active' : ''}`} onClick={() => setFilters({ ...filters, verifiedOnly: true })}>Verified Only</button>
              </div>
            </div>
          </div>

          <div>
            <div id="engineers-count" style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {loading ? 'Searching...' : `${total} professionals found`}
            </div>
            
            <div className="engineers-grid">
              {loading ? (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="spinner" style={{ margin: '0 auto var(--space-lg)' }}></div>
                  <p>Loading engineers...</p>
                </div>
              ) : engineers.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="icon">🔍</div>
                  <h3>No engineers found</h3>
                  <p>Try adjusting your filters</p>
                </div>
              ) : (
                engineers.map(eng => <EngineerCard key={eng.id} eng={eng} />)
              )}
            </div>
            
            {/* Pagination placeholder */}
            {total > 12 && (
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => loadEngineers(currentPage - 1)}>← Prev</button>
                <button className="active">{currentPage}</button>
                <button disabled={currentPage * 12 >= total} onClick={() => loadEngineers(currentPage + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EngineersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EngineersContent />
    </Suspense>
  );
}
