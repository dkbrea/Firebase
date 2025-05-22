import { supabase, handleSupabaseError } from '../supabase';
import type { User } from '@/types';

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return handleSupabaseError(error);
    }

    if (data?.user) {
      // Create a user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: email.split('@')[0], // Default name from email
        });

      if (profileError) {
        return handleSupabaseError(profileError);
      }
    }

    return { data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const signIn = async (email: string, password: string): Promise<{ data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleSupabaseError(error);
    }

    return { data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const signOut = async (): Promise<{ success?: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return handleSupabaseError(error);
    }

    return { success: true };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const getCurrentUser = async (): Promise<{ user: User | null; error?: string }> => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { user: null, error: sessionError.message };
    }
    
    if (!session) {
      console.log('No active session found');
      return { user: null };
    }

    // Since we have a valid session, we can use the session data to create a user object
    // This bypasses any potential RLS issues with the users table
    const userObj: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.email?.split('@')[0] || 'User',
      avatarUrl: session.user.user_metadata?.avatar_url || null
    };

    console.log('Created user object from session:', userObj.email);
    return { user: userObj };
  } catch (error: any) {
    console.error('getCurrentUser error:', error);
    return { user: null, error: error.message };
  }
};
