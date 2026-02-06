
import React, { useState, useEffect } from 'react';
import { Suggestion, Task, TaskStatus, InboxItem } from '../types';
import { inboxApi } from '../services/djangoApi';

interface InboxViewProps {
  suggestions: Suggestion[];
  inboxItems?: InboxItem[];
  onAccept: (task: Task) => void;
  onSave: () => void;
  onDecline: (id: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showConfirm?: (config: any) => void;
}

type InboxItemType = {
  id: string;
  type: 'suggestion' | 'connection_answer';
  data: Suggestion | InboxItem;
};

const InboxView: React.FC<InboxViewProps> = ({ suggestions, inboxItems = [], onAccept, onSave, onDecline, showToast, showConfirm }) => {
  const [items, setItems] = useState<InboxItemType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [excitement, setExcitement] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    const combinedItems: InboxItemType[] = [
      ...suggestions.map(s => ({ id: s.id, type: 'suggestion' as const, data: s })),
      ...inboxItems.map(item => ({ id: item.id, type: 'connection_answer' as const, data: item }))
    ];
    setItems(combinedItems);
    if (combinedItems.length > 0 && !selectedId) {
      setSelectedId(combinedItems[0].id);
    }
  }, [suggestions, inboxItems, selectedId]);

  const selected = items.find(item => item.id === selectedId);

  const handleAccept = () => {
    if (!selected || selected.type !== 'suggestion') return;
    const suggestion = selected.data as Suggestion;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: suggestion.title,
      category: suggestion.category,
      priority: 'medium',
      status: TaskStatus.BACKLOG,
      liked: false,
      fired: false,
      progress: 0,
      alexProgress: excitement,
      samProgress: suggestion.excitement,
      avatars: [],
      description: suggestion.description,
      location: suggestion.location
    };
    onAccept(newTask);
    onDecline(suggestion.id);
    if (items.length > 1) {
      const nextItem = items.find(s => s.id !== selected.id);
      if (nextItem) setSelectedId(nextItem.id);
    }
  };

  const handleSave = () => {
    onSave();
    showToast?.('Suggestion saved for later!', 'success');
  };

  const handleDecline = () => {
    if (!selected || selected.type !== 'suggestion') return;
    const suggestion = selected.data as Suggestion;
    showConfirm?.({
      title: 'Decline Suggestion',
      message: 'Are you sure you want to decline this suggestion?',
      confirmText: 'Decline',
      confirmVariant: 'danger',
      onConfirm: () => {
        onDecline(suggestion.id);
        if (items.length > 1) {
          const nextItem = items.find(s => s.id !== selected.id);
          if (nextItem) setSelectedId(nextItem.id);
        }
      }
    });
  };

  const handleMarkAsRead = async (itemId: string) => {
    try {
      setIsLoading(true);
      await inboxApi.markAsRead(parseInt(itemId));
      showToast?.('Marked as read', 'success');
    } catch (error) {
      console.error('Error marking as read:', error);
      showToast?.('Failed to mark as read', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReact = async (itemId: string) => {
    try {
      setIsLoading(true);
      await inboxApi.react(parseInt(itemId));
      showToast?.('Reacted with ❤️', 'success');
    } catch (error) {
      console.error('Error reacting:', error);
      showToast?.('Failed to react', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareResponse = async () => {
    if (!responseText.trim()) {
      showToast?.('Response cannot be empty', 'warning');
      return;
    }

    if (!selected || selected.type !== 'connection_answer') {
      showToast?.('Cannot share response', 'error');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      const item = selected.data as InboxItem;
      await inboxApi.shareResponse(parseInt(item.id), responseText);
      showToast?.('Your response has been shared! ✨', 'success');
      setShowResponseModal(false);
      setResponseText('');
    } catch (error) {
      console.error('Error sharing response:', error);
      showToast?.('Failed to share response', 'error');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  useEffect(() => {
    if (!selected || selected.type !== 'suggestion') return;
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
  }, [selected, excitement]);

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-96 border-b md:border-b-0 md:border-r border-subtle flex flex-col shrink-0 overflow-y-auto custom-scrollbar bg-main/20 max-h-96 md:max-h-full">
        <div className="p-4 space-y-1">
          {inboxItems && inboxItems.length > 0 && (
            <>
              <div className="px-2 py-2 text-[10px] font-bold text-romantic uppercase tracking-widest">ღ Recent Connection Answers</div>
              {inboxItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`border rounded-lg p-4 cursor-pointer relative group transition-all ${
                    selectedId === item.id ? 'bg-white/10 border-romantic/40' : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-romantic/20 text-romantic rounded text-[10px] font-bold">ANSWER</span>
                    <div className="flex gap-1">
                      {item.hasReacted && <span className="text-sm">❤️</span>}
                      {item.respondedAt && <span className="material-symbols-outlined text-xs text-accent">done</span>}
                      {!item.isRead && <span className="w-2 h-2 rounded-full bg-romantic animate-pulse"></span>}
                    </div>
                  </div>
                  <h4 className="text-sm font-medium mb-1">{item.senderName} shared their answer</h4>
                  <p className="text-xs text-secondary line-clamp-2 mb-3">{item.content?.answer || item.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-romantic/20 flex items-center justify-center text-[10px] font-bold text-romantic">
                      {item.senderName[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-[10px] text-secondary">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              <div className="h-px bg-subtle my-2 mx-2"></div>
            </>
          )}
          
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
                <span className="px-2 py-0.5 bg-accent/20 text-accent rounded text-[10px] font-bold">IDEA</span>
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
                    <div className="h-full bg-accent" style={{ width: `${s.excitement}%` }}></div>
                  </div>
                  <span className="text-[10px] text-secondary">{s.excitement}%</span>
                </div>
              </div>
            </div>
          ))}
          
          {suggestions.length === 0 && inboxItems.length === 0 && (
            <div className="opacity-50 px-4 py-8 text-center text-xs text-secondary">No inbox items</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-main/30 overflow-y-auto custom-scrollbar">
        {selected ? (
          selected.type === 'suggestion' ? (
            <div className="p-12 max-w-3xl mx-auto w-full">
              {(() => {
                const suggestion = selected.data as Suggestion;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                        {suggestion.suggestedBy[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{suggestion.suggestedBy} suggested this for you both</p>
                        <p className="text-xs text-secondary">{suggestion.date}</p>
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-4">{suggestion.title}</h2>
                    
                    <div className="flex gap-4 mb-8">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-subtle rounded-md">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        <span className="text-xs">{suggestion.location}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-subtle rounded-md">
                        <span className="material-symbols-outlined text-sm text-secondary">category</span>
                        <span className="text-xs">{suggestion.category}</span>
                      </div>
                    </div>

                    <div className="text-sm text-secondary leading-relaxed mb-8">
                      <p>{suggestion.description}</p>
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
                            <span className="text-accent">{suggestion.suggestedBy} is very excited</span>
                            <span>{suggestion.excitement}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${suggestion.excitement}%` }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-romantic">How excited are you?</span>
                            <span className="text-secondary">{excitement}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={excitement}
                            onChange={(e) => setExcitement(Number(e.target.value))}
                            className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-12">
                      <button 
                        onClick={handleAccept}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-accent hover:bg-indigo-500 rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="text-xs font-bold">Accept to Backlog</span>
                        <kbd className="text-[10px] opacity-60">A</kbd>
                      </button>
                      <button 
                        onClick={handleSave}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-subtle rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="text-xs font-bold">Save for Someday</span>
                        <kbd className="text-[10px] opacity-40">S</kbd>
                      </button>
                      <button 
                        onClick={handleDecline}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-red-500/10 border border-subtle hover:border-red-500/50 rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                        <span className="text-xs font-bold">Decline</span>
                        <kbd className="text-[10px] opacity-40">D</kbd>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="p-12 max-w-3xl mx-auto w-full">
              {(() => {
                const item = selected.data as InboxItem;
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-romantic/20 flex items-center justify-center text-sm font-bold text-romantic">
                          {item.senderName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.senderName} answered a Daily Connection</p>
                          <p className="text-xs text-secondary">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(item.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold text-romantic bg-romantic/10 border border-romantic/20 rounded-md hover:bg-romantic/20 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Marking...' : 'Mark as Read'}
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-card/60 border border-romantic/20 rounded-xl p-8 mb-8">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-romantic mb-4">The Prompt</h3>
                      <p className="text-lg italic text-secondary mb-6">"{item.content?.prompt || 'Daily connection prompt'}"</p>
                      
                      <div className="h-px bg-subtle my-6"></div>
                      
                      <h3 className="text-xs font-bold uppercase tracking-widest text-romantic mb-4">Their Answer</h3>
                      <p className="text-base leading-relaxed text-secondary whitespace-pre-wrap">
                        {item.connectionAnswer?.answerText || item.content?.answer || item.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={() => handleReact(item.id)}
                        disabled={isLoading || item.hasReacted}
                        className={`p-4 flex items-center justify-center gap-2 rounded-lg transition-colors font-medium ${
                          item.hasReacted
                            ? 'bg-romantic/20 border border-romantic/40 text-romantic'
                            : 'bg-romantic/10 hover:bg-romantic/20 border border-romantic/20 text-romantic hover:border-romantic/40'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-outlined">{item.hasReacted ? 'favorite' : 'favorite_border'}</span>
                        <span className="text-sm font-medium">{item.hasReacted ? 'Reacted ❤️' : 'React with ❤️'}</span>
                      </button>
                      <button
                        onClick={() => setShowResponseModal(true)}
                        disabled={isLoading || item.respondedAt}
                        className={`p-4 flex items-center justify-center gap-2 rounded-lg transition-colors font-medium ${
                          item.respondedAt
                            ? 'bg-white/5 border border-subtle text-secondary/50'
                            : 'bg-white/5 hover:bg-white/10 border border-subtle hover:border-white/20'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-outlined">{item.respondedAt ? 'done' : 'reply'}</span>
                        <span className="text-sm font-medium">{item.respondedAt ? 'Responded' : 'Share Your Answer'}</span>
                      </button>
                    </div>

                    {/* Your Response Section */}
                    {item.response && (
                      <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Your Response</h3>
                        <p className="text-base leading-relaxed text-secondary whitespace-pre-wrap mb-3">
                          {item.response}
                        </p>
                        <p className="text-xs text-secondary">
                          Shared on {item.respondedAt ? new Date(item.respondedAt).toLocaleDateString() : 'today'}
                        </p>
                      </div>
                    )}

                    {/* Response Modal */}
                    {showResponseModal && (
                      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-subtle rounded-2xl max-w-md w-full p-8 shadow-2xl">
                          <h2 className="text-xl font-bold mb-4">Share Your Answer</h2>
                          <p className="text-sm text-secondary mb-6">
                            Tell {item.senderName} what you think about their answer to the daily connection prompt.
                          </p>
                          
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response here..."
                            className="w-full bg-main/60 border border-subtle rounded-lg p-4 text-secondary placeholder:text-secondary/40 focus:outline-none focus:border-romantic/40 focus:ring-1 focus:ring-romantic/20 resize-none h-40 mb-6"
                          />
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setShowResponseModal(false);
                                setResponseText('');
                              }}
                              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-subtle rounded-lg transition-colors font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleShareResponse}
                              disabled={isSubmittingResponse || !responseText.trim()}
                              className="flex-1 px-4 py-2 bg-romantic hover:bg-romantic/80 rounded-lg transition-colors font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <span>{isSubmittingResponse ? 'Sending...' : 'Share'}</span>
                              {!isSubmittingResponse && <span className="material-symbols-outlined text-base">send</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-secondary/30">inbox</span>
              <p className="text-sm text-secondary">No items in your inbox</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
