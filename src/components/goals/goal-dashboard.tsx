
"use client";

import type { FinancialGoal, FinancialGoalWithContribution } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { AddGoalDialog } from "./add-goal-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bot, Download, Settings2, ArrowRight, TrendingUp, Activity, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarMonths, isPast, startOfDay } from "date-fns";
import { GoalSummaryCards } from "./goal-summary-cards";
import { SavingsBreakdownCard } from "./savings-breakdown-card";
import { GoalPerformanceChartCard } from "./goal-performance-chart-card";
import { SavingsTransactionsCard } from "./savings-transactions-card";
import { GoalsOverviewListCard } from "./goals-overview-list-card";

const mockGoals: FinancialGoal[] = [
  { id: "goal1", name: "New Car Down Payment", targetAmount: 5000, currentAmount: 1200, targetDate: new Date(2025, 11, 31), icon: "car", userId: "1", createdAt: new Date() },
  { id: "goal2", name: "Vacation to Hawaii", targetAmount: 3000, currentAmount: 300, targetDate: new Date(2025, 11, 31), icon: "plane", userId: "1", createdAt: new Date() },
  { id: "goal3", name: "Emergency Fund", targetAmount: 10000, currentAmount: 8500, targetDate: new Date(2025, 11, 31), icon: "shield-check", userId: "1", createdAt: new Date() },
  { id: "goal4", name: "Home Purchased", targetAmount: 110000, currentAmount: 44000, targetDate: new Date(2028, 11, 31), icon: "home", userId: "1", createdAt: new Date() },
  { id: "goal5", name: "Travel Fund", targetAmount: 5000, currentAmount: 1250, targetDate: new Date(2026, 5, 30), icon: "plane", userId: "1", createdAt: new Date() },
];

export function GoalDashboard() {
  const [goals, setGoals] = useState<FinancialGoal[]>(mockGoals);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const { toast } = useToast();

  const goalsWithContributions = useMemo((): FinancialGoalWithContribution[] => {
    const today = startOfDay(new Date());
    return goals.map(goal => {
      const targetDate = startOfDay(new Date(goal.targetDate));
      let monthsRemaining = differenceInCalendarMonths(targetDate, today);
      let monthlyContribution = 0;
      const amountNeeded = goal.targetAmount - goal.currentAmount;

      if (amountNeeded <= 0) {
        monthsRemaining = 0;
        monthlyContribution = 0;
      } else if (isPast(targetDate) || monthsRemaining < 0) {
        monthsRemaining = 0;
        monthlyContribution = amountNeeded;
      } else if (monthsRemaining === 0) {
         monthsRemaining = 1;
         monthlyContribution = amountNeeded;
      }
      else {
        monthlyContribution = amountNeeded / (monthsRemaining + 1); // +1 for current month too
      }
      
      return {
        ...goal,
        monthsRemaining: Math.max(0, monthsRemaining),
        monthlyContribution: monthlyContribution > 0 ? parseFloat(monthlyContribution.toFixed(2)) : 0,
      };
    }).sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [goals]);

  const handleAddGoal = (newGoalData: Omit<FinancialGoal, "id" | "userId" | "createdAt">) => {
    const newGoal: FinancialGoal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
    };
    setGoals((prevGoals) => [...prevGoals, newGoal]);
    toast({
      title: "Goal Added!",
      description: `"${newGoal.name}" has been successfully added to your goals.`,
    });
    setIsAddGoalDialogOpen(false);
  };

  const handleDeleteGoal = (goalId: string) => { // This will be passed to GoalsOverviewListCard
    const goalToDelete = goals.find(g => g.id === goalId);
    if (goalToDelete) {
      setGoals((prevGoals) => prevGoals.filter(g => g.id !== goalId));
      toast({
        title: "Goal Deleted",
        description: `Goal "${goalToDelete.name}" has been removed.`,
        variant: "destructive",
      });
    }
  };

  const handleEditGoal = (goalId: string) => { // Placeholder
    const goal = goals.find(g => g.id === goalId);
    toast({ title: "Edit Goal (Coming Soon)", description: `Editing "${goal?.name}" is not yet implemented.`})
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mb-2">
        <Button variant="outline" size="sm" disabled>
          <Bot className="mr-2 h-4 w-4" /> Ask Mowany AI
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
        <AddGoalDialog
          isOpen={isAddGoalDialogOpen}
          onOpenChange={setIsAddGoalDialogOpen}
          onGoalAdded={handleAddGoal}
        >
          <Button onClick={() => setIsAddGoalDialogOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
          </Button>
        </AddGoalDialog>
        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" disabled>
          <Settings2 className="mr-2 h-4 w-4" /> Optimize Savings Plan
        </Button>
      </div>

      <GoalSummaryCards goals={goalsWithContributions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SavingsBreakdownCard goals={goalsWithContributions} />
        <GoalPerformanceChartCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SavingsTransactionsCard />
        <GoalsOverviewListCard 
          goals={goalsWithContributions} 
          onDeleteGoal={handleDeleteGoal} 
          onEditGoal={handleEditGoal} 
        />
      </div>
    </div>
  );
}
