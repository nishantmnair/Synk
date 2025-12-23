import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { getMyProfile, getMyCouples, createProfile, type Profile, type Couple } from '../lib/api';

type AppUser = { id: string; email?: string | null; displayName?: string | null } | null;

interface AuthContextType {
  user: AppUser;
  profile: Profile | null;
  couple: Couple | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCouple: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await getMyProfile();
      return response.data;
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
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error fetching couple:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    const profileData = await fetchProfile();
    setProfile(profileData);
  };

  const refreshCouple = async () => {
    const coupleData = await fetchCouple();
    setCouple(coupleData);
  };

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!mounted) return;
      
      if (fbUser) {
        const appUser = { 
          id: fbUser.uid, 
          email: fbUser.email, 
          displayName: fbUser.displayName 
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
