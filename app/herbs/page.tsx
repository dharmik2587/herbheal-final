'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import HerbCard from '@/components/HerbCard';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDosha, setSelectedDosha] = useState<string>('All');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');

  useEffect(() => {
    async function fetchHerbs() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/herbs?limit=250');
        const json = await res.json();
        setHerbs(json?.data || []);
      } catch (err) {
        console.error('Failed to fetch herbs catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHerbs();
  }, []);

  const filteredHerbs = useMemo(() => {
    return herbs.filter((herb) => {
      const matchQuery =
        !searchTerm ||
        herb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (herb.scientificName && herb.scientificName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (herb.description && herb.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDosha =
        selectedDosha === 'All' ||
        (herb.doshas && Array.isArray(herb.doshas) && herb.doshas.some((d: string) => d.toLowerCase() === selectedDosha.toLowerCase()));

      const matchSymptom =
        !selectedSymptom ||
        (herb.symptoms && Array.isArray(herb.symptoms) && herb.symptoms.some((s: any) => s.symptom?.name?.toLowerCase().includes(selectedSymptom.toLowerCase())));

      return matchQuery && matchDosha && matchSymptom;
    });
  }, [herbs, searchTerm, selectedDosha, selectedSymptom]);

  return (
    <div className="page-herbs" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <section className="hero hero-compact hero-glow">
        <h1 className="hero-title">
          <span className="hero-title-icon">🌿</span>
          <span className="hero-title-text">Ayurvedic Herbs Catalog</span>
        </h1>
        <p className="hero-subtitle">
          Explore our complete catalog of {herbs.length > 0 ? herbs.length : '200+'} medicinal plants, complete with Ayurvedic properties, dosha alignments, and symptom applications.
        </p>
      </section>

      <div className="container">
        {/* Search & Filter Bar */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Search Herbs
              </label>
              <input
                type="text"
                placeholder="Search by name, scientific name, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Filter by Dosha
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', 'Vata', 'Pitta', 'Kapha'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDosha(d)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${selectedDosha === d ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      backgroundColor: selectedDosha === d ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-secondary)',
                      color: selectedDosha === d ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedSymptom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span>Filtering by symptom: <strong>{selectedSymptom}</strong></span>
              <button
                onClick={() => setSelectedSymptom('')}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700 }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            {filteredHerbs.length} {filteredHerbs.length === 1 ? 'Herb' : 'Herbs'} Available
          </h2>
        </div>

        {/* Skeleton Loader during fetch */}
        {isLoading ? (
          <SkeletonLoader count={6} type="card" />
        ) : filteredHerbs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🌿</span>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No Herbs Found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or dosha filter.</p>
          </div>
        ) : (
          <div className="herb-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredHerbs.map((herb) => (
              <HerbCard key={herb.id} herb={herb} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
