'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query);
    else params.delete('q');
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="search-bar" id="search-form">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search herbs by name, benefits, or properties..."
          className="search-input"
          id="search-input"
        />
      </div>
      <button type="submit" className="btn-primary" id="search-submit">
        Search
      </button>
    </form>
  );
}
