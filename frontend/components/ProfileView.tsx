
import React from 'react';
import { Activity } from '../types';
import { User } from '../services/djangoAuth';
import { getUserAvatar } from '../utils/avatar';

interface ProfileViewProps {
  currentUser: User | null;
  activities: Activity[];
}

// Helper to get display name (only uses first_name)
const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'User';
  return user.first_name || 'User';
};

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, activities }) => {
  // Filter activities by current user's name
  const userActivities = currentUser 
    ? activities.filter(a => a.user === getUserDisplayName(currentUser))
    : [];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-card/40 p-8 rounded-3xl border border-subtle">
          <div className="relative group">
            <div className="absolute -inset-1 bg-accent/20 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            <img 
              src={getUserAvatar(currentUser)} 
              className="relative w-32 h-32 rounded-full border-4 border-accent/20 object-cover shadow-2xl" 
              alt={getUserDisplayName(currentUser)} 
            />
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      // In a real app, this would upload to a server
                      // TODO: Upload image to backend API
                      alert('Profile picture updated!');
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined text-sm font-bold">camera_alt</span>
            </button>
          </div>
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">{getUserDisplayName(currentUser) || 'User'}</h1>
            <p className="text-secondary text-sm">
              {currentUser?.email ? `${currentUser.email} • ` : ''}Joined Synk
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <span className="px-3 py-1 bg-romantic/10 text-romantic rounded-full text-[10px] font-bold uppercase tracking-wider">Words of Affirmation</span>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-wider">Quality Time</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-subtle p-6 rounded-2xl text-center space-y-1">
            <p className="text-2xl font-bold text-accent">{userActivities.length}</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Ideas Shared</p>
          </div>
          <div className="bg-card border border-subtle p-6 rounded-2xl text-center space-y-1">
            <p className="text-2xl font-bold text-romantic">12</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Milestones Met</p>
          </div>
          <div className="bg-card border border-subtle p-6 rounded-2xl text-center space-y-1">
            <p className="text-2xl font-bold text-green-400">84%</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Vibe Consistency</p>
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary px-2">Your Recent Activity</h3>
          <div className="bg-card border border-subtle rounded-2xl overflow-hidden">
            {userActivities.length > 0 ? (
              <div className="divide-y divide-subtle">
                {userActivities.map(act => (
                  <div key={act.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary text-lg">history</span>
                      <div>
                        <p className="text-sm font-medium">You {act.action} <span className="text-accent">{act.item}</span></p>
                        <p className="text-[10px] text-secondary">{act.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-secondary text-sm italic">
                No recent activity to show.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
