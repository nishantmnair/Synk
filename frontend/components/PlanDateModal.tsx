import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDateIdea } from '../services/geminiService';
import { getDisplayName } from '../utils/userDisplay';
import { User } from '../services/djangoAuth';

export interface DateIdea {
  title: string;
  description: string;
  location: string;
  category?: string;
}

interface PlanDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  vibe: string;
  currentUser: User | null;
  onSaveToInbox: (payload: {
    title: string;
    suggested_by: string;
    date: string;
    description: string;
    location: string;
    category: string;
    excitement: number;
    tags: string[];
  }) => void;
}

const PlanDateModal: React.FC<PlanDateModalProps> = ({
  isOpen,
  onClose,
  vibe,
  currentUser,
  onSaveToInbox,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idea, setIdea] = useState<DateIdea | null>(null);
  const tryCountRef = useRef(0);

  const fetchIdea = useCallback(async (hint?: number) => {
    setLoading(true);
    setError(null);
    setIdea(null);
    try {
      const result = await generateDateIdea(vibe, hint);
      setIdea({
        title: result.title ?? 'Date idea',
        description: result.description ?? '',
        location: result.location ?? '',
        category: result.category ?? 'Date idea',
      });
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again?');
      setIdea({
        title: 'Cozy Movie Marathon',
        description: 'A themed movie night with homemade popcorn.',
        location: 'Home',
        category: 'Date idea',
      });
    } finally {
      setLoading(false);
    }
  }, [vibe]);

  useEffect(() => {
    if (isOpen) {
      tryCountRef.current = 0;
      fetchIdea(0);
    } else {
      setIdea(null);
      setError(null);
    }
  }, [isOpen, fetchIdea]);

  const handleTryAnother = () => {
    tryCountRef.current += 1;
    fetchIdea(tryCountRef.current);
  };

  const handleSendToInbox = () => {
    if (!idea) return;
    onSaveToInbox({
      title: idea.title,
      suggested_by: getDisplayName(currentUser),
      date: 'Soon',
      description: idea.description,
      location: idea.location,
      category: idea.category ?? 'Date idea',
      excitement: 50,
      tags: ['ai', 'date-idea'],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-card border border-subtle rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-date-title"
      >
        <div className="p-4 border-b border-subtle flex items-center justify-between">
          <h2 id="plan-date-title" className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-accent">auto_awesome</span>
            Plan a date
          </h2>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-secondary hover:text-primary transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
            aria-label="Close"
          >
            close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && !idea && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <span className="material-symbols-outlined text-4xl text-accent animate-pulse">wb_twilight</span>
              <p className="text-sm text-secondary">Finding something magical for you...</p>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {idea && !loading && (
            <div className="space-y-4 animate-in">
              <div className="bg-white/5 border border-subtle rounded-xl p-4 space-y-3">
                <h3 className="text-lg font-bold text-primary">{idea.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{idea.description}</p>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>{idea.location}</span>
                </div>
                {idea.category && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
                    {idea.category}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleTryAnother}
                  disabled={loading}
                  className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg border border-subtle text-sm font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  Try another
                </button>
                <button
                  onClick={handleSendToInbox}
                  className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  <span className="material-symbols-outlined text-lg">inbox</span>
                  Send to Inbox
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg bg-white/5 text-secondary hover:text-primary text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {idea && loading && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <p className="text-xs text-secondary">Getting another idea...</p>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanDateModal;
