import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Settings,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SearchBar from './SearchBar';

export default function Header() {
  const { toggleSidebar, preferences, toggleTheme } = useApp();
  const [mobileSearchActive, setMobileSearchActive] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-youtube-dark/95 backdrop-blur border-b border-neutral-200 dark:border-youtube-border h-14 md:h-16 flex items-center px-3 md:px-6 transition-colors duration-200">
      {/* Mobile Search Bar View */}
      {mobileSearchActive ? (
        <div className="flex items-center w-full gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchActive(false)}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Back"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <SearchBar autoFocus onSearchSubmit={() => setMobileSearchActive(false)} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          {/* Left section: Hamburger & Logo */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-youtube-hover text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <Link to="/" className="flex items-center gap-1 group py-1" title="YouTube Home">
              <div className="flex items-center">
                <svg viewBox="0 0 28 20" className="h-5 w-auto shrink-0" fill="none">
                  <path
                    fill="#FF0000"
                    d="M27.414 3.053a3.518 3.518 0 0 0-2.476-2.492C22.756 0 14 0 14 0S5.244 0 3.062.561A3.518 3.518 0 0 0 .586 3.053C0 5.25 0 9.833 0 9.833s0 4.583.586 6.78a3.518 3.518 0 0 0 2.476 2.492C5.244 19.667 14 19.667 14 19.667s8.756 0 10.938-.562a3.518 3.518 0 0 0 2.476-2.492c.586-2.197.586-6.78.586-6.78s0-4.583-.586-6.78Z"
                  />
                  <polygon fill="#FFFFFF" points="11.2,14 18.2,9.833 11.2,5.667" />
                </svg>
                <div className="flex items-start">
                  <span className="font-bold text-[19px] tracking-tighter text-neutral-900 dark:text-white font-sans ml-1 select-none">
                    YouTube
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium ml-1 -mt-1 select-none">
                    IN
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Desktop Search Bar & Filter Badge */}
          <div className="hidden sm:flex items-center justify-center flex-1 max-w-xl mx-4 gap-3">
            <SearchBar />
          </div>

          {/* Right section: Theme & Settings */}
          <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setMobileSearchActive(true)}
              className="sm:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-youtube-hover text-neutral-700 dark:text-neutral-200"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-youtube-hover text-neutral-600 dark:text-neutral-300 transition-colors"
              title={`Switch to ${preferences.theme === 'dark' ? 'Light' : 'Dark'} theme`}
            >
              {preferences.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Settings Link */}
            <Link
              to="/settings"
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-youtube-hover text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Content Filtering & Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
