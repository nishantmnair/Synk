
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/djangoAuth';
import { getUserAvatar } from '../utils/avatar';
import { getDisplayName, getEmailOrUsername } from '../utils/userDisplay';


interface HeaderProps {
  currentUser: User | null;
  vibe: string;
  onVibeChange?: (v: string) => void;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isLeftSidebarOpen: boolean;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showConfirm: (config: any) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  vibe,
  onVibeChange,
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

  // Vibe slot-roller (vertical slot-machine style)
  const presetVibes = [
    'Feeling adventurous',
    'Cozy night in',
    'Spontaneous',
    'Romantic',
    'Feeling curious',
    'Energetic',
    'Relaxed',
    'Playful',
    'Looking to explore',
  ];

  const repeats = 20; // how many times to repeat list for smooth rolling
  const baseRepeatOffset = presetVibes.length * Math.floor(repeats / 2);
  const initialIndex = baseRepeatOffset + (presetVibes.indexOf(vibe) >= 0 ? presetVibes.indexOf(vibe) : 0);

  const [rollIndex, setRollIndex] = useState<number>(initialIndex);
  const [transitionMs, setTransitionMs] = useState<number>(120);
  const rollerRef = React.useRef<number | null>(null);
  const stopTimerRef = React.useRef<number | null>(null);
  const finalTargetRef = React.useRef<number | null>(null);

  const startVibeRoll = () => {
    if (rollerRef.current) return;
    // choose final target now (start) so it's independent of stop timing
    finalTargetRef.current = Math.floor(Math.random() * presetVibes.length);
    setTransitionMs(120);
    rollerRef.current = window.setInterval(() => {
      setRollIndex((i) => i + 1);
    }, 80);
    // auto-stop after 0.75 seconds
    stopTimerRef.current = window.setTimeout(() => {
      stopVibeRoll(true);
    }, 750);
  };

  const stopVibeRoll = (commit = true) => {
    if (!rollerRef.current) return;
    clearInterval(rollerRef.current);
    rollerRef.current = null;
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const len = presetVibes.length;
    const targetMod = finalTargetRef.current ?? Math.floor(Math.random() * len);
    finalTargetRef.current = null;

    // compute normalized landing index (center repeat) for the chosen target
    const normalized = baseRepeatOffset + targetMod;
    // ensure we spin several cycles before landing for a pleasing effect
    const cycles = 8;
    const finalIndex = normalized + cycles * len;

    // animate to finalIndex (slow)
    setTransitionMs(800);
    setRollIndex(finalIndex);

    // after animation completes, snap to the normalized index without transition
    window.setTimeout(() => {
      setTransitionMs(0);
      setRollIndex(normalized);
      // small timeout to ensure DOM updates, then restore transitions
      window.setTimeout(() => setTransitionMs(120), 50);

      const chosen = presetVibes[targetMod];
      if (commit && onVibeChange) onVibeChange(chosen);
    }, 820);
  };

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
          className="material-symbols-outlined text-secondary hover:text-primary transition-colors text-[20px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-card border border-subtle text-sm">
          <span className="text-base">🤗</span>
          <div
            onMouseEnter={startVibeRoll}
            onMouseLeave={() => stopVibeRoll(true)}
            onClick={() => stopVibeRoll(true)}
            title="I'm feeling..."
            className="overflow-hidden h-5 leading-5 text-xs text-secondary font-medium line-clamp-1 max-w-[180px] text-left"
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                transform: `translateY(-${rollIndex * 1.25}rem)`,
                transition: `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                willChange: 'transform'
              }}
            >
              {/* render repeated list for smooth rolling */}
              {Array.from({ length: repeats }).map((_, r) => (
                <div key={r} className="flex flex-col">
                  {presetVibes.map((p, i) => (
                    <div key={i} className="h-5 leading-5 truncate px-1">{p}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        

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
