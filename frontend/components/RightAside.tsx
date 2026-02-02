
import React from 'react';
import { Activity, Milestone } from '../types';

interface RightAsideProps {
  activities: Activity[];
  milestones: Milestone[];
  onToggle: () => void;
}

const RightAside: React.FC<RightAsideProps> = ({ activities, milestones, onToggle }) => {
  // Calculate stats from actual data
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <aside className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-subtle flex items-center justify-between sticky top-0 bg-sidebar z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">Our Activity</span>
        <button 
          onClick={onToggle}
          className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[18px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
          title="Collapse Sidebar"
        >
          dock_to_right
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Activity Feed */}
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map(act => (
              <div key={act.id} className="flex gap-3">
                <img className="w-6 h-6 rounded-full bg-zinc-700 shrink-0" src={act.avatar} alt="user" />
                <div>
                  <p className="text-xs leading-snug">
                    <span className="font-semibold">{act.user}</span> {act.action} <span className="text-accent">{act.item}</span>
                  </p>
                  <span className="text-[10px] text-secondary">{act.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <span className="material-symbols-outlined text-3xl text-secondary/20 mb-2">timeline</span>
              <p className="text-xs text-secondary">No activity yet</p>
            </div>
          )}
        </div>

        {/* Journey Stats */}
        <div className="pt-6 border-t border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-4">Our Journey</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card p-3 border border-subtle rounded-lg">
              <p className="text-[10px] text-secondary mb-1">MILESTONES</p>
              <p className="text-xl font-bold">{totalMilestones}</p>
            </div>
            <div className="bg-card p-3 border border-subtle rounded-lg">
              <p className="text-[10px] text-secondary mb-1">COMPLETED</p>
              <p className="text-xl font-bold">{completedMilestones}</p>
            </div>
          </div>
          
          {totalMilestones > 0 && (
            <div className="mt-4 bg-card p-3 border border-subtle rounded-lg">
              <p className="text-[10px] text-secondary mb-2 uppercase font-bold tracking-widest">Progress</p>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-secondary">{completedMilestones} / {totalMilestones} milestones</span>
                <span className="text-[10px] text-secondary font-bold">{progressPercent}%</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};

export default RightAside;
