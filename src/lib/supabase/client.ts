import { createClient } from '@supabase/supabase-js';

// Get environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isProduction = import.meta.env.PROD;

export const isSupabaseConfigured = Boolean(envUrl && envKey);

// Log configuration status
console.log('[Supabase] Initializing with environment:', {
  isProduction,
  hasUrl: !!envUrl,
  hasKey: !!envKey,
  url: isProduction ? '***' : envUrl
});

if (!envUrl || !envKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Authentication and database features will not work properly.'
  );
}

// Validate and process the Supabase URL
let validatedUrl = 'https://invalid.supabase.local';
if (envUrl) {
  try {
    const url = new URL(envUrl);
    // Ensure the URL has https in production for security
    if (isProduction && url.protocol !== 'https:') {
      console.warn('[Supabase] In production, Supabase URL should use HTTPS for security');
    }
    validatedUrl = url.toString();
  } catch (error) {
    console.error(`[Supabase] Invalid URL provided: ${envUrl}`, error);
  }
}

// Create the Supabase client with additional options
export const supabase = createClient(validatedUrl, envKey || 'invalid-anon-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isProduction, // Only detect session in URL in development
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'al3amer-store/1.0.0',
    },
  },
});

// Log authentication state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Supabase Auth] ${event}`, session ? 'User authenticated' : 'No user session');
  
  // Handle specific auth events
  switch (event) {
    case 'SIGNED_IN':
      console.log('[Supabase Auth] User signed in:', session?.user?.email);
      break;
    case 'SIGNED_OUT':
      console.log('[Supabase Auth] User signed out');
      break;
    case 'TOKEN_REFRESHED':
      console.log('[Supabase Auth] Token refreshed');
      break;
    case 'USER_UPDATED':
      console.log('[Supabase Auth] User updated:', session?.user);
      break;
    default:
      console.log(`[Supabase Auth] Event: ${event}`);
  }
});

// Helper function to handle auth errors
const handleAuthError = (error: any) => {
  console.error('[Supabase Auth] Error:', error);
  throw error;
};

// Wrap auth methods with error handling
export const auth = {
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleAuthError(error);
    }
  },
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },
};
