
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Collection } from '../types';

interface SidebarProps {
  collections: Collection[];
  onAddCollection: (name: string, icon: string) => void;
  onDeleteCollection?: (collectionId: string) => Promise<void>;
  onToggle: () => void;
  suggestionsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ collections, onAddCollection, onDeleteCollection, onToggle, suggestionsCount = 0 }) => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColIcon, setNewColIcon] = useState('folder');
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; collectionId: string } | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onAddCollection(newColName, newColIcon);
      setNewColName('');
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, collectionId });
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (onDeleteCollection) {
      try {
        await onDeleteCollection(collectionId);
        setContextMenu(null);
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const ICONS = ['restaurant', 'hiking', 'home', 'movie', 'flight', 'palette', 'fitness_center', 'pets'];

  return (
    <aside className="h-full bg-sidebar flex flex-col">
      <div className="p-4 flex items-center justify-between mb-4">
        <Link
          to="/"
          className="flex items-center gap-2 overflow-hidden rounded-md py-1 pr-1 -ml-1 hover:bg-white/5 transition-colors cursor-pointer"
          title="Home"
        >
          <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            <span className="material-symbols-outlined text-white text-sm font-bold">all_inclusive</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-primary">Synk</span>
        </Link>
        <button 
          onClick={onToggle}
          className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[18px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
          title="Collapse Navigation"
        >
          dock_to_right
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        <NavLink to="/inbox" icon="inbox" label="Inbox" badge={suggestionsCount > 0 ? suggestionsCount : undefined} />
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
            <div
              key={col.id}
              onContextMenu={(e) => handleContextMenu(e, col.id)}
              className="relative"
            >
              <NavLink to={`/collection/${col.id}`} icon={col.icon} label={col.name} />
            </div>
        ))}
      </nav>

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
                    <label htmlFor="collection-name" className="text-[10px] font-bold text-secondary uppercase">Name</label>
                    <input 
                        id="collection-name"
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
                    disabled={isLoading || !newColName.trim()}
                    className="w-full bg-accent text-white py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Creating...' : 'Create'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Context Menu for Collections */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-card border border-subtle rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          >
            <button
              onClick={() => handleDeleteCollection(contextMenu.collectionId)}
              className="w-full px-4 py-2 text-left text-sm text-romantic hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Delete
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;