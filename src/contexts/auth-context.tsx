"use client";

import type { User } from "@/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, signIn, signOut } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for an existing Supabase session
    const checkSession = async () => {
      // Guard against multiple simultaneous session checks
      if (checkingSession) return;
      
      try {
        setCheckingSession(true);
        console.log('Checking for existing session...');
        setLoading(true);
        
        // First check if we have a session directly from Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Supabase session check:', sessionData?.session ? 'Session exists' : 'No session');
        
        const { user, error } = await getCurrentUser();
        
        if (error) {
          console.error("Session error:", error);
        }
        
        if (user) {
          console.log('User found in session:', user.email);
        } else {
          console.log('No authenticated user found');
        }
        
        setUser(user);
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setLoading(false);
        setCheckingSession(false);
      }
    };

    if (!checkingSession) {
      checkSession();
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Don't update state if we're already checking the session
        if (checkingSession) {
          console.log('Skipping auth state update - already checking session');
          return;
        }
        
        if (session) {
          try {
            const { user: userData } = await getCurrentUser();
            
            // Only update if user data actually changed
            const currentUserId = user?.id;
            const newUserId = userData?.id;
            
            if (currentUserId !== newUserId) {
              console.log('Updating user state after auth change');
              setUser(userData);
            }
          } catch (error) {
            console.error('Error handling auth state change:', error);
          }
        } else if (user !== null) { // Only set to null if it's not already null
          console.log('Clearing user state after signout');
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt for:', email);
      const result = await signIn(email, password);
      
      console.log('Sign in result:', result);
      
      if (result.error) {
        console.error('Login error:', result.error);
        return { success: false, error: result.error };
      }
      
      if (result.data?.user) {
        console.log('Supabase auth successful, getting user data');
        const { user: userData, error: userError } = await getCurrentUser();
        
        if (userError) {
          console.error('Error getting user data:', userError);
          return { success: false, error: userError };
        }
        
        if (!userData) {
          console.error('No user data found after login');
          return { success: false, error: 'User profile not found' };
        }
        
        console.log('User data retrieved successfully:', userData);
        setUser(userData);
        
        // Force redirection to dashboard with replace to prevent back navigation
        console.log('Redirecting to dashboard');
        router.replace("/dashboard");
        
        // Small delay before returning to ensure router has time to process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { success: true };
      }
      
      console.error('Login failed: No user in response');
      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const result = await signOut();
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      setUser(null);
      router.push("/auth");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
