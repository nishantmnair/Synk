import React, { useState } from 'react';
import { Milestone } from '../types';

interface Memory {
  id: string;
  title: string;
  date: string;
  milestoneId?: string;
  milestoneName?: string;
  photos: string[];
  description: string;
  tags: string[];
}

const MemoriesView: React.FC = () => {
  // Memories will be loaded from backend API in the future
  const [memories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-subtle">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-romantic">photo_library</span>
              Memories
            </h1>
            <p className="text-sm text-secondary mt-2">Relive your shared moments and milestones</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 border border-subtle rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">list</span>
              </button>
            </div>
            <button className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-colors">
              <span className="material-symbols-outlined text-base">add</span>
              Add Memory
            </button>
          </div>
        </div>

        {/* Memories Content */}
        {memories.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map(memory => (
                <div
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className="bg-card border border-subtle rounded-2xl overflow-hidden hover:border-accent/30 transition-all cursor-pointer group"
                >
                  <div className="aspect-video bg-gradient-to-br from-romantic/20 to-accent/20 flex items-center justify-center relative">
                    {memory.photos.length > 0 ? (
                      <img src={memory.photos[0]} alt={memory.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-secondary/30">photo_library</span>
                    )}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white bg-black/50 rounded-full p-2">favorite</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold mb-1">{memory.title}</h3>
                      <p className="text-xs text-secondary">{memory.date}</p>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2">{memory.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {memory.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 border border-subtle rounded text-[9px] text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map(memory => (
                <div
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-accent/30 transition-all cursor-pointer group flex gap-6"
                >
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-romantic/20 to-accent/20 flex items-center justify-center shrink-0">
                    {memory.photos.length > 0 ? (
                      <img src={memory.photos[0]} alt={memory.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-secondary/30">photo_library</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{memory.title}</h3>
                        <p className="text-xs text-secondary">{memory.date}</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary group-hover:text-accent transition-colors">chevron_right</span>
                    </div>
                    <p className="text-sm text-secondary">{memory.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {memory.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 border border-subtle rounded text-[9px] text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-subtle mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl opacity-20">photo_library</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary/60">No memories yet</p>
              <p className="text-xs text-secondary">Start creating memories by completing milestones together!</p>
            </div>
            <button className="mt-4 bg-accent text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors">
              Create Your First Memory
            </button>
          </div>
        )}

        {/* Memory Detail Modal */}
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedMemory(null)}></div>
            <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="sticky top-0 bg-card border-b border-subtle p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold">{selectedMemory.title}</h2>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="material-symbols-outlined text-secondary hover:text-primary transition-colors"
                >
                  close
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="aspect-video bg-gradient-to-br from-romantic/20 to-accent/20 rounded-xl flex items-center justify-center">
                  {selectedMemory.photos.length > 0 ? (
                    <img src={selectedMemory.photos[0]} alt={selectedMemory.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="material-symbols-outlined text-8xl text-secondary/30">photo_library</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-secondary">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    {selectedMemory.date}
                  </span>
                  {selectedMemory.milestoneName && (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">flag</span>
                      {selectedMemory.milestoneName}
                    </span>
                  )}
                </div>
                <p className="text-base text-secondary leading-relaxed">{selectedMemory.description}</p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-subtle">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 border border-subtle rounded-full text-xs text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoriesView;
