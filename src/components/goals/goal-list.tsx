
"use client";

import type { FinancialGoalWithContribution, FinancialGoal } from "@/types";
import { GoalCard } from "./goal-card";

interface GoalListProps {
  goals: FinancialGoalWithContribution[];
  onDeleteGoal: (goalId: string) => void;
  onEditGoal: (goal: FinancialGoal) => void; // For future editing
}

export function GoalList({ goals, onDeleteGoal, onEditGoal }: GoalListProps) {
  if (goals.length === 0) {
    // This case is handled by GoalManager's empty state,
    // but good to have a fallback or specific message if list is used elsewhere.
    return <p className="text-muted-foreground text-center py-8">No financial goals set up yet.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {goals.map((goal) => (
        <GoalCard 
            key={goal.id} 
            goal={goal} 
            onDeleteGoal={onDeleteGoal}
            onEditGoal={() => onEditGoal(goal as FinancialGoal)} // Pass the original goal type
        />
      ))}
    </div>
  );
}
