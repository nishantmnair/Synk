import React, { useState, useEffect } from 'react';
import { Memory } from '../types';
import { memoriesApi } from '../services/djangoApi';

interface MemoryForm {
  title: string;
  description: string;
  date: string;
  milestone: string | null;
  photos: string[];
  tags: string;
}

interface MemoriesViewProps {
  memories: Memory[];
  setMemories: (memories: Memory[]) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const MemoriesView: React.FC<MemoriesViewProps> = ({ memories, setMemories, showToast }) => {
  // State management
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MemoryForm>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    milestone: null,
    photos: [],
    tags: '',
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Debug: Log when memories change
  useEffect(() => {
    console.log('[MemoriesView] memories updated:', memories.length, 'items');
    const favCount = memories.filter(m => m.is_favorite).length;
    console.log('[MemoriesView] Favorited memories:', favCount);
  }, [memories]);

  const getFilteredMemories = () => {
    let filtered = memories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(m => m.tags.includes(filterTag));
    }

    // Filter favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(m => m.is_favorite);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    memories.forEach(m => {
      m.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target: { files } } = e;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target as FileReader)?.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, dataUrl],
        }));
        setPreviewUrls(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      milestone: null,
      photos: [],
      tags: '',
    });
    setPreviewUrls([]);
    setEditingMemory(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsEditModalOpen(true);
  };

  const openEditModal = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      title: memory.title,
      description: memory.description,
      date: memory.date,
      milestone: memory.milestone || null,
      photos: memory.photos,
      tags: memory.tags.join(', '),
    });
    setPreviewUrls(memory.photos);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      setError('Title and date are required');
      return;
    }

    try {
      const memoryData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        milestone: formData.milestone ? parseInt(formData.milestone) : null,
        photos: formData.photos,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        is_favorite: editingMemory?.is_favorite || false,
      };

      if (editingMemory) {
        await memoriesApi.update(parseInt(editingMemory.id), memoryData);
        showToast('Memory updated successfully', 'success');
      } else {
        await memoriesApi.create(memoryData);
        showToast('Memory created successfully', 'success');
      }

      setIsEditModalOpen(false);
      resetForm();
      setError(null);
    } catch (err) {
      console.error('Failed to save memory:', err);
      const errorMsg = 'Failed to save memory';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleDeleteMemory = async (memory: Memory) => {
    if (!window.confirm(`Delete memory "${memory.title}"?`)) return;

    try {
      await memoriesApi.delete(parseInt(memory.id));
      setSelectedMemory(null);
      setError(null);
      showToast('Memory deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete memory:', err);
      const errorMsg = 'Failed to delete memory';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleToggleFavorite = async (memory: Memory) => {
    try {
      const memoryId = parseInt(memory.id);
      console.log('[Memory] Before toggle - id:', memoryId, 'is_favorite:', memory.is_favorite);
      
      // Make the API call first
      const result = await memoriesApi.toggleFavorite(memoryId);
      console.log('[Memory] Toggle result:', result, 'is_favorite in result:', (result as any)?.is_favorite);
      
      // Use the API response data to update, not local logic
      // The backend always returns the updated memory
      const newFavoriteStatus = (result as any)?.is_favorite !== undefined ? (result as any).is_favorite : !memory.is_favorite;
      console.log('[Memory] New favorite status:', newFavoriteStatus);
      
      const updatedMemories = memories.map(m => 
        String(m.id) === String(memory.id) 
          ? { ...m, is_favorite: newFavoriteStatus } 
          : m
      );
      
      setMemories(updatedMemories);
      
      // Update selectedMemory if it's the one being favorited
      if (selectedMemory && String(selectedMemory.id) === String(memory.id)) {
        setSelectedMemory({ 
          ...selectedMemory, 
          is_favorite: newFavoriteStatus
        });
      }
      
      setError(null);
      showToast('Favorite updated', 'success');
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      const errorMsg = 'Failed to toggle favorite';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const filteredMemories = getFilteredMemories();
  const allTags = getAllTags();

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
            <p className="text-sm text-secondary mt-2">
              {filteredMemories.length === 0
                ? 'No memories yet.'
                : `${filteredMemories.length} memory${filteredMemories.length !== 1 ? 'ies' : ''}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex bg-white/5 border border-subtle rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">list</span>
              </button>
            </div>
            <button
              onClick={openAddModal}
              className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Memory
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-3 text-secondary">search</span>
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50"
            />
          </div>

          {/* Tag filters and favorites toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-romantic/30 border border-romantic/50 text-romantic'
                  : 'bg-white/5 border border-subtle text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">favorite</span>
              Favorites
            </button>
            {filterTag && (
              <button
                onClick={() => setFilterTag(null)}
                className="px-3 py-1.5 bg-accent/30 border border-accent/50 text-accent rounded-full text-xs font-medium hover:bg-accent/40 transition-colors flex items-center gap-2"
              >
                {filterTag}
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Tag cloud */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filterTag === tag
                      ? 'bg-accent/20 border border-accent/50 text-accent'
                      : 'bg-white/5 border border-subtle text-secondary hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading state */}
        {memories.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-4xl text-secondary">photo_library</span>
            </div>
            <p className="text-sm text-secondary">No memories yet. Create one to get started!</p>
          </div>
        ) : filteredMemories.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemories.map(memory => (
                <div
                  key={memory.id}
                  className="bg-card border border-subtle rounded-2xl overflow-hidden hover:border-accent/30 transition-all cursor-pointer group"
                >
                  <div className="aspect-video bg-gradient-to-br from-romantic/20 to-accent/20 flex items-center justify-center relative">
                    {memory.photos.length > 0 ? (
                      <img
                        src={memory.photos[0]}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-secondary/30">
                        photo_library
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(memory);
                        }}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                      >
                        <span 
                          className="material-symbols-outlined text-lg"
                          style={{ fontVariationSettings: memory.is_favorite ? '"FILL" 1' : '"FILL" 0' }}
                        >
                          favorite
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(memory);
                        }}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedMemory(memory)}
                    className="p-5 space-y-3 cursor-pointer"
                  >
                    <div>
                      <h3 className="text-base font-semibold mb-1 line-clamp-1">{memory.title}</h3>
                      <p className="text-xs text-secondary">
                        {new Date(memory.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2">{memory.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {memory.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/5 border border-subtle rounded text-[9px] text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                      {memory.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[9px] text-secondary">
                          +{memory.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredMemories.map(memory => (
                <div
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-accent/30 transition-all cursor-pointer group flex gap-6"
                >
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-romantic/20 to-accent/20 flex items-center justify-center shrink-0">
                    {memory.photos.length > 0 ? (
                      <img
                        src={memory.photos[0]}
                        alt={memory.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-secondary/30">
                        photo_library
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{memory.title}</h3>
                        <p className="text-xs text-secondary">
                          {new Date(memory.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(memory);
                        }}
                        className="text-secondary hover:text-romantic transition-colors"
                      >
                        <span 
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: memory.is_favorite ? '"FILL" 1' : '"FILL" 0' }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                    <p className="text-sm text-secondary line-clamp-2">{memory.description}</p>
                    {memory.photos.length > 0 && (
                      <p className="text-xs text-secondary">{memory.photos.length} photo(s)</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {memory.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/5 border border-subtle rounded text-[9px] text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-secondary group-hover:text-accent transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty state */
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-subtle mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl opacity-20">photo_library</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary/60">No memories found</p>
              <p className="text-xs text-secondary">
                {searchQuery || filterTag || showFavoritesOnly
                  ? 'Try adjusting your filters'
                  : 'Create your first memory by clicking the button above!'}
              </p>
            </div>
            {!searchQuery && !filterTag && !showFavoritesOnly && (
              <button
                onClick={openAddModal}
                className="mt-4 bg-accent text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors"
              >
                Create Your First Memory
              </button>
            )}
          </div>
        )}

        {/* Memory Detail Modal */}
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setSelectedMemory(null)}
            />
            <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="sticky top-0 bg-card border-b border-subtle p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold">{selectedMemory.title}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(selectedMemory)}
                    className="material-symbols-outlined text-secondary hover:text-romantic transition-colors p-2"
                    style={{ fontVariationSettings: selectedMemory.is_favorite ? '"FILL" 1' : '"FILL" 0' }}
                  >
                    favorite
                  </button>
                  <button
                    onClick={() => {
                      openEditModal(selectedMemory);
                      setSelectedMemory(null);
                    }}
                    className="material-symbols-outlined text-secondary hover:text-primary transition-colors p-2"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(selectedMemory)}
                    className="material-symbols-outlined text-secondary hover:text-red-500 transition-colors p-2"
                  >
                    delete
                  </button>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="material-symbols-outlined text-secondary hover:text-primary transition-colors"
                  >
                    close
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Photo Gallery */}
                {selectedMemory.photos.length > 0 && (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-romantic/20 to-accent/20 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src={selectedMemory.photos[0]}
                        alt={selectedMemory.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedMemory.photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedMemory.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="aspect-square bg-gradient-to-br from-romantic/20 to-accent/20 rounded-lg overflow-hidden"
                          >
                            <img src={photo} alt={`${selectedMemory.title} ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-col gap-4 text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    {new Date(selectedMemory.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {selectedMemory.milestoneName && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">flag</span>
                      {selectedMemory.milestoneName}
                    </div>
                  )}
                  {selectedMemory.photos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">image</span>
                      {selectedMemory.photos.length} photo{selectedMemory.photos.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedMemory.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-2">About this memory</h3>
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedMemory.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedMemory.tags.length > 0 && (
                  <div className="pt-4 border-t border-subtle">
                    <h3 className="text-sm font-semibold text-primary mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/5 border border-subtle rounded-full text-xs text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit/Add Memory Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsEditModalOpen(false)}
            />
            <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="sticky top-0 bg-card border-b border-subtle p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold">
                  {editingMemory ? 'Edit Memory' : 'Create Memory'}
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="material-symbols-outlined text-secondary hover:text-primary transition-colors"
                >
                  close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Memory Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="What was this memory about?"
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2 text-sm text-primary focus:outline-none focus:border-accent/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell us about this memory..."
                    rows={4}
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50 resize-none"
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Photos
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-input"
                    />
                    <label
                      htmlFor="photo-input"
                      className="block w-full bg-white/5 border border-dashed border-subtle rounded-lg p-6 text-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-3xl text-secondary mx-auto block mb-2">
                        image
                      </span>
                      <p className="text-sm text-secondary">Click to upload photos</p>
                    </label>
                  </div>

                  {/* Photo Preview */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${idx}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., vacation, beach, sunset"
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t border-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 bg-white/5 border border-subtle text-primary px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
                  >
                    {editingMemory ? 'Update Memory' : 'Create Memory'}
                  </button>
                </div>
              </form>            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoriesView;