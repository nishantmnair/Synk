
import React, { useState } from 'react';
import { Milestone } from '../types';

interface MilestonesViewProps {
  milestones: Milestone[];
  onAddMilestone: (milestone: any) => Promise<void>;
  onUpdateMilestone: (id: string, updates: any) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  showConfirm?: (config: any) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface IconOption {
  id: string;
  icon: string;
  name: string;
}

const ICON_OPTIONS: IconOption[] = [
  { id: 'place', icon: 'place', name: 'Destination' },
  { id: 'favorite', icon: 'favorite', name: 'Love' },
  { id: 'celebration', icon: 'celebration', name: 'Celebration' },
  { id: 'home', icon: 'home', name: 'Home' },
  { id: 'diamond', icon: 'diamond', name: 'Engagement' },
  { id: 'cake', icon: 'cake', name: 'Anniversary' },
  { id: 'star', icon: 'star', name: 'Achievement' },
  { id: 'flight_takeoff', icon: 'flight_takeoff', name: 'Adventure' },
  { id: 'auto_awesome', icon: 'auto_awesome', name: 'Special' },
  { id: 'people', icon: 'people', name: 'Family' },
  { id: 'landscape', icon: 'landscape', name: 'Vacation' },
  { id: 'target', icon: 'target', name: 'Goal' },
];

const MilestonesView: React.FC<MilestonesViewProps> = ({ 
  milestones, 
  onAddMilestone, 
  onUpdateMilestone, 
  onDeleteMilestone,
  showConfirm,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Upcoming' | 'Completed' | 'Dreaming'>('All');
  const [proTip] = useState("Dreaming together is the first step. Keep working towards your shared goals!");

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Completed' | 'Dreaming'>('Upcoming');
  const [icon, setIcon] = useState('flag');

  // Calculate actual progress from milestones
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const upcomingCount = milestones.filter(m => m.status === 'Upcoming').length;
  const dreamingCount = milestones.filter(m => m.status === 'Dreaming').length;

  // Filter milestones based on selected status
  const filteredMilestones = filterStatus === 'All' 
    ? milestones 
    : milestones.filter(m => m.status === filterStatus);

  const openAddModal = () => {
    setEditingMilestone(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setName(milestone.name);
    setDate(milestone.date);
    setStatus(milestone.status as 'Upcoming' | 'Completed' | 'Dreaming');
    setIcon(milestone.icon);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDate('');
    setStatus('Upcoming');
    setIcon('flag');
    setEditingMilestone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date.trim()) {
      showToast?.('Please fill in all required fields', 'error');
      return;
    }

    try {
      const milestoneData = {
        name,
        date,
        status,
        icon,
      };

      if (editingMilestone) {
        await onUpdateMilestone(editingMilestone.id, milestoneData);
        showToast?.(`Milestone updated successfully`, 'success');
      } else {
        await onAddMilestone(milestoneData);
        showToast?.(`Milestone created successfully`, 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast?.('Failed to save milestone', 'error');
      console.error('Error saving milestone:', error);
    }
  };

  const handleDeleteMilestone = (milestone: Milestone) => {
    showConfirm?.({
      title: 'Delete Milestone?',
      message: `Are you sure you want to delete "${milestone.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await onDeleteMilestone(milestone.id);
          showToast?.('Milestone deleted successfully', 'success');
        } catch (error) {
          showToast?.('Failed to delete milestone', 'error');
          console.error('Error deleting milestone:', error);
        }
      }
    });
  };

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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl font-bold text-accent">{overallProgress}%</span>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Overall Progress</p>
              </div>
              <button 
                onClick={openAddModal}
                className="bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-accent/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Milestone
              </button>
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

        {/* Filter Tabs */}
        {totalMilestones > 0 && (
          <div className="flex gap-2 border-b border-subtle">
            {(['All', 'Upcoming', 'Completed', 'Dreaming'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  filterStatus === status
                    ? 'text-accent border-accent'
                    : 'text-secondary border-transparent hover:text-primary'
                }`}
              >
                {status}
                {status === 'All' && totalMilestones > 0 && <span className="ml-2 text-xs bg-white/5 px-2 py-0.5 rounded-full">{totalMilestones}</span>}
                {status === 'Upcoming' && <span className="ml-2 text-xs bg-white/5 px-2 py-0.5 rounded-full">{upcomingCount}</span>}
                {status === 'Completed' && <span className="ml-2 text-xs bg-white/5 px-2 py-0.5 rounded-full">{completedMilestones}</span>}
                {status === 'Dreaming' && <span className="ml-2 text-xs bg-white/5 px-2 py-0.5 rounded-full">{dreamingCount}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Milestones Table or Empty State */}
        {filteredMilestones.length === 0 ? (
          <div className="bg-card border border-subtle rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-subtle mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl opacity-20">flag</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No {filterStatus !== 'All' ? filterStatus : ''} Milestones</h3>
                <p className="text-sm text-secondary">
                  {filterStatus !== 'All' ? `You don't have any ${filterStatus.toLowerCase()} milestones yet.` : 'Start tracking your shared goals and dreams together!'}
                </p>
              </div>
              <button 
                onClick={openAddModal}
                className="mt-4 bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-accent/20"
              >
                Add Your First Milestone
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-subtle rounded-xl shadow-sm relative">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-subtle">
                    <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest">Milestone</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest">Target Date</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {filteredMilestones.map(m => (
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openEditModal(m)}
                            className="text-secondary hover:text-primary transition-colors p-2"
                            title="Edit milestone"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteMilestone(m)}
                            className="text-secondary hover:text-red-400 transition-colors p-2"
                            title="Delete milestone"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
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

      {/* Modal for creating/editing milestones */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">{icon}</span>
              {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Milestone Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  Milestone Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., First anniversary trip, Buy a house, Get married"
                  className="w-full px-4 py-2.5 bg-white/5 border border-subtle rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-subtle rounded-lg text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  Status
                </label>
                <div className="flex gap-2">
                  {(['Upcoming', 'Completed', 'Dreaming'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                        status === s
                          ? s === 'Completed' ? 'bg-green-400/10 border-green-400/30 text-green-400' :
                            s === 'Upcoming' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
                            'bg-white/10 border-white/20 text-primary'
                          : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIcon(opt.icon)}
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-center group ${
                        icon === opt.icon
                          ? 'bg-accent/20 border-accent text-accent'
                          : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10 hover:border-white/20'
                      }`}
                      title={opt.name}
                    >
                      <span className="material-symbols-outlined">{opt.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-white/5 text-secondary hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-accent text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-accent/20"
                >
                  {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestonesView;
