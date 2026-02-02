
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Task, Collection, TaskStatus } from '../types';

interface CollectionViewProps {
  tasks: Task[];
  collections: Collection[];
  onAddTask: (task: Task) => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ tasks, collections, onAddTask }) => {
  const { collectionId } = useParams<{ collectionId: string }>();
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
            onClick={() => {
                const title = prompt(`What ${collection.name} idea do you have?`);
                if (title) {
                    onAddTask({
                        id: Math.random().toString(36).substr(2, 9),
                        title,
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
                }
            }}
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
              <div key={task.id} className="bg-card border border-subtle rounded-2xl p-5 hover:border-accent/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle liked state - visual feedback only
                      }}
                      className="text-sm hover:scale-110 transition-transform"
                      title="Like"
                    >
                      ❤️
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle fired state - visual feedback only
                      }}
                      className="text-sm hover:scale-110 transition-transform"
                      title="Fire"
                    >
                      🔥
                    </button>
                </div>

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
                    <span className="material-symbols-outlined text-secondary text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
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
    </div>
  );
};

export default CollectionView;
