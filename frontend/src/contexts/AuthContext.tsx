import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { getMyProfile, getMyCouples, createProfile, type Profile, type Couple } from '../lib/api';
import axios from 'axios';

type AppUser = { id: string; email?: string | null; name?: string | null } | null;

interface AuthContextType {
  user: AppUser;
  profile: Profile | null;
  couple: Couple | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCouple: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for testing
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await getMyProfile();
      console.log('fetchProfile response:', response.data);
      const results = response.data.results || response.data;
      return Array.isArray(results) && results.length > 0 ? results[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist yet
        return null;
      }
      throw error;
    }
  };

  const fetchCouple = async () => {
    try {
      const response = await getMyCouples();
      console.log('fetchCouple response:', response.data);
      const results = response.data.results || response.data;
      return Array.isArray(results) && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching couple:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await fetchProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const refreshCouple = async () => {
    try {
      const coupleData = await fetchCouple();
      setCouple(coupleData);
    } catch (error) {
      console.error('Error refreshing couple:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!mounted) return;
      
      if (fbUser) {
        const appUser = { 
          id: fbUser.uid, 
          email: fbUser.email, 
          name: fbUser.displayName 
        };
        setUser(appUser);
        
        // Fetch profile and couple from Django backend
        try {
          const profileData = await fetchProfile();
          setProfile(profileData);
          
          const coupleData = await fetchCouple();
          setCouple(coupleData);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setCouple(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      // Call backend to create user in Firebase
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/signup/`, {
        email,
        password,
        name: name || '',
      });

      // Sign in with the custom token returned by backend
      if (response.data.custom_token) {
        await signInWithCustomToken(auth, response.data.custom_token);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      couple, 
      loading, 
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut, 
      refreshCouple,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
