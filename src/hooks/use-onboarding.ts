"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
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

        // Handle fetch error, but don't throw for PGRST116 (not found) which is expected for new users
        if (fetchError) {
          if (fetchError.code !== 'PGRST116') {
            console.error("Error fetching user preferences:", JSON.stringify(fetchError));
            // Continue with default values instead of throwing
          }
          // If not found, we'll create a new record below
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
          console.error("Error updating onboarding status:", JSON.stringify(updateError));
          // Log error but don't throw to prevent breaking the user experience
          toast({
            title: "Warning",
            description: "There was an issue saving your progress, but you can continue using the app.",
            variant: "destructive"
          });
          // Return with partial success
          return { success: false, error: updateError };
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
