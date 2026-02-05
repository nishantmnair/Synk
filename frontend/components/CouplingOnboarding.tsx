
import React, { useState, useEffect } from 'react';
import { coupleApi, couplingCodeApi } from '../services/djangoApi';
import { User } from '../services/djangoAuth';
import { getDisplayName } from '../utils/userDisplay';
import { getActionErrorMessage } from '../utils/errorMessages';

interface CouplingOnboardingProps {
  currentUser: User | null;
  onComplete: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const CouplingOnboarding: React.FC<CouplingOnboardingProps> = ({ onComplete, showToast }) => {
  const [step, setStep] = useState<'choose' | 'generate' | 'join'>('choose');
  const [couplingCode, setCouplingCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCoupled, setIsCoupled] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [successfullyJoined, setSuccessfullyJoined] = useState(false);

  // Check if already coupled
  useEffect(() => {
    checkCoupleStatus();
  }, []);

  // Handle auto-completion after coupling
  useEffect(() => {
    if (isCoupled && partner) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCoupled, partner, onComplete]);

  // Handle completion after successfully joining with a code
  useEffect(() => {
    if (successfullyJoined) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successfullyJoined, onComplete]);

  const checkCoupleStatus = async () => {
    try {
      const coupleData = await coupleApi.get() as any;
      if (coupleData.is_coupled && coupleData.partner) {
        setIsCoupled(true);
        setPartner(coupleData.partner);
      }
    } catch (error) {
      // Not coupled, continue with onboarding
    }
  };

  const generateCouplingCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      const codeData = await couplingCodeApi.create() as any;
      setCouplingCode(codeData.code);
      setCodeExpiresAt(codeData.expires_at);
      setStep('generate');
    } catch (error: any) {
      const errorMsg = getActionErrorMessage('generate_code', error);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const useCouplingCode = async () => {
    if (!joinCode.trim()) {
      setError('Please enter an 8-character coupling code');
      return;
    }

    if (joinCode.length !== 8) {
      setError('Coupling code must be 8 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      await couplingCodeApi.use(joinCode.trim().toUpperCase());
      await checkCoupleStatus();
      setJoinCode('');
      setIsCoupled(true);
      setSuccessfullyJoined(true);
      showToast?.('Connected! You can now share your couple space.', 'success');
    } catch (error: any) {
      const errorMsg = getActionErrorMessage('use_code', error);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping, but still complete onboarding
    onComplete();
  };


  if (isCoupled && partner) {
    return (
      <div className="fixed inset-0 bg-main z-50 flex items-center justify-center p-6">
        <div className="bg-card border border-romantic/20 rounded-2xl p-8 max-w-2xl w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-romantic/20 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-romantic">favorite</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">You're Connected!</h2>
            <p className="text-secondary text-lg">
              Successfully coupled with <span className="text-romantic font-semibold">{getDisplayName(partner)}</span>
            </p>
          </div>
          <p className="text-secondary/70 text-sm">Taking you to your shared space...</p>
        </div>
      </div>
    );
  }

  if (step === 'generate' && couplingCode) {
    return (
      <div className="fixed inset-0 bg-main z-50 flex items-center justify-center p-6">
        <div className="bg-card border border-subtle rounded-2xl p-8 max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Share Your Coupling Code</h2>
            <p className="text-secondary">Give this code to your partner so they can connect their account</p>
          </div>

          <div className="bg-accent/5 border-2 border-accent/30 rounded-2xl p-8 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-secondary">Your Coupling Code</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(couplingCode);
                  showToast?.('Code copied to clipboard!', 'success');
                }}
                className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors"
              >
                Copy Code
              </button>
            </div>
            <p className="text-5xl font-black tracking-widest text-accent font-mono text-center py-4">{couplingCode}</p>
            {codeExpiresAt && (
              <p className="text-xs text-secondary/70 text-center">
                Expires: {new Date(codeExpiresAt).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-secondary text-center pt-2">
              Your partner can enter this code when they sign up or in their settings.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-white/5 border border-subtle text-secondary rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="fixed inset-0 bg-main z-50 flex items-center justify-center p-6">
        <div className="bg-card border border-subtle rounded-2xl p-8 max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Join with Partner Code</h2>
            <p className="text-secondary">Enter the coupling code your partner gave you</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="join-code" className="block text-sm font-medium text-secondary mb-3 text-center">
                Enter Coupling Code
              </label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setError('');
                }}
                placeholder="Enter 8-character code"
                maxLength={8}
                className="w-full bg-white/5 border-2 border-subtle rounded-xl px-6 py-4 text-primary text-center text-3xl font-mono tracking-widest focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('choose')}
              className="px-6 py-3 bg-white/5 border border-subtle text-secondary rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={useCouplingCode}
              disabled={isLoading || !joinCode.trim()}
              className="flex-1 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect Accounts'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Choose option
  return (
    <div className="fixed inset-0 bg-main z-50 flex items-center justify-center p-6">
      <div className="bg-card border border-subtle rounded-2xl p-8 max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-accent">people</span>
          </div>
          <h2 className="text-3xl font-bold">Connect with Your Partner</h2>
          <p className="text-secondary text-lg">
            Link your accounts to share tasks, milestones, and memories together
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generate Code Option */}
          <button
            onClick={generateCouplingCode}
            disabled={isLoading}
            className="bg-white/5 border-2 border-subtle rounded-2xl p-8 space-y-4 hover:border-accent/50 hover:bg-accent/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">vpn_key</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Generate Code</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Create a coupling code to share with your partner. They'll use it to connect their account.
              </p>
            </div>
            {isLoading && (
              <p className="text-xs text-accent">Generating...</p>
            )}
          </button>

          {/* Join with Code Option */}
          <button
            onClick={() => setStep('join')}
            disabled={isLoading}
            className="bg-white/5 border-2 border-subtle rounded-2xl p-8 space-y-4 hover:border-romantic/50 hover:bg-romantic/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-romantic/20 flex items-center justify-center text-romantic group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">login</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Join with Code</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Already have a coupling code? Enter it here to connect with your partner's account.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-4 border-t border-subtle">
          <button
            onClick={handleSkip}
            className="w-full px-6 py-3 bg-white/5 border border-subtle text-secondary rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            Skip for Now
          </button>
          <p className="text-xs text-secondary/70 text-center mt-3">
            You can always connect accounts later in Settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default CouplingOnboarding;
