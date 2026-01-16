
import React, { useState, useEffect } from 'react';
import { Suggestion, Task, TaskStatus } from '../types';

interface InboxViewProps {
  suggestions: Suggestion[];
  onAccept: (task: Task) => void;
  onSave: () => void;
  onDecline: (id: string) => void;
}

const InboxView: React.FC<InboxViewProps> = ({ suggestions, onAccept, onSave, onDecline }) => {
  const [selectedId, setSelectedId] = useState(suggestions[0]?.id);
  const [excitement, setExcitement] = useState(50);
  const selected = suggestions.find(s => s.id === selectedId) || suggestions[0];

  const handleAccept = () => {
    if (!selected) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: selected.title,
      category: selected.category,
      priority: 'medium',
      status: TaskStatus.PLANNING,
      liked: false,
      fired: false,
      progress: 0,
      alexProgress: excitement,
      samProgress: selected.excitement,
      avatars: [],
      description: selected.description,
      location: selected.location
    };
    onAccept(newTask);
    onDecline(selected.id);
    if (suggestions.length > 1) {
      const nextSuggestion = suggestions.find(s => s.id !== selected.id);
      if (nextSuggestion) setSelectedId(nextSuggestion.id);
    }
  };

  const handleSave = () => {
    // Save to a "saved for later" list - could be implemented with a separate state
    onSave();
    alert('Suggestion saved for later!');
  };

  const handleDecline = () => {
    if (!selected) return;
    if (window.confirm('Are you sure you want to decline this suggestion?')) {
      onDecline(selected.id);
      if (suggestions.length > 1) {
        const nextSuggestion = suggestions.find(s => s.id !== selected.id);
        if (nextSuggestion) setSelectedId(nextSuggestion.id);
      }
    }
  };

  useEffect(() => {
    if (!selected) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDecline();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, excitement]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* List */}
      <div className="w-96 border-r border-subtle flex flex-col shrink-0 overflow-y-auto custom-scrollbar bg-main/20">
        <div className="p-4 space-y-1">
          <div className="px-2 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest">Partner Suggestions</div>
          {suggestions.map(s => (
            <div 
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`border rounded-lg p-4 cursor-pointer relative group transition-all ${
                selectedId === s.id ? 'bg-white/10 border-accent/40' : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-romantic/20 text-romantic rounded text-[10px] font-bold">NEW</span>
                <span className="material-symbols-outlined text-sm text-secondary">attachment</span>
              </div>
              <h4 className="text-sm font-medium mb-1">{s.title}</h4>
              <p className="text-xs text-secondary line-clamp-1 mb-3">{s.suggestedBy}: "{s.description}"</p>
              <div className="flex items-center justify-between">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                  {s.suggestedBy[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex gap-2">
                  <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden self-center">
                    <div className="h-full bg-romantic" style={{ width: `${s.excitement}%` }}></div>
                  </div>
                  <span className="text-[10px] text-secondary">{s.excitement}% excitement</span>
                </div>
              </div>
            </div>
          ))}
          <div className="h-px bg-subtle my-2 mx-2"></div>
          <div className="px-2 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest">Unsorted Ideas</div>
          <div className="opacity-50 px-4 py-8 text-center text-xs text-secondary">No unsorted items</div>
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col bg-main/30 overflow-y-auto custom-scrollbar">
        {selected ? (
          <div className="p-12 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {selected.suggestedBy[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium">{selected.suggestedBy} suggested this for you both</p>
                <p className="text-xs text-secondary">{selected.date}</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">{selected.title}</h2>
            
            <div className="flex gap-4 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-subtle rounded-md">
                <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                <span className="text-xs">{selected.location}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-subtle rounded-md">
                <span className="material-symbols-outlined text-sm text-secondary">category</span>
                <span className="text-xs">{selected.category}</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-secondary leading-relaxed mb-8">
              <p>{selected.description}</p>
            </div>

            <div className="bg-card border border-subtle rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Interest Level</h3>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-subtle text-sm transition-colors">❤️</button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-subtle text-sm transition-colors">🔥</button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-romantic">{selected.suggestedBy} is very excited</span>
                    <span>{selected.excitement}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-romantic" style={{ width: `${selected.excitement}%` }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-accent">How excited are you?</span>
                    <span className="text-secondary">{excitement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={excitement}
                    onChange={(e) => setExcitement(Number(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-accent"
                    style={{
                      background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${excitement}%, rgba(255, 255, 255, 0.05) ${excitement}%, rgba(255, 255, 255, 0.05) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-12">
              <button 
                onClick={handleAccept}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-accent hover:bg-indigo-500 rounded-xl transition-colors group"
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
                <span className="text-xs font-bold">Accept to Planning</span>
                <kbd className="text-[10px] opacity-60">Press A</kbd>
              </button>
              <button 
                onClick={handleSave}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-subtle rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="text-xs font-bold">Save for Someday</span>
                <kbd className="text-[10px] opacity-40">Press S</kbd>
              </button>
              <button 
                onClick={handleDecline}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-red-500/10 border border-subtle hover:border-red-500/50 rounded-xl transition-colors group"
              >
                <span className="material-symbols-outlined group-hover:text-red-500">close</span>
                <span className="text-xs font-bold group-hover:text-red-500">Decline</span>
                <kbd className="text-[10px] opacity-40">Press D</kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-secondary/30">inbox</span>
              <p className="text-sm text-secondary">No suggestions to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
