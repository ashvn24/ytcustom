import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function FilterStatusBadge({ compact = false }) {
  const { blockedCount, filterRules } = useApp();

  const activeCategoriesCount = filterRules.categories.filter(c => c.enabled).length;

  if (compact) {
    return (
      <Link
        to="/settings"
        title={`Strict Filtering Active: ${blockedCount} items filtered out. Click to inspect rules.`}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
        <span>Filtered ({blockedCount} blocked)</span>
      </Link>
    );
  }

  return (
    <Link
      to="/settings"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm group"
    >
      <ShieldCheck className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 transition-transform" />
      <span>
        Strict Content Shield Active &bull; <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{blockedCount} Blocked</strong> ({activeCategoriesCount} Active Policies)
      </span>
      <Info className="w-3.5 h-3.5 text-neutral-400" />
    </Link>
  );
}
