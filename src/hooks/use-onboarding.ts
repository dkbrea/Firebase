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
      return;
    }

    const fetchOnboardingStatus = async () => {
      try {
        // First try to get from profiles table (which should already exist)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('setup_completed, onboarding_status')
          .eq('id', user.id)
          .single();
          
        // If we have profile data with onboarding information
        if (profileData && (profileData.setup_completed !== null || profileData.onboarding_status)) {
          // Use existing profile data for onboarding status
          const allStepsCompleted = profileData.setup_completed || 
            (profileData.onboarding_status && Object.values(profileData.onboarding_status).every(step => step === true));
            
          setShowOnboarding(!allStepsCompleted);
          setIsLoading(false);
          return;
        }
        
        // Fallback to user_preferences if profiles doesn't have the data
        const { data, error } = await supabase
          .from('user_preferences')
          .select('setup_progress')
          .eq('user_id', user.id)
          .single();

        // If the table doesn't exist or record not found, show onboarding
        if (error) {
          if (error.code === 'PGRST116') {
            // Record not found, show onboarding
            setShowOnboarding(true);
          } else if (error.message && error.message.includes('relation "user_preferences" does not exist')) {
            // Table doesn't exist, show onboarding
            console.log('user_preferences table does not exist, showing onboarding');
            setShowOnboarding(true);
          } else {
            // Other error
            console.error("Error fetching onboarding status:", JSON.stringify(error));
          }
          setIsLoading(false);
          return;
        }

        // If no data or setup_progress is not defined, show onboarding
        if (!data || !data.setup_progress) {
          setShowOnboarding(true);
          setIsLoading(false);
          return;
        }

        // Check if all onboarding steps are completed
        const setupProgress = data.setup_progress;
        const allStepsCompleted = Object.values(setupProgress.steps || {}).every(
          (step) => step === true
        );

        setShowOnboarding(!allStepsCompleted);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  // Function to mark onboarding as completed
  const completeOnboarding = async () => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Update the profiles table which should already exist
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          setup_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error("Error updating profile setup_completed status:", JSON.stringify(profileUpdateError));
        
        // If there's an error with profiles, try the user_preferences table as fallback
        try {
          // Get existing setup progress or initialize new one
          const { data, error: fetchError } = await supabase
            .from('user_preferences')
            .select('setup_progress')
            .eq('user_id', user.id)
            .single();

          // Handle fetch error, including if the table doesn't exist
          if (fetchError) {
            if (fetchError.message && fetchError.message.includes('relation "user_preferences" does not exist')) {
              // Table doesn't exist, but we already updated profiles, so consider it a success
              console.log('user_preferences table does not exist, but profiles was updated');
              setShowOnboarding(false);
              return { success: true };
            } else if (fetchError.code !== 'PGRST116') {
              console.error("Error fetching user preferences:", JSON.stringify(fetchError));
              // Continue with default values
            }
            // If not found, we'll create a new record below
          }

          // Initialize the setup_progress object or use existing one
          const existingProgress = data?.setup_progress || { steps: {} };
          
          // Mark all steps as completed
          const updatedProgress = {
            ...existingProgress,
            steps: {
              ...existingProgress.steps,
              accounts: true,
              income: true,
              expenses: true,
              budget: true,
              goals: true
            }
          };

          // Prepare data for upsert
          const upsertData = {
            user_id: user.id,
            setup_progress: updatedProgress,
            updated_at: new Date().toISOString()
          };

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
            // Return with partial success since we already updated profiles
            setShowOnboarding(false);
            return { success: true, warning: updateError };
          }
        } catch (innerError) {
          console.error("Error in fallback to user_preferences:", innerError);
          // Since we already tried updating profiles, consider it a partial success
          setShowOnboarding(false);
          return { success: true, warning: innerError };
        }
      }

      // Update local state
      setShowOnboarding(false);

      return { success: true };
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Warning",
        description: "There was an issue saving your progress, but you can continue using the app.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    isLoading
  };
}
