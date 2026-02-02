
import React from 'react';
import { Activity } from '../types';
import { User } from '../services/djangoAuth';
import { getUserAvatar } from '../utils/avatar';
import { getDisplayName, getEmailOrUsername } from '../utils/userDisplay';

interface ProfileViewProps {
  currentUser: User | null;
  activities: Activity[];
  milestonesCount?: number;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, activities, milestonesCount = 0 }) => {
  const userActivities = currentUser
    ? activities.filter(a => a.user === getDisplayName(currentUser))
    : [];
  const emailOrUsername = getEmailOrUsername(currentUser);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-card/40 p-8 rounded-3xl border border-subtle">
          <div className="relative group">
            <div className="absolute -inset-1 bg-accent/20 rounded-full opacity-25 group-hover:opacity-50"></div>
            <img 
              src={getUserAvatar(currentUser)} 
              className="relative w-32 h-32 rounded-full border-4 border-accent/20 object-cover shadow-2xl" 
              alt="" 
            />
          </div>
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">{getDisplayName(currentUser)}</h1>
            <p className="text-secondary text-sm">
              {emailOrUsername ? `${emailOrUsername} • ` : ''}Joined Synk
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-subtle p-6 rounded-2xl text-center space-y-1">
            <p className="text-2xl font-bold text-accent">{userActivities.length}</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Ideas Shared</p>
          </div>
          <div className="bg-card border border-subtle p-6 rounded-2xl text-center space-y-1">
            <p className="text-2xl font-bold text-romantic">{milestonesCount}</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Milestones</p>
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Your Recent Activity</h3>
            <span className="text-[10px] text-secondary/50">Auto-updating</span>
          </div>
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
