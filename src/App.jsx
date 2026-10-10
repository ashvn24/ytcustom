import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNavigation from './components/BottomNavigation';
import ApiKeyModal from './components/ApiKeyModal';

// Pages
import Home from './pages/Home';
import Devotional from './pages/Devotional';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Shorts from './pages/Shorts';

export default function App() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-youtube-lightBg dark:bg-youtube-dark text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
        {/* Top Header */}
        <Header onOpenApiKeyModal={() => setApiKeyModalOpen(true)} />

        {/* Main Content Area */}
        <div className="flex flex-1 relative">
          {/* Collapsible Sidebar */}
          <Sidebar />

          {/* Page Routing Container */}
          <main className="flex-1 px-3 md:px-6 pt-0 pb-24 md:pb-10 overflow-x-clip min-w-0 max-w-[1800px] mx-auto w-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/devotional" element={<Devotional />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/shorts" element={<Shorts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />

        {/* YouTube API Key Modal */}
        <ApiKeyModal
          isOpen={apiKeyModalOpen}
          onClose={() => setApiKeyModalOpen(false)}
        />
      </div>
    </Router>
  );
}
