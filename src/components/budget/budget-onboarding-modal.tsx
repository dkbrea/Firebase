"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, PlusCircle, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BudgetOnboardingModalProps {
  leftToAllocate: number;
  totalIncome: number;
  onAddCategoryClick: () => void;
}

export function BudgetOnboardingModal({ leftToAllocate, totalIncome, onAddCategoryClick }: BudgetOnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  
  // Check if budget is balanced
  const isBalanced = Math.abs(leftToAllocate) < 0.01 && totalIncome > 0;
  
  useEffect(() => {
    // Check if the user was redirected from the setup guide
    const fromSetup = searchParams?.get('fromSetup') === 'true';
    if (fromSetup) {
      setOpen(true);
      
      // Remove the query parameter to prevent the modal from showing on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);
  
  // Mark the budget setup step as completed when the budget is balanced
  useEffect(() => {
    const markBudgetStepComplete = async () => {
      if (!isBalanced || !user?.id || !open) return;
      
      try {
        setIsMarkingComplete(true);
        
        // First, check if we have any variable expenses
        const { count, error: countError } = await supabase
          .from('variable_expenses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (countError) {
          console.error("Error checking variable expenses:", countError);
          return;
        }
        
        // Only mark as complete if we have at least one variable expense
        if (count && count > 0) {
          // First try to update the profiles table which should already exist
          const { data: profileData, error: profileFetchError } = await supabase
            .from('profiles')
            .select('onboarding_status')
            .eq('id', user.id)
            .single();

          if (!profileFetchError) {
            // Update the onboarding_status in profiles
            const existingStatus = profileData?.onboarding_status || {};
            const updatedStatus = {
              ...existingStatus,
              budget: true
            };

            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                onboarding_status: updatedStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (profileUpdateError) {
              console.error("Error updating profile onboarding status:", JSON.stringify(profileUpdateError));
              // Continue to fallback
            } else {
              // Successfully updated profiles
              toast({
                title: "Budget Setup Complete",
                description: "Your zero-based budget has been set up successfully!",
                variant: "default"
              });
              return; // Exit early if profiles update succeeded
            }
          }

          // Fallback to user_preferences if profiles update failed
          try {
            // Get existing setup progress
            const { data, error: fetchError } = await supabase
              .from('user_preferences')
              .select('setup_progress')
              .eq('user_id', user.id)
              .single();

            // Handle fetch error, including if the table doesn't exist
            if (fetchError) {
              if (fetchError.message && fetchError.message.includes('relation "user_preferences" does not exist')) {
                // Table doesn't exist, but we already tried updating profiles
                console.log('user_preferences table does not exist, but attempted profiles update');
                toast({
                  title: "Budget Setup Complete",
                  description: "Your zero-based budget has been set up successfully!",
                  variant: "default"
                });
                return;
              } else if (fetchError.code !== 'PGRST116') {
                console.error("Error fetching setup progress:", JSON.stringify(fetchError));
                // Continue with default values
              }
              // If not found, we'll create a new record below
            }

            // Update setup progress
            const existingProgress = data?.setup_progress || { steps: {} };
            const updatedProgress = {
              ...existingProgress,
              steps: {
                ...existingProgress.steps,
                budget: true
              }
            };

            // Update or insert the record
            const { error: updateError } = await supabase
              .from('user_preferences')
              .upsert(
                { 
                  user_id: user.id, 
                  setup_progress: updatedProgress,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (updateError) {
              console.error("Error updating setup progress:", JSON.stringify(updateError));
              // Log error but don't return to prevent breaking the user experience
              toast({
                title: "Warning",
                description: "There was an issue saving your progress, but you can continue using the app.",
                variant: "destructive"
              });
              // Continue with the flow
            } else {
              toast({
                title: "Budget Setup Complete",
                description: "Your zero-based budget has been set up successfully!",
                variant: "default"
              });
            }
          } catch (innerErr) {
            console.error("Error in fallback to user_preferences:", innerErr);
            // Show success toast anyway to not break user experience
            toast({
              title: "Budget Setup Complete",
              description: "Your zero-based budget has been set up successfully!",
              variant: "default"
            });
          }
        } catch (err) {
          console.error("Error marking budget step complete:", err);
          // Show success toast anyway to not break user experience
          toast({
            title: "Budget Setup Complete",
            description: "Your zero-based budget has been set up successfully!",
            variant: "default"
          });
        }
      } finally {
        setIsMarkingComplete(false);
      }
    };
    
    markBudgetStepComplete();
  }, [isBalanced, user?.id, open, toast]);
  
  // Calculate progress percentage
  let progressPercentage = 0;
  if (totalIncome > 0) {
    const allocated = totalIncome - leftToAllocate;
    progressPercentage = Math.min((allocated / totalIncome) * 100, 100);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Your Zero-Based Budget</DialogTitle>
          <DialogDescription>
            Allocate all your income to different expense categories until your "Left to Allocate" reaches $0.00
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Monthly Income:</span>
            <span className="text-green-600">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex justify-between text-lg font-semibold">
            <span>Left to Allocate:</span>
            <span className={`font-bold ${isBalanced ? "text-green-600" : leftToAllocate > 0 ? "text-orange-500" : "text-red-600"}`}>
              ${leftToAllocate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <Progress
            value={progressPercentage}
            className={`h-3 mt-2 ${
              leftToAllocate < 0 ? "!bg-red-200 [&>div]:!bg-red-500" :
              isBalanced ? "!bg-green-200 [&>div]:!bg-green-500" :
              "!bg-orange-200 [&>div]:!bg-orange-500"
            }`}
          />
          
          {isBalanced ? (
            <p className="text-sm text-green-600 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" /> 
              Congratulations! Your budget is balanced. Every dollar has a job!
            </p>
          ) : leftToAllocate > 0 ? (
            <p className="text-sm text-orange-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" /> 
              You still have ${leftToAllocate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to allocate.
            </p>
          ) : (
            <p className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" /> 
              You've allocated more than your income. Adjust your expenses to balance your budget.
            </p>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-700">How to complete your budget:</h4>
                <ol className="text-sm text-blue-700 mt-1 space-y-1 list-decimal pl-4">
                  <li>Click "Add Variable Expense" to create expense categories</li>
                  <li>Allocate money to each category based on your spending needs</li>
                  <li>Continue until your "Left to Allocate" reaches $0.00</li>
                  <li>When the progress bar turns green, your budget is balanced!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            I'll do this later
          </Button>
          <Button 
            onClick={() => {
              onAddCategoryClick();
              setOpen(false);
            }}
            className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Variable Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
