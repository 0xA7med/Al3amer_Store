import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: AuthError | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Check if Supabase is properly configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.error('Supabase is not properly configured. Check your environment variables.');
      setLoading(false);
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error);
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError(error as AuthError);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('[Auth] Auth state changed:', event);
        
        // Only update state if the session has actually changed
        setSession(prevSession => {
          const prevToken = prevSession?.access_token;
          const newToken = session?.access_token;
          
          if (prevToken !== newToken) {
            return session;
          }
          return prevSession;
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setSession(null);
      setUser(null);
      setError(null);
      
      // Clear any stored session data
      window.localStorage.removeItem('sb-auth-token');
      
      // Redirect to home or login page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    session,
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for class components if needed
export { AuthContext };