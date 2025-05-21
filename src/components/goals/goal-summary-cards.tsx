
"use client";

import type { FinancialGoalWithContribution } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Lightbulb } from "lucide-react";
import { useMemo } from "react";

interface GoalSummaryCardsProps {
  goals: FinancialGoalWithContribution[];
}

export function GoalSummaryCards({ goals }: GoalSummaryCardsProps) {
  const totalSavedThisMonthPlaceholder = 20500; // Placeholder

  const activeGoals = useMemo(() => {
    return goals.filter(g => g.currentAmount < g.targetAmount);
  }, [goals]);

  const totalGoalsCompletionPercentage = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    if (totalTarget === 0) return 0;
    return Math.min((totalCurrent / totalTarget) * 100, 100);
  }, [goals]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-1 inline-block" /> Total Saved This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            ${totalSavedThisMonthPlaceholder.toLocaleString()}
          </div>
          <p className="text-xs text-green-500 pt-1">
            <TrendingUp className="h-3 w-3 mr-0.5 inline-block" /> 10% compared to last month (Placeholder)
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
             <Activity className="h-4 w-4 mr-1 inline-block" /> Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {activeGoals.length} Goals
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {totalGoalsCompletionPercentage.toFixed(0)}% of total goals completed
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
             <Lightbulb className="h-4 w-4 mr-1 inline-block text-yellow-500" /> AI Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            You're doing great! At this pace, you'll hit your vacation goal in just 2 months. Keep it up, and soon you'll be relaxing on the beach! (Placeholder)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
