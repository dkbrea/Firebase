
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Flag } from "lucide-react";

interface BudgetSummaryProps {
  totalIncome: number;
  totalFixedOutflows: number; // Sum of fixed expenses, subscriptions, debt payments, AND GOAL CONTRIBUTIONS
  totalBudgetedVariable: number;
  totalGoalContributions: number; // Explicitly passed for display
}

export function BudgetSummary({ totalIncome, totalFixedOutflows, totalBudgetedVariable, totalGoalContributions }: BudgetSummaryProps) {
  // Remaining for budget already accounts for goals because totalFixedOutflows includes them
  const remainingForBudget = totalIncome - totalFixedOutflows - totalBudgetedVariable;
  
  // Available for variable is income MINUS (fixed expenses + subscriptions + debt payments + GOAL CONTRIBUTIONS)
  const availableForVariable = totalIncome - totalFixedOutflows; 
  
  let progressPercentage = 0;
  if (availableForVariable > 0) {
    progressPercentage = Math.min( (totalBudgetedVariable / availableForVariable) * 100, 100);
  } else if (availableForVariable <=0 && totalBudgetedVariable > 0) { 
      progressPercentage = 100; 
  }

  // For display purposes, calculate fixed outflows *without* goal contributions
  const fixedOutflowsWithoutGoals = totalFixedOutflows - totalGoalContributions;

  const summaryItems = [
    { title: "Monthly Income", amount: totalIncome, icon: <TrendingUp className="text-green-500" />, color: "text-green-600" },
    { title: "Fixed Outflows (Bills, Debts)", amount: fixedOutflowsWithoutGoals, icon: <TrendingDown className="text-red-500" />, color: "text-red-600" },
    { title: "Goal Contributions", amount: totalGoalContributions, icon: <Flag className="text-sky-500" />, color: "text-sky-600" }, // New item for goals
    { title: "Budgeted Variable", amount: totalBudgetedVariable, icon: <DollarSign className="text-blue-500" />, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map(item => (
          <Card key={item.title} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.color}`}>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Zero-Based Budget Status</CardTitle>
          <CardDescription>Your goal is to make "Remaining to Budget" equal $0.00.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-lg font-semibold">
              <span>Remaining to Budget:</span>
              <span 
                className={cn(
                  "font-bold",
                  remainingForBudget === 0 && "text-green-600",
                  remainingForBudget > 0 && "text-orange-500",
                  remainingForBudget < 0 && "text-destructive"
                )}
              >
                ${remainingForBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {availableForVariable > 0 && (
                <Progress 
                    value={progressPercentage} 
                    className={cn(
                        "h-4",
                        remainingForBudget < 0 && "!bg-destructive/80 [&>div]:!bg-destructive", 
                        remainingForBudget === 0 && availableForVariable > 0 && "!bg-green-500/80 [&>div]:!bg-green-500",
                        remainingForBudget > 0 && "!bg-orange-500/80 [&>div]:!bg-orange-500"
                    )} 
                />
            )}
             {availableForVariable <= 0 && totalIncome > 0 && ( 
                <Progress 
                    value={100} 
                    className="h-4 !bg-destructive/80 [&>div]:!bg-destructive"
                />
            )}
          </div>
          
          {remainingForBudget === 0 && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              <p className="font-medium">Great! Every dollar has a job.</p>
            </div>
          )}
          {remainingForBudget > 0 && (
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p className="font-medium">You still have money to assign to your variable budget categories.</p>
            </div>
          )}
          {remainingForBudget < 0 && (
            <div className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p className="font-medium">You've budgeted more than your income. Adjust your variable expenses or goal contributions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
