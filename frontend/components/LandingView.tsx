
import React, { useState, useEffect } from 'react';

interface LandingViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, passwordConfirm: string, firstName?: string, lastName?: string, couplingCode?: string) => Promise<void>;
}

const LandingView: React.FC<LandingViewProps> = ({ onLogin, onSignup }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [couplingCode, setCouplingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setFirstName('');
    setLastName('');
    setCouplingCode('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation for signup
    if (isSignup) {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      if (isSignup) {
        await onSignup(email, password, passwordConfirm, firstName, lastName, couplingCode.trim() || undefined);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || (isSignup ? 'Signup failed. Please try again.' : 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main text-primary font-sans overflow-x-hidden relative custom-scrollbar" style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Animated background gradient that follows mouse */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`
        }}
      />

      {/* Navigation Header */}
      <nav className="relative z-50 h-16 flex items-center justify-between px-6 md:px-16 sticky top-0 bg-main/80 backdrop-blur-2xl border-b border-subtle/50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-romantic flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <span className="material-symbols-outlined text-white text-base font-bold">all_inclusive</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Synk</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLogin(true)}
            className="px-5 py-2 bg-white/5 border border-subtle hover:bg-white/10 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-2 hover:scale-105"
          >
            <span className="material-symbols-outlined text-xs">login</span>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section - Asymmetric Layout */}
      <section className="relative z-10 px-6 md:px-16 pt-24 pb-32">
        <div className="max-w-[1600px] mx-auto">
          {/* Left side - Main content */}
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8 md:sticky md:top-32">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-[9px] font-bold uppercase tracking-[0.15em]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                Built for couples who dream together
              </div>

              {/* Main headline - Creative typography */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
                  <span className="block">Your shared</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-romantic to-accent bg-[length:200%_auto] animate-gradient">
                    universe
                  </span>
                  <span className="block">starts here</span>
                </h1>
              </div>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-secondary/90 leading-relaxed max-w-lg font-light">
                Plan adventures, celebrate milestones, and build your future—all in one beautifully private space designed for just the two of you.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button 
                  onClick={() => {
                    setShowLogin(true);
                    setIsSignup(true);
                  }}
                  className="group relative px-8 py-4 bg-primary text-main font-bold rounded-full text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
                >
                  <span className="relative z-10">Start your journey</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-romantic opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button 
                  onClick={() => {
                    const features = document.getElementById('features');
                    features?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-8 py-4 bg-white/5 border border-subtle hover:border-accent/50 text-primary font-semibold rounded-full text-sm transition-all hover:bg-white/10 flex items-center gap-2"
                >
                  <span>Explore features</span>
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </button>
              </div>
            </div>

            {/* Right side - Visual elements */}
            <div className="relative h-[500px] md:h-[600px] lg:h-[700px]">
              {/* Floating cards with staggered animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Card 1 - Top right */}
                  <div className="absolute top-0 right-0 md:right-8 w-64 md:w-72 bg-card/60 backdrop-blur-xl border border-subtle rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-accent">favorite</span>
                      </div>
                      <div>
                        <div className="text-xs text-secondary font-medium">Milestone</div>
                        <div className="text-sm font-bold">First Anniversary</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent to-romantic" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  {/* Card 2 - Center left */}
                  <div className="absolute top-1/2 left-0 md:left-8 -translate-y-1/2 w-64 md:w-72 bg-card/60 backdrop-blur-xl border border-subtle rounded-3xl p-6 shadow-2xl transform -rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105 delay-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-romantic/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-romantic">flight_takeoff</span>
                      </div>
                      <div>
                        <div className="text-xs text-secondary font-medium">Adventure</div>
                        <div className="text-sm font-bold">Japan Trip</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        <span>April 2024</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        <span>Tokyo, Kyoto</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 - Bottom right */}
                  <div className="absolute bottom-0 right-4 md:right-16 w-64 md:w-72 bg-card/60 backdrop-blur-xl border border-subtle rounded-3xl p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105 delay-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-green-400/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-400">auto_awesome</span>
                      </div>
                      <div>
                        <div className="text-xs text-secondary font-medium">AI Suggestion</div>
                        <div className="text-sm font-bold">Stargazing Night</div>
                      </div>
                    </div>
                    <p className="text-xs text-secondary/80 leading-relaxed">
                      Perfect for a quiet evening under the stars...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Creative Layout */}
      <section id="features" className="relative z-10 px-6 md:px-16 py-32">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-[9px] font-bold uppercase tracking-wider">
              Everything you need
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-romantic">two</span>
            </h2>
          </div>

          {/* Feature grid - Asymmetric */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 - Large */}
            <div className="lg:col-span-2 bg-card/40 backdrop-blur-xl border border-subtle rounded-3xl p-8 md:p-10 hover:border-accent/40 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Powered Date Ideas</h3>
                <p className="text-secondary text-base leading-relaxed max-w-md">
                  Never wonder "what should we do?" again. Our AI understands your vibe and suggests magical experiences tailored to both of you—from cozy nights in to epic adventures.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-card/40 backdrop-blur-xl border border-subtle rounded-3xl p-8 hover:border-romantic/40 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-romantic/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-romantic/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-romantic/20 flex items-center justify-center text-romantic mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                  <span className="material-symbols-outlined text-3xl">map</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Shared Roadmaps</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Visualize your journey together—from weekend getaways to life-changing milestones. See your dreams become plans.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-card/40 backdrop-blur-xl border border-subtle rounded-3xl p-8 hover:border-green-400/40 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-48 h-48 bg-green-400/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 group-hover:bg-green-400/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-green-400/20 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <span className="material-symbols-outlined text-3xl">security</span>
                </div>
                <h3 className="text-xl font-bold mb-3">End-to-End Private</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Your space, your memories, your privacy. Encrypted and secure, because some moments are meant for just the two of you.
                </p>
              </div>
            </div>

            {/* Feature 4 - Large */}
            <div className="lg:col-span-3 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-subtle rounded-3xl p-8 md:p-10 hover:border-accent/40 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-romantic/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 grid md:grid-cols-3 gap-8">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-4">
                    <span className="material-symbols-outlined text-2xl">photo_library</span>
                  </div>
                  <h4 className="font-bold mb-2">Memories</h4>
                  <p className="text-secondary text-sm">Capture and relive your favorite moments together</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-romantic/20 flex items-center justify-center text-romantic mb-4">
                    <span className="material-symbols-outlined text-2xl">sync</span>
                  </div>
                  <h4 className="font-bold mb-2">Real-time Sync</h4>
                  <p className="text-secondary text-sm">Stay connected with instant updates and notifications</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-green-400/20 flex items-center justify-center text-green-400 mb-4">
                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                  </div>
                  <h4 className="font-bold mb-2">Premium Experience</h4>
                  <p className="text-secondary text-sm">Beautiful, intuitive design that feels like home</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-card/40 backdrop-blur-xl border border-subtle rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-romantic/10 to-accent/10"></div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Ready to start your journey?
              </h2>
              <p className="text-lg text-secondary/90 max-w-xl mx-auto">
                Join couples who are building their future together, one moment at a time.
              </p>
              <button 
                onClick={() => {
                  setShowLogin(true);
                  setIsSignup(true);
                }}
                className="px-10 py-4 bg-primary text-main font-bold rounded-full text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Get started free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-subtle/50 py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-sm font-bold">all_inclusive</span>
            </div>
            <span className="font-bold text-base text-secondary">Synk</span>
          </div>
          <div className="flex gap-6 text-[10px] font-semibold uppercase tracking-wider text-secondary/60">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <p className="text-[10px] text-secondary/40 font-medium">© 2026 Synk</p>
        </div>
      </footer>

      {/* Login/Signup Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-subtle rounded-3xl p-8 max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{isSignup ? 'Sign Up' : 'Sign In'}</h2>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setIsSignup(false);
                  resetForm();
                }}
                className="text-secondary hover:text-primary transition-colors p-1 hover:bg-white/5 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Toggle between Sign In and Sign Up */}
            <div className="flex gap-2 bg-white/5 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(false);
                  resetForm();
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  !isSignup
                    ? 'bg-primary text-main shadow-lg'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignup(true);
                  resetForm();
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  isSignup
                    ? 'bg-primary text-main shadow-lg'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </>
              )}

              {!isSignup && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors"
                  placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                />
              </div>

              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-primary focus:outline-none transition-colors ${
                      passwordConfirm && password !== passwordConfirm
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-subtle focus:border-accent'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              )}

              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Partner Coupling Code <span className="text-xs text-secondary/70">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={couplingCode}
                    onChange={(e) => setCouplingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    maxLength={8}
                    className="w-full bg-white/5 border border-subtle rounded-xl px-4 py-3 text-primary text-center text-lg font-mono tracking-widest focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter 8-character code"
                  />
                  <p className="text-xs text-secondary/70 mt-1">
                    If your partner gave you a coupling code, enter it here to connect accounts.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-main font-bold rounded-xl px-4 py-3 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading 
                  ? (isSignup ? 'Creating account...' : 'Signing in...') 
                  : (isSignup ? 'Sign Up' : 'Sign In')
                }
              </button>
            </form>

            {!isSignup && (
              <p className="text-xs text-secondary text-center">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-accent hover:underline font-medium"
                >
                  Sign up here
                </button>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingView;
