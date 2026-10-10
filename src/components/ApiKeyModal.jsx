import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ApiKeyModal({ isOpen, onClose }) {
  const { apiKey, setApiKey } = useApp();
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = e => {
    e.preventDefault();
    setApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setInputKey('');
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              YouTube Data API Configuration
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Optional external search provider
            </p>
          </div>
        </div>

        {/* Security transparency alert */}
        <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <AlertTriangle className="w-4 h-4 shrink-0 text-neutral-500" />
            <span>Frontend Client-Side Notice</span>
          </div>
          <p className="leading-relaxed">
            This application runs 100% in your browser without a backend server. Any API key entered here is stored only in your browser&apos;s LocalStorage, but will be visible in client network requests.
          </p>
          <p className="leading-relaxed">
            <strong>Note:</strong> YouTube live streams are pulled using this key while enforcing strict content safety guardrails.
          </p>
        </div>

        {/* Content filter guarantee */}
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2 mb-5">
          <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <span>
            <strong>Filtering Guarantee:</strong> All external video responses from the YouTube API are passed through our strict content filter before any card is rendered.
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              YouTube Data API v3 Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs font-medium text-neutral-500 hover:text-red-500 transition-colors"
            >
              Clear Stored Key
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
              >
                {savedSuccess ? 'Saved!' : 'Save Key'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
