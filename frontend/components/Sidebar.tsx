
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Collection } from '../types';

interface SidebarProps {
  vibe: string;
  collections: Collection[];
  onAddCollection: (name: string, icon: string) => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ vibe, collections, onAddCollection, onToggle }) => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColIcon, setNewColIcon] = useState('folder');

  const activePath = location.pathname === '/' ? '/today' : location.pathname;

  const NavLink: React.FC<{ to: string, icon: string, label: string, badge?: number }> = ({ to, icon, label, badge }) => {
    const isActive = activePath === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center justify-between px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
          isActive ? 'bg-white/5 text-primary' : 'text-secondary hover:bg-white/5 hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          <span className="truncate max-w-[120px]">{label}</span>
        </div>
        {badge && (
          <span className="bg-romantic/20 text-romantic text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onAddCollection(newColName, newColIcon);
    setNewColName('');
    setIsModalOpen(false);
  };

  const ICONS = ['restaurant', 'hiking', 'home', 'movie', 'flight', 'palette', 'fitness_center', 'pets'];

  return (
    <aside className="h-full bg-sidebar flex flex-col">
      <div className="p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            <span className="material-symbols-outlined text-white text-sm font-bold">all_inclusive</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-primary">Synk</span>
        </div>
        <button 
          onClick={onToggle}
          className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[18px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
          title="Collapse Navigation"
        >
          dock_to_right
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        <NavLink to="/inbox" icon="inbox" label="Inbox" badge={3} />
        <NavLink to="/today" icon="calendar_today" label="Today" />
        <NavLink to="/board" icon="grid_view" label="Board" />
        <NavLink to="/memories" icon="photo_library" label="Memories" />
        <NavLink to="/milestones" icon="flag" label="Milestones" />

        <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary/50">Collections</span>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="material-symbols-outlined text-secondary/50 hover:text-primary text-sm"
            >
                add
            </button>
        </div>
        {collections.map(col => (
            <NavLink key={col.id} to={`/collection/${col.id}`} icon={col.icon} label={col.name} />
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-card/50 border border-subtle rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-secondary font-medium uppercase">Vibe</p>
            <span className="text-xs">✨</span>
          </div>
          <p className="text-[11px] text-primary/80 line-clamp-2">{vibe}</p>
        </div>
      </div>

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-xs overflow-hidden">
             <div className="p-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-sm font-bold">New Collection</h3>
                <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-secondary text-lg">close</button>
             </div>
             <form onSubmit={handleCreate} className="p-4 space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-secondary uppercase">Name</label>
                    <input 
                        autoFocus
                        className="w-full bg-white/5 border border-subtle rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="e.g., Home Projects"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-secondary uppercase">Icon</label>
                    <div className="grid grid-cols-4 gap-2">
                        {ICONS.map(i => (
                            <button 
                                key={i}
                                type="button"
                                onClick={() => setNewColIcon(i)}
                                className={`h-8 rounded border transition-all flex items-center justify-center ${newColIcon === i ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-subtle text-secondary'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{i}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    type="submit"
                    className="w-full bg-accent text-white py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors"
                >
                    Create
                </button>
             </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;