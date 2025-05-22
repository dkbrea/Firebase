"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Always show onboarding for now - this is more reliable than querying tables that might not exist
      setShowOnboarding(true);
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [user?.id]);

  // Function to mark onboarding as completed
  const completeOnboarding = async () => {
    if (user?.id) {
      try {
        // First, get the current setup_progress object
        const { data, error: fetchError } = await supabase
          .from('user_preferences')
          .select('setup_progress')
          .eq('user_id', user.id)
          .single();

        // Initialize the setup_progress object or use existing one
        let setupProgress = data?.setup_progress || {};
        
        // Set onboardingCompleted to true
        setupProgress.onboardingCompleted = true;

        // Update or insert the record
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            setup_progress: setupProgress,
            // Set default values for new records
            ...(data ? {} : { 
              currency: 'USD',
              date_format: 'MM/DD/YYYY',
              theme: 'system',
              hide_balances: false,
              email_notifications: true,
              browser_notifications: true,
              mobile_notifications: false
            })
          }, { onConflict: 'user_id' });

        if (updateError) {
          console.error("Error updating onboarding status:", updateError);
          return;
        }

        // Update local state
        setShowOnboarding(false);
      } catch (err) {
        console.error("Failed to save onboarding status:", err);
      }
    }
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    isLoading
  };
}
