
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Task, Collection, TaskStatus } from '../types';
import { tasksApi } from '../services/djangoApi';

interface CollectionViewProps {
  tasks: Task[];
  collections: Collection[];
  onAddTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (task: Task) => void;
  showConfirm?: (config: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ tasks, collections, onAddTask, onDeleteTask, onUpdateTask, showConfirm, showToast }) => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const collection = collections.find(c => c.id === collectionId);
  
  if (!collection) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 text-secondary">
        <span className="material-symbols-outlined text-6xl opacity-20">inventory_2</span>
        <p>Collection not found</p>
        <Link to="/board" className="text-accent hover:underline text-sm font-bold">Return to Board</Link>
      </div>
    );
  }

  const filteredTasks = tasks.filter(t => t.category.toLowerCase() === collection.name.toLowerCase());

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
        id: Math.random().toString(36).substr(2, 9),
        title: newTaskTitle,
        category: collection.name,
        priority: 'medium',
        status: TaskStatus.BACKLOG,
        liked: false,
        fired: false,
        progress: 0,
        alexProgress: 0,
        samProgress: 0,
        avatars: []
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = () => {
    if (!selectedTask || !onDeleteTask) return;
    showConfirm({
      title: 'Delete Idea?',
      message: `Are you sure you want to delete "${selectedTask.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger' as const,
      onConfirm: () => {
        onDeleteTask(selectedTask.id);
        setSelectedTask(null);
      }
    });
  };

  const handleSaveNotes = async () => {
    if (!selectedTask) return;
    
    // Only save if notes have changed
    if (taskNotes === (selectedTask.description || '')) {
      setSelectedTask(null);
      return;
    }

    setIsSavingNotes(true);
    try {
      const taskId = parseInt(selectedTask.id);
      if (isNaN(taskId)) throw new Error('Invalid task ID');
      
      await tasksApi.update(taskId, {
        ...selectedTask,
        description: taskNotes
      });
      
      // Update parent component state
      const updatedTask = { ...selectedTask, description: taskNotes };
      onUpdateTask?.(updatedTask);
      
      showToast?.('Notes saved successfully', 'success');
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task notes:', error);
      showToast?.('Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <span className="material-symbols-outlined text-4xl">{collection.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              <p className="text-sm text-secondary mt-1">{filteredTasks.length} shared items in this collection</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsAddingTask(true)}
            className="bg-white/5 border border-subtle hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-base text-accent">add</span>
            Quick Add Idea
          </button>
        </div>

        {/* Content Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-card border border-subtle rounded-2xl p-5 hover:border-accent/30 transition-all group shadow-sm relative">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                        task.status === TaskStatus.UPCOMING ? 'bg-green-500/10 text-green-400' : 
                        task.status === TaskStatus.PLANNING ? 'bg-accent/10 text-accent' : 
                        'bg-white/5 text-secondary'
                    }`}>
                        {task.status}
                    </span>
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-40">{task.priority}</span>
                </div>

                <h3 className="text-base font-semibold group-hover:text-accent transition-colors mb-4">{task.title}</h3>
                
                <div className="flex items-center justify-between pt-4 border-t border-subtle/50">
                    <div className="flex -space-x-1.5">
                        {task.avatars.map((av, idx) => (
                            <img key={idx} src={av} className="w-5 h-5 rounded-full border border-card" alt="user" />
                        ))}
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskNotes(task.description || '');
                      }}
                      className="text-secondary hover:text-accent transition-colors group-hover:opacity-100 focus:outline-none"
                      title="View details"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-subtle mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl opacity-20">folder_open</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary/60">No items here yet</p>
              <p className="text-xs text-secondary">Start adding your {collection.name.toLowerCase()} adventures together!</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsAddingTask(false)}></div>
          <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h3 className="text-sm font-bold">Add to {collection.name}</h3>
              <button onClick={() => setIsAddingTask(false)} className="material-symbols-outlined text-secondary text-lg">close</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTask(); }} className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="task-title" className="text-xs font-bold text-secondary uppercase">What is your idea?</label>
                <input
                  id="task-title"
                  autoFocus
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={`What ${collection.name} idea do you have?`}
                  className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-subtle rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedTask(null)}></div>
          <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h3 className="text-sm font-bold">Idea Details</h3>
              <button onClick={() => setSelectedTask(null)} className="material-symbols-outlined text-secondary text-lg hover:text-primary transition-colors">close</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-2">{selectedTask.title}</h2>
                <div className="flex gap-2">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                    selectedTask.status === TaskStatus.UPCOMING ? 'bg-green-500/10 text-green-400' : 
                    selectedTask.status === TaskStatus.PLANNING ? 'bg-accent/10 text-accent' : 
                    'bg-white/5 text-secondary'
                  }`}>
                    {selectedTask.status}
                  </span>
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-40 px-2 py-1 bg-white/5 rounded">{selectedTask.priority}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="task-notes" className="text-xs font-bold text-secondary uppercase">Notes & Details</label>
                <textarea
                  id="task-notes"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Add any notes or details about this idea..."
                  rows={4}
                  className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              {selectedTask.avatars.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-secondary uppercase mb-2">Added by</p>
                  <div className="flex -space-x-2">
                    {selectedTask.avatars.map((av, idx) => (
                      <img key={idx} src={av} className="w-8 h-8 rounded-full border-2 border-card" alt="user" />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-subtle space-y-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="w-full px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingNotes ? 'Saving...' : 'Done'}
                </button>
                {onDeleteTask && (
                  <button
                    onClick={handleDeleteTask}
                    className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                  >
                    Delete Idea
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionView;
