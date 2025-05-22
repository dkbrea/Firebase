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

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found' which is expected for new users
          console.error("Error fetching user preferences:", fetchError);
          throw new Error(`Failed to fetch user preferences: ${fetchError.message}`);
        }

        // Initialize the setup_progress object or use existing one
        let setupProgress = data?.setup_progress || {};
        
        // Set onboardingCompleted to true
        setupProgress.onboardingCompleted = true;

        // Prepare the upsert data
        const upsertData = {
          user_id: user.id,
          setup_progress: setupProgress
        };

        // Add default values only for new records
        if (!data) {
          Object.assign(upsertData, {
            currency: 'USD',
            date_format: 'MM/DD/YYYY',
            theme: 'system',
            hide_balances: false,
            email_notifications: true,
            browser_notifications: true,
            mobile_notifications: false
          });
        }

        // Update or insert the record
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (updateError) {
          console.error("Error updating onboarding status:", updateError);
          throw new Error(`Failed to update onboarding status: ${updateError.message}`);
        }

        // Update local state
        setShowOnboarding(false);
        
        return { success: true };
      } catch (err) {
        console.error("Failed to save onboarding status:", err);
        throw err; // Re-throw to allow handling by the caller
      }
    } else {
      console.error("Cannot complete onboarding: No user ID available");
      throw new Error("User not authenticated");
    }
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    isLoading
  };
}
