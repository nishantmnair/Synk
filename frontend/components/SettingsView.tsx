
import React, { useState, useEffect } from 'react';
import { coupleApi, couplingCodeApi, accountApi, preferencesApi } from '../services/djangoApi';
import { User, djangoAuthService } from '../services/djangoAuth';
import { djangoRealtimeService } from '../services/djangoRealtime';
import { getDisplayName, getEmailOrUsername } from '../utils/userDisplay';
import DeleteAccountModal from './DeleteAccountModal';

interface SettingsViewProps {
  currentUser: User | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showConfirm?: (config: any) => void;
  onLogout?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showToast, showConfirm, onLogout }) => {
  const [anniversary, setAnniversary] = useState('2024-01-15');
  const [isPrivate, setIsPrivate] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [preferencesId, setPreferencesId] = useState<number | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  
  // Coupling state
  const [isCoupled, setIsCoupled] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [couplingCode, setCouplingCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [couplingError, setCouplingError] = useState('');

  // Load preferences and couple status on mount
  useEffect(() => {
    loadPreferences();
    loadCoupleStatus();
    loadCouplingCodes();
  }, []);

  // Set up real-time listeners for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (data: any) => {
      setAnniversary(data.anniversary || anniversary);
      setIsPrivate(data.is_private ?? isPrivate);
      setNotifications(data.notifications ?? notifications);
      showToast?.('Anniversary date updated by your partner', 'info');
    };

    djangoRealtimeService.on('preferences:updated', handlePreferencesUpdate);
    return () => {
      djangoRealtimeService.off('preferences:updated', handlePreferencesUpdate);
    };
  }, [anniversary, isPrivate, notifications, showToast]);

  // Auto-save preferences to backend
  useEffect(() => {
    if (!preferencesId) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await preferencesApi.update(preferencesId, {
          anniversary,
          is_private: isPrivate,
          notifications,
        });
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save preferences:', error);
        setSaveStatus('saved');
      }
    }, 500);

    setSaveStatus('unsaved');
    return () => clearTimeout(timer);
  }, [anniversary, isPrivate, notifications, preferencesId]);

  // Load preferences from backend
  const loadPreferences = async () => {
    try {
      setIsLoadingPreferences(true);
      const prefs = await preferencesApi.get() as any;
      if (prefs) {
        setAnniversary(prefs.anniversary || '2024-01-15');
        setIsPrivate(prefs.is_private ?? true);
        setNotifications(prefs.notifications ?? true);
        setPreferencesId(prefs.id);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const loadCoupleStatus = async () => {
    try {
      const coupleData = await coupleApi.get() as any;
      if (coupleData.is_coupled && coupleData.partner) {
        setIsCoupled(true);
        setPartner(coupleData.partner);
      } else {
        setIsCoupled(false);
        setPartner(null);
      }
    } catch (error: any) {
      setIsCoupled(false);
      setPartner(null);
    }
  };

  const loadCouplingCodes = async () => {
    try {
      const codes = await couplingCodeApi.getAll() as any[];
      if (codes && codes.length > 0) {
        const latestCode = codes[0];
        setCouplingCode(latestCode.code);
        setCodeExpiresAt(latestCode.expires_at);
      }
    } catch (error) {
      // No active codes
      setCouplingCode(null);
    }
  };

  const generateCouplingCode = async () => {
    try {
      setIsLoadingCode(true);
      setCouplingError('');
      const codeData = await couplingCodeApi.create() as any;
      setCouplingCode(codeData.code);
      setCodeExpiresAt(codeData.expires_at);
    } catch (error: any) {
      setCouplingError(error.message || 'Failed to generate code');
    } finally {
      setIsLoadingCode(false);
    }
  };

  const useCouplingCode = async () => {
    if (!joinCode.trim()) {
      setCouplingError('Please enter a coupling code');
      return;
    }
    
    try {
      setIsLoadingCode(true);
      setCouplingError('');
      await couplingCodeApi.use(joinCode.trim().toUpperCase());
      await loadCoupleStatus();
      setJoinCode('');
      showToast?.('Successfully coupled! You can now see your partner\'s data.', 'success');
    } catch (error: any) {
      setCouplingError(error.message || 'Invalid or expired code');
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleUncouple = async () => {
    if (showConfirm) {
      showConfirm({
        title: 'Uncouple Account',
        message: 'Are you sure you want to uncouple? You will no longer share data with your partner.',
        confirmText: 'Uncouple',
        confirmVariant: 'danger' as const,
        onConfirm: async () => {
          try {
            setIsLoadingCode(true);
            setCouplingError('');
            await coupleApi.uncouple();
            setIsCoupled(false);
            setPartner(null);
            await loadCouplingCodes();
            showToast?.('Successfully uncoupled.', 'success');
          } catch (error: any) {
            setCouplingError(error.message || 'Failed to uncouple');
          } finally {
            setIsLoadingCode(false);
          }
        }
      });
    } else {
      const confirmUncouple = window.confirm('Are you sure you want to uncouple? You will no longer share data with your partner.');
      if (!confirmUncouple) return;
      
      try {
        setIsLoadingCode(true);
        setCouplingError('');
        await coupleApi.uncouple();
        setIsCoupled(false);
        setPartner(null);
        await loadCouplingCodes();
        alert('Successfully uncoupled.');
      } catch (error: any) {
        setCouplingError(error.message || 'Failed to uncouple');
      } finally {
        setIsLoadingCode(false);
      }
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      await accountApi.deleteAccount(password);
      showToast?.('Account successfully deleted.', 'success');
      
      // Clear auth state and logout
      await djangoAuthService.logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-secondary text-sm">Manage your shared space and account preferences.</p>
        </div>

        {/* Coupling Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary px-2">Partner Connection</h3>
          {isCoupled && partner ? (
            <div className="bg-card border border-romantic/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-romantic/20 flex items-center justify-center text-romantic">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Connected with {getDisplayName(partner)}</p>
                  <p className="text-[11px] text-secondary">{getEmailOrUsername(partner) ?? '—'}</p>
                </div>
                <button
                  onClick={handleUncouple}
                  disabled={isLoadingCode}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoadingCode ? 'Uncoupling...' : 'Uncouple'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-subtle rounded-2xl p-6 space-y-6">
              {/* Generate Coupling Code */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Generate Coupling Code</p>
                    <p className="text-[11px] text-secondary">Share this code with your partner so they can connect their account.</p>
                  </div>
                  <button
                    onClick={generateCouplingCode}
                    disabled={isLoadingCode || !!couplingCode}
                    className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isLoadingCode ? 'Generating...' : couplingCode ? 'Code Generated' : 'Generate Code'}
                  </button>
                </div>
                
                {couplingCode && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-secondary font-medium">Your Coupling Code</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(couplingCode);
                          showToast?.('Code copied to clipboard!', 'success');
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-2xl font-black tracking-widest text-accent font-mono text-center py-2">{couplingCode}</p>
                    {codeExpiresAt && (
                      <p className="text-[10px] text-secondary text-center">
                        Expires: {new Date(codeExpiresAt).toLocaleString()}
                      </p>
                    )}
                    <p className="text-[10px] text-secondary text-center">
                      Share this code with your partner when they sign up or use it in their settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-subtle"></div>

              {/* Join with Code */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Join with Partner Code</p>
                  <p className="text-[11px] text-secondary mb-3">Didn't enter a coupling code during signup? No worries! Enter your partner's coupling code here to connect your accounts.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        setCouplingError('');
                      }}
                      placeholder="Enter 8-character code"
                      maxLength={8}
                      className="flex-1 bg-white/5 border border-subtle rounded-lg px-4 py-2 text-primary text-center text-lg font-mono tracking-widest focus:ring-1 focus:ring-accent focus:border-accent outline-none"
                    />
                    <button
                      onClick={useCouplingCode}
                      disabled={isLoadingCode || !joinCode.trim()}
                      className="px-6 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isLoadingCode ? 'Joining...' : 'Connect'}
                    </button>
                  </div>
                  {couplingError && (
                    <p className="text-xs text-red-400 mt-2">{couplingError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Couple Settings Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary px-2">Couple Details</h3>
          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Anniversary Date</p>
                <p className="text-[11px] text-secondary">We'll notify you both a week before.</p>
              </div>
              <input 
                type="date" 
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={isLoadingPreferences}
                className="bg-white/5 border border-subtle rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none disabled:opacity-50"
              />
            </div>

            <div className="h-px bg-subtle"></div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Space Privacy</p>
                <p className="text-[11px] text-secondary">Require PIN to open the app on shared devices.</p>
              </div>
              <button 
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isPrivate ? 'bg-accent' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-5' : ''}`}></div>
              </button>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary px-2">Preferences</h3>
          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-[11px] text-secondary">Get alerts when your partner adds or likes an idea.</p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications ? 'bg-romantic' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${notifications ? 'translate-x-5' : ''}`}></div>
              </button>
            </div>
            
            <div className="h-px bg-subtle"></div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Vibe Themes</p>
                <p className="text-[11px] text-secondary">Auto-adjust interface based on your current vibe.</p>
              </div>
              <span className="material-symbols-outlined text-secondary text-sm">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 px-2">Danger Zone</h3>
          <div className="bg-red-400/5 border border-red-400/20 rounded-2xl p-6 space-y-4">
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-500/20 border border-red-400 text-red-400 hover:bg-red-500/30 hover:border-red-300 hover:text-red-300 active:bg-red-500/40 transition-colors text-xs font-bold uppercase tracking-widest rounded-lg"
            >
              Delete Account
            </button>
            <p className="text-[10px] text-red-400/60 uppercase">This action is irreversible and permanently removes your account and data.</p>
          </div>
        </section>

        <div className="text-center pt-8">
           <div className="flex items-center justify-center gap-2 text-xs">
             <span className={`w-2 h-2 rounded-full transition-colors ${
               saveStatus === 'saved' ? 'bg-green-400' : saveStatus === 'saving' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
             }`}></span>
             <span className="text-secondary">
               {isLoadingPreferences ? 'Loading preferences...' : saveStatus === 'saved' ? 'All changes saved automatically' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
             </span>
           </div>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default SettingsView;
