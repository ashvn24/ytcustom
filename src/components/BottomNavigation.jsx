import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flame, Music, Library } from 'lucide-react';

export default function BottomNavigation() {
  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shorts', path: '/shorts', icon: Flame },
    { name: 'Devotional', path: '/devotional', icon: Music },
    { name: 'Library', path: '/library', icon: Library },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-youtube-dark/95 backdrop-blur border-t border-neutral-200 dark:border-youtube-border h-16 flex items-center justify-around px-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-red-600 dark:text-red-500 font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">{tab.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
