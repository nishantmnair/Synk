
import React, { useState } from 'react';
import { Milestone } from '../types';

interface MilestonesViewProps {
  milestones: Milestone[];
}

const MilestonesView: React.FC<MilestonesViewProps> = ({ milestones }) => {
  const [proTip] = useState("Dreaming together is the first step. Keep working towards your shared goals!");

  // Calculate actual progress from milestones
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const upcomingCount = milestones.filter(m => m.status === 'Upcoming').length;
  const dreamingCount = milestones.filter(m => m.status === 'Dreaming').length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Progress Card */}
        <div className="bg-card border border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">map</span>
                Our Milestones
              </h1>
              <p className="text-sm text-secondary mt-1">{totalMilestones === 0 ? 'Start adding milestones to track your journey together' : `Tracking ${totalMilestones} shared milestone${totalMilestones !== 1 ? 's' : ''}`}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent">{overallProgress}%</span>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Overall Progress</p>
            </div>
          </div>
          <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-accent transition-all" style={{ width: `${overallProgress}%` }}></div>
          </div>
          {totalMilestones > 0 && (
            <div className="flex justify-between mt-3 text-[11px] text-secondary font-medium">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span> {completedMilestones} Completed</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {upcomingCount} Upcoming</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20"></span> {dreamingCount} Dreaming</span>
              </div>
              <span>{completedMilestones} / {totalMilestones} total</span>
            </div>
          )}
        </div>

        {/* Milestones Table */}
        {milestones.length === 0 ? (
          <div className="bg-card border border-subtle rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-subtle mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl opacity-20">flag</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Milestones Yet</h3>
                <p className="text-sm text-secondary">Start tracking your shared goals and dreams together!</p>
              </div>
              <button className="mt-4 bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-accent/20">
                Add Your First Milestone
              </button>
            </div>
          </div>
        ) : (
        <div className="bg-card border border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/5 border-b border-subtle">
                  <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest">Milestone Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest">Target Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest w-48">Partner Excitement</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {milestones.map(m => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-lg group-hover:text-accent transition-colors">{m.icon}</span>
                        <span className="text-sm font-semibold">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${m.status === 'Completed' ? 'text-green-500 font-medium' : 'text-secondary'}`}>{m.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        m.status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                        m.status === 'Upcoming' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                        'text-secondary bg-white/5 border-white/10'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-romantic" style={{ width: `${m.samExcitement}%` }}></div>
                          <div className="h-full bg-accent" style={{ width: `${m.alexExcitement}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-secondary font-bold uppercase">
                          <span>Sam</span>
                          <span>Alex</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'Completed' ? (
                        <button className="text-accent hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ml-auto">
                          View Memory
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      ) : (
                        <button className="text-secondary hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">more_horiz</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Pro Tip Card */}
        {totalMilestones > 0 && (
          <div className="bg-accent/5 border border-accent/20 border-dashed rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-accent">auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Pro Tip</span>
            </div>
            <p className="text-sm text-secondary leading-relaxed italic">
              "{proTip}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestonesView;
