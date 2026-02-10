import React, { useState, useEffect } from 'react';
import { coupleApi, couplingCodeApi, accountApi, preferencesApi } from '../services/djangoApi';
import { User, djangoAuthService } from '../services/djangoAuth';
import { djangoRealtimeService } from '../services/djangoRealtime';
import { getDisplayName, getEmailOrUsername } from '../utils/userDisplay';
import { getActionErrorMessage, extractErrorMessage } from '../utils/errorMessages';
import DeleteAccountModal from './DeleteAccountModal';

interface SettingsViewProps {
  currentUser: User | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showConfirm?: (config: any) => void;
  onLogout?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showToast, showConfirm, onLogout }) => {
  const [anniversary, setAnniversary] = useState('2024-01-15');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [preferencesId, setPreferencesId] = useState<number | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  
  // Track originally loaded values to detect changes
  const [loadedAnniversary, setLoadedAnniversary] = useState('2024-01-15');
  
  // Coupling state
  const [isCoupled, setIsCoupled] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [couplingCode, setCouplingCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [couplingError, setCouplingError] = useState('');

  // Password reset state
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Load preferences and couple status on mount
  useEffect(() => {
    loadPreferences();
    loadCoupleStatus();
    loadCouplingCodes();
  }, []);

  // Set up real-time listeners for preference updates and uncoupling
  useEffect(() => {
    const handlePreferencesUpdate = (data: any) => {
      setAnniversary(data.anniversary || anniversary);
      setLoadedAnniversary(data.anniversary || anniversary);
      setSaveStatus('saved');
      showToast?.('Anniversary date updated by your partner', 'info');
    };

    const handleUncoupled = (data: any) => {
      setIsCoupled(false);
      setPartner(null);
      showToast?.(data.message || 'You have been uncoupled.', 'info');
    };

    djangoRealtimeService.on('preferences:updated', handlePreferencesUpdate);
    djangoRealtimeService.on('couple:uncoupled', handleUncoupled);
    return () => {
      djangoRealtimeService.off('preferences:updated', handlePreferencesUpdate);
      djangoRealtimeService.off('couple:uncoupled', handleUncoupled);
    };
  }, [anniversary, showToast]);

  // Check if there are unsaved changes
  useEffect(() => {
    const hasChanges = loadedAnniversary !== anniversary;
    
    if (hasChanges && !isLoadingPreferences) {
      setSaveStatus('unsaved');
    }
  }, [anniversary, isLoadingPreferences, loadedAnniversary]);

  // Save preferences to backend
  const savePreferences = async () => {
    if (!preferencesId) return;
    try {
      setSaveStatus('saving');
      await preferencesApi.update(preferencesId, {
        anniversary,
      });
      setSaveStatus('saved');
      // Update loaded values to match current values
      setLoadedAnniversary(anniversary);
      showToast?.('Anniversary date saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('unsaved');
      const errorMsg = getActionErrorMessage('save_settings', error);
      showToast?.(errorMsg, 'error');
    }
  };

  // Load preferences from backend
  const loadPreferences = async () => {
    try {
      setIsLoadingPreferences(true);
      const prefs = await preferencesApi.get() as any;
      if (prefs) {
        const anniv = prefs.anniversary || '2024-01-15';
        
        setAnniversary(anniv);
        setPreferencesId(prefs.id);
        
        // Set loaded values to match current values
        setLoadedAnniversary(anniv);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      const errorMsg = extractErrorMessage(error);
      showToast?.(errorMsg, 'error');
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
      showToast?.('Coupling code generated! Share it with your partner.', 'success');
    } catch (error: any) {
      const errorMsg = getActionErrorMessage('generate_code', error);
      setCouplingError(errorMsg);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const useCouplingCode = async () => {
    if (!joinCode.trim()) {
      setCouplingError('Please enter an 8-character coupling code');
      return;
    }

    if (joinCode.length !== 8) {
      setCouplingError('Coupling code must be 8 characters long');
      return;
    }
    
    try {
      setIsLoadingCode(true);
      setCouplingError('');
      await couplingCodeApi.use(joinCode.trim().toUpperCase());
      await loadCoupleStatus();
      setJoinCode('');
      showToast?.('Connected successfully! You can now share your couple space with your partner.', 'success');
    } catch (error: any) {
      const errorMsg = getActionErrorMessage('use_code', error);
      setCouplingError(errorMsg);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleUncouple = async () => {
    showConfirm({
      title: 'Disconnect Partner',
      message: 'You will no longer be able to share your couple space with your partner. They will be notified immediately.',
      confirmText: 'Disconnect',
      confirmVariant: 'danger' as const,
      onConfirm: async () => {
        try {
          setIsLoadingCode(true);
          setCouplingError('');
          await coupleApi.uncouple();
          setIsCoupled(false);
          setPartner(null);
          await loadCouplingCodes();
          showToast?.('Disconnected from your partner.', 'success');
        } catch (error: any) {
          const errorMsg = getActionErrorMessage('uncouple', error);
          setCouplingError(errorMsg);
        } finally {
          setIsLoadingCode(false);
        }
      }
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!currentPassword.trim()) {
      setResetError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setResetError('New password is required');
      return;
    }

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setResetError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setResetError('New password must be different from current password');
      return;
    }

    try {
      setIsResettingPassword(true);
      await accountApi.changePassword(currentPassword, newPassword, newPasswordConfirm);
      showToast?.('Password successfully changed.', 'success');
      setIsPasswordResetModalOpen(false);
      resetPasswordForm();
    } catch (error: any) {
      const errorMsg = getActionErrorMessage('password_change', error);
      setResetError(errorMsg);
      showToast?.(errorMsg, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setResetError('');
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
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-romantic/20 flex items-center justify-center text-romantic flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Connected with {getDisplayName(partner)}</p>
                  <p className="text-[11px] text-secondary">{getEmailOrUsername(partner) ?? '—'}</p>
                </div>
                <button
                  onClick={handleUncouple}
                  disabled={isLoadingCode}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 active:scale-95 min-h-10 flex items-center justify-center"
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
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-lg text-sm space-y-1 flex gap-3 animate-in shake-in-x mt-2">
                      <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                      <span>{couplingError}</span>
                    </div>
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Anniversary Date</p>
                <p className="text-[11px] text-secondary">We'll notify you both a week before.</p>
              </div>
              <input 
                type="date" 
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={isLoadingPreferences}
                className="w-full md:w-auto bg-white/5 border border-subtle rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-accent outline-none disabled:opacity-50 min-h-10"
              />
            </div>

            <div className="h-px bg-subtle"></div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 px-2">Danger Zone</h3>
          <div className="bg-red-400/5 border border-red-400/20 rounded-2xl p-6 space-y-4">
            <button 
              onClick={() => setIsPasswordResetModalOpen(true)}
              className="w-full px-4 py-2.5 bg-orange-500/20 border border-orange-400 text-orange-400 hover:bg-orange-500/30 hover:border-orange-300 hover:text-orange-300 active:bg-orange-500/40 transition-colors text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95 min-h-10 flex items-center justify-center"
            >
              Change Password
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full px-4 py-2.5 bg-red-500/20 border border-red-400 text-red-400 hover:bg-red-500/30 hover:border-red-300 hover:text-red-300 active:bg-red-500/40 transition-colors text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95 min-h-10 flex items-center justify-center"
            >
              Delete Account
            </button>
            <p className="text-[10px] text-red-400/60 uppercase">These actions are irreversible. Proceed with caution.</p>
          </div>
        </section>

        <div className="text-center pt-8 space-y-4 flex justify-center">
          {saveStatus === 'unsaved' && (
            <button
              onClick={savePreferences}
              disabled={saveStatus === 'saving' || isLoadingPreferences}
              className="px-6 py-2.5 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-10 flex items-center justify-center"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setIsPasswordResetModalOpen(false);
              resetPasswordForm();
            }}
          />
          <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-subtle bg-white/2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-400">lock</span>
                </div>
                <h2 className="text-xl font-bold">Change Password</h2>
              </div>
              <button
                onClick={() => {
                  setIsPasswordResetModalOpen(false);
                  resetPasswordForm();
                }}
                className="material-symbols-outlined text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg text-sm flex gap-3">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">info</span>
                <span>Change your password to keep your account secure.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={isResettingPassword}
                  className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isResettingPassword}
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  {newPassword.length > 0 && (
                    <span className={`absolute right-3 top-3 text-2xl ${newPassword.length >= 8 ? 'text-accent' : 'text-secondary'}`}>
                      {newPassword.length >= 8 ? '✓' : '○'}
                    </span>
                  )}
                </div>
                {newPassword.length > 0 && (
                  <p className={`text-xs mt-1.5 ${newPassword.length >= 8 ? 'text-accent' : 'text-orange-400'}`}>
                    {newPassword.length >= 8 ? '✓ Strong password' : '✗ Minimum 8 characters'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    disabled={isResettingPassword}
                    className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  {newPasswordConfirm.length > 0 && (
                    <span className={`absolute right-3 top-3 text-2xl ${newPassword === newPasswordConfirm && newPassword.length >= 8 ? 'text-accent' : 'text-orange-400'}`}>
                      {newPassword === newPasswordConfirm && newPassword.length >= 8 ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {newPasswordConfirm.length > 0 && (
                  <p className={`text-xs mt-1.5 ${newPassword === newPasswordConfirm && newPassword.length >= 8 ? 'text-accent' : 'text-orange-400'}`}>
                    {newPassword === newPasswordConfirm && newPassword.length >= 8 ? '✓ Passwords match' : '✗ Passwords do not match or are too short'}
                  </p>
                )}
              </div>

              {resetError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-lg text-sm space-y-1 flex gap-3 animate-in shake-in-x">
                  <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                  <span>{resetError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResettingPassword || !currentPassword.trim() || !newPassword.trim() || !newPasswordConfirm.trim() || newPassword !== newPasswordConfirm || newPassword.length < 8 || currentPassword === newPassword}
                className="w-full px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-10 flex items-center justify-center gap-2 mt-6"
              >
                {isResettingPassword ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">lock</span>
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default SettingsView;
