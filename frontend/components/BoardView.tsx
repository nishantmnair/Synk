
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';

interface BoardViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onAction: (action: string, item: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  showConfirm?: (config: any) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ tasks, setTasks, onAction, onAddTask, onUpdateTask, onDeleteTask, showConfirm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const columns = [
    { title: 'Backlog', status: TaskStatus.BACKLOG, icon: 'inventory_2' },
    { title: 'Planning', status: TaskStatus.PLANNING, icon: 'calendar_add_on' },
    { title: 'Upcoming', status: TaskStatus.UPCOMING, icon: 'schedule', accent: 'text-green-500' }
  ];

  const toggleTaskMeta = (id: string, key: 'liked' | 'fired') => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newVal = !t[key];
        if (newVal) onAction(key === 'liked' ? 'liked' : 'highlighted', t.title);
        return { ...t, [key]: newVal };
      }
      return t;
    }));
  };

  const openAddModal = (status: TaskStatus) => {
    setModalStatus(status);
    setEditingTask(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setCategory(task.category);
    setPriority(task.priority);
    setDescription(task.description || '');
    setTime(task.time || '');
    setModalStatus(task.status);
    setIsModalOpen(true);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== targetStatus) {
      onUpdateTask(draggedTask.id, { status: targetStatus });
    }
    setDraggedTask(null);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title,
        category: category || 'General',
        priority,
        status: modalStatus,
        description: description || undefined,
        time: time || undefined
      });
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        category: category || 'General',
        priority,
        status: modalStatus,
        liked: false,
        fired: false,
        progress: 0,
        alexProgress: 0,
        samProgress: 0,
        avatars: [],
        description: description || undefined,
        time: time || undefined
      };
      onAddTask(newTask);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setPriority('medium');
    setDescription('');
    setTime('');
    setEditingTask(null);
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex p-6 gap-6 overflow-x-auto custom-scrollbar relative">
      {columns.map(col => (
        <div 
          key={col.title} 
          className="w-80 flex flex-col shrink-0"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.status)}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${col.accent || 'text-secondary'} text-[18px]`}>{col.icon}</span>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <span className="text-xs text-secondary bg-white/5 px-1.5 py-0.5 rounded">
                {tasks.filter(t => t.status === col.status).length}
              </span>
            </div>
            <button 
              onClick={() => openAddModal(col.status)}
              className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[18px]"
            >
              add
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {tasks.filter(t => t.status === col.status).map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                onClick={() => openEditModal(task)}
                className={`bg-card border border-subtle rounded-lg p-3 hover:bg-zinc-800/80 transition-colors cursor-pointer group shadow-sm ${task.status === TaskStatus.UPCOMING ? 'ring-1 ring-accent/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${task.priority === 'high' ? 'text-amber-400' : 'text-secondary'}`}>
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={(e) => { e.stopPropagation(); toggleTaskMeta(task.id, 'liked'); }}
                      className={`text-sm cursor-pointer transition-opacity ${task.liked ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      ❤️
                    </span>
                    <span 
                      onClick={(e) => { e.stopPropagation(); toggleTaskMeta(task.id, 'fired'); }}
                      className={`text-sm cursor-pointer transition-opacity ${task.fired ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      🔥
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                {task.description && <p className="text-xs text-secondary mb-3">{task.description}</p>}
                {task.time && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-medium text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{task.time}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-secondary border border-subtle">
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showConfirm) {
                          showConfirm({
                            title: 'Delete Task',
                            message: 'Are you sure you want to delete this task?',
                            confirmText: 'Delete',
                            confirmVariant: 'danger' as const,
                            onConfirm: () => onDeleteTask(task.id)
                          });
                        } else {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            onDeleteTask(task.id);
                          }
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="flex -space-x-1.5">
                      {task.avatars.map((av, idx) => (
                        <img key={idx} className="w-5 h-5 rounded-full border border-card bg-zinc-700" src={av} alt="user" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-1 w-full bg-white/5 rounded-full flex overflow-hidden">
                  <div className="bg-romantic" style={{ width: `${task.samProgress}%` }}></div>
                  <div className="bg-accent" style={{ width: `${task.alexProgress}%` }}></div>
                </div>
              </div>
            ))}

            {/* Empty state within column */}
            {tasks.filter(t => t.status === col.status).length === 0 && (
              <button 
                onClick={() => openAddModal(col.status)}
                className="w-full py-8 border border-dashed border-subtle rounded-lg flex flex-col items-center justify-center gap-2 text-secondary hover:text-primary hover:border-accent/40 transition-all group"
              >
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-xs font-medium">Add to {col.title}</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={resetForm}
          ></div>
          <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-subtle flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">edit_note</span>
                {editingTask ? 'Edit Shared Plan' : 'New Shared Plan'}
              </h2>
              <button onClick={resetForm} className="material-symbols-outlined text-secondary hover:text-primary transition-colors">close</button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="plan-title" className="text-[10px] font-bold uppercase tracking-widest text-secondary">What should we do?</label>
                <input 
                  id="plan-title"
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g., Weekend trip to the coast"
                  className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-secondary/40"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="plan-category" className="text-[10px] font-bold uppercase tracking-widest text-secondary">Category</label>
                  <input 
                    id="plan-category"
                    type="text"
                    placeholder="Adventure, Travel..."
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-secondary/40"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="plan-priority" className="text-[10px] font-bold uppercase tracking-widest text-secondary">Priority</label>
                  <select 
                    id="plan-priority"
                    className="w-full bg-sidebar border border-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="plan-description" className="text-[10px] font-bold uppercase tracking-widest text-secondary">Description (Optional)</label>
                <textarea 
                  id="plan-description"
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-secondary/40 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plan-time" className="text-[10px] font-bold uppercase tracking-widest text-secondary">Time (Optional)</label>
                <input 
                  id="plan-time"
                  type="text"
                  placeholder="e.g., 8:00 PM"
                  className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-secondary/40"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-secondary/60 italic mb-4">
                  This will be added to the <span className="text-accent font-bold italic">{modalStatus}</span> column for both of you to see.
                </p>
                <button 
                  type="submit"
                  className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.98]"
                >
                  {editingTask ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
