import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';

export default function SearchBar({ onSearchSubmit, autoFocus = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { filterRules } = useApp();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions based on safe autocomplete
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Generate filtered suggestions
    const safeSuggestions = videoProvider.getAutocompleteSuggestions(query, filterRules);
    setSuggestions(safeSuggestions);
    setIsOpen(safeSuggestions.length > 0);
  }, [query, filterRules]);

  const handleSubmit = e => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsOpen(false);
    if (onSearchSubmit) onSearchSubmit();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectSuggestion = suggestion => {
    setQuery(suggestion);
    setIsOpen(false);
    if (onSearchSubmit) onSearchSubmit();
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center w-full">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder="Search devotional songs, tech, science, or topics..."
            className="w-full h-10 md:h-10 pl-4 pr-10 text-sm md:text-base rounded-l-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-3 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-10 md:h-10 px-5 md:px-6 rounded-r-full bg-neutral-200 dark:bg-neutral-800 border border-l-0 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center shrink-0"
          title="Search"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>

      {/* Filtered Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            Safe Suggestions
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full px-4 py-2 text-left text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
            >
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="truncate">{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
