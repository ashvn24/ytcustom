import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Sparkles,
  Flame,
  Library,
  History,
  Settings,
  ShieldCheck,
  Music,
  Heart,
  Compass,
  Tv,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, blockedCount } = useApp();

  const mainNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Devotional', path: '/devotional', icon: Music },
    { name: 'Shorts', path: '/shorts', icon: Flame },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'History', path: '/library?tab=history', icon: History },
  ];

  const devotionalCategories = [
    { name: 'All Devotional', path: '/devotional' },
    { name: 'Krishna Bhajans', path: '/devotional?cat=Krishna%20Bhajans' },
    { name: 'Shiva Devotional', path: '/devotional?cat=Shiva%20Devotional' },
    { name: 'Ayyappa Devotional', path: '/devotional?cat=Ayyappa%20Devotional' },
    { name: 'Devi & Durga Stutis', path: '/devotional?cat=Devi%20%26%20Durga%20Stutis' },
    { name: 'Malayalam Devotional', path: '/devotional?cat=Malayalam%20Devotional' },
    { name: 'Hanuman Chalisa', path: '/devotional?cat=Hanuman%20Chalisa%20%26%20Chants' },
    { name: 'Sanskrit Mantras', path: '/devotional?cat=Sanskrit%20Mantras%20%26%20Stotras' },
    { name: 'Temple Instrumental', path: '/devotional?cat=Temple%20Instrumental%20Music' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-14 md:top-16 z-30 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-youtube-dark border-r border-neutral-200 dark:border-youtube-border transition-all duration-200 overflow-y-auto ${
          sidebarOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="py-3 px-2 flex flex-col h-full justify-between">
          <div>
            {/* Primary Navigation */}
            <div className="space-y-1">
              {mainNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => {
                      // Close mobile drawer on item click
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-neutral-100 dark:bg-youtube-hover text-red-600 dark:text-red-500 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-youtube-hover'
                      } ${!sidebarOpen ? 'md:flex-col md:gap-1 md:py-3 md:text-[11px]' : ''}`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={`${!sidebarOpen ? 'md:truncate' : ''}`}>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>

            {/* Devotional Subcategories (Only when expanded) */}
            {sidebarOpen && (
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-youtube-border">
                <div className="px-3 pb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <span>Devotional Streams</span>
                </div>
                <div className="space-y-0.5">
                  {devotionalCategories.map(cat => (
                    <NavLink
                      key={cat.name}
                      to={cat.path}
                      onClick={() => {
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-xs rounded-lg transition-colors ${
                          isActive
                            ? 'bg-neutral-100 dark:bg-youtube-hover text-neutral-900 dark:text-white font-semibold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-youtube-hover hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 mr-2.5"></span>
                      <span className="truncate">{cat.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Settings & Footer */}
          <div className="mt-6 pt-3 border-t border-neutral-200 dark:border-youtube-border space-y-2">
            <NavLink
              to="/settings"
              onClick={() => {
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-youtube-hover text-red-600 dark:text-red-500 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-youtube-hover'
                } ${!sidebarOpen ? 'md:flex-col md:gap-1 md:py-2 md:text-[11px]' : ''}`
              }
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Settings</span>
            </NavLink>

            {sidebarOpen && (
              <div className="px-3 py-2 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-2">
                <p className="font-medium text-neutral-600 dark:text-neutral-300">&copy; 2026 YouTube LLC</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">About Press Copyright Contact us</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
