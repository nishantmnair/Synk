
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/djangoAuth';
import { getUserAvatar } from '../utils/avatar';
import { getDisplayName, getEmailOrUsername } from '../utils/userDisplay';


interface HeaderProps {
  currentUser: User | null;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isLeftSidebarOpen: boolean;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showConfirm: (config: any) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  onToggleRightSidebar, 
  isRightSidebarOpen, 
  onToggleLeftSidebar, 
  isLeftSidebarOpen,
  onLogout,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  showConfirm
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const handleAction = (action: string) => {
    setIsProfileOpen(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'signout':
        showConfirm({
          title: 'Sign Out',
          message: 'Are you sure you want to sign out of Synk?',
          confirmText: 'Sign Out',
          confirmVariant: 'primary' as const,
          onConfirm: onLogout
        });
        break;
      default:
        break;
    }
  };

  return (
    <header className="h-14 border-b border-subtle flex items-center justify-between px-4 bg-main sticky top-0 z-50 shrink-0">
      <div className="flex items-center flex-1 gap-4">
        {!isLeftSidebarOpen && (
          <button 
            onClick={onToggleLeftSidebar}
            className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[20px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
            title="Open Sidebar"
          >
            menu
          </button>
        )}
        
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
          <input 
            className="w-full bg-white/5 border border-subtle rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all" 
            placeholder="Search our world..." 
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={onToggleTheme}
          className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[20px] w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5 active:scale-95"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>
        

        <div className="relative flex items-center gap-2">
          {/* Avatar Button */}
          <button 
            onClick={toggleProfile}
            aria-label="Profile"
            className={`w-9 h-9 rounded-full border transition-all overflow-hidden shrink-0 active:scale-95 ${isProfileOpen ? 'border-accent ring-2 ring-accent/20' : 'border-subtle hover:border-secondary'}`}
          >
            <img alt="" className="w-full h-full object-cover" src={getUserAvatar(currentUser)} />
          </button>
          
          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <>
              {/* Invisible Backdrop to close menu */}
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
              
              <div className="absolute right-0 top-11 w-56 bg-card border border-subtle rounded-xl z-20 overflow-hidden">
                {/* User Info Header */}
                <div className="p-4 bg-white/[0.02] border-b border-subtle">
                  <div className="flex items-center gap-2.5 mb-1">
                    <img src={getUserAvatar(currentUser)} className="w-7 h-7 rounded-full border border-card shadow-sm" alt="" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-primary truncate">{getDisplayName(currentUser)}</span>
                      {(() => {
                        const sub = getEmailOrUsername(currentUser);
                        return sub ? <span className="text-[9px] text-secondary/70 truncate" title={sub}>{sub}</span> : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  <button 
                    onClick={() => handleAction('profile')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-secondary hover:text-primary hover:bg-white/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">person</span>
                    <span>My Profile</span>
                  </button>
                  <button 
                    onClick={() => handleAction('settings')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-secondary hover:text-primary hover:bg-white/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">settings</span>
                    <span>Settings</span>
                  </button>
                  
                  <div className="h-px bg-subtle my-1 mx-2"></div>
                  
                  <button 
                    onClick={() => handleAction('signout')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
                
                {/* Footer */}
                <div className="p-2.5 bg-white/[0.01] border-t border-subtle flex justify-center">
                  <span className="text-[8px] text-secondary/30 font-bold uppercase tracking-[0.2em]">Synk Shared Space</span>
                </div>
              </div>
            </>
          )}

          {!isRightSidebarOpen && (
            <button 
              onClick={onToggleRightSidebar}
              className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[20px] ml-1 w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
              title="Show Activity"
            >
              dock_to_left
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
