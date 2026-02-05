import React, { useState } from 'react';
import { getActionErrorMessage } from '../utils/errorMessages';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await onConfirm(password);
      // onConfirm handles logout and redirect
    } catch (err: any) {
      const errorMsg = getActionErrorMessage('delete_account', err);
      setError(errorMsg);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 shadow-xl">
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-400">Delete Account</h3>
                <p className="text-sm text-secondary leading-relaxed mt-2">
                  This action is permanent. Your account and all associated data will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mt-4 space-y-3">
              <div className="flex gap-2 text-sm text-red-400/90">
                <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                <span>All tasks, milestones, and memories deleted</span>
              </div>
              <div className="flex gap-2 text-sm text-red-400/90">
                <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                <span>Account cannot be recovered</span>
              </div>
              <div className="flex gap-2 text-sm text-red-400/90">
                <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                <span>You will be immediately logged out</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-2">Confirm Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-2.5 text-sm placeholder:text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                disabled={isDeleting}
              />
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-subtle text-sm font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
