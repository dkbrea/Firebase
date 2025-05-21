
"use client";

import { useEffect, useState } from "react";
import type { FinancialGoalWithContribution } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Icons from "@/components/icons";
import { format, differenceInCalendarMonths, isPast, startOfDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mockGoals: FinancialGoalWithContribution[] = [
  { id: "goal1", name: "New Car Down Payment", targetAmount: 5000, currentAmount: 1200, targetDate: new Date(2025, 11, 31), icon: "car", userId: "1", createdAt: new Date(), monthlyContribution: 150, monthsRemaining: 20 },
  { id: "goal2", name: "Vacation to Hawaii", targetAmount: 3000, currentAmount: 2800, targetDate: new Date(2024, 10, 30), icon: "plane", userId: "1", createdAt: new Date(), monthlyContribution: 200, monthsRemaining: 2 },
  { id: "goal3", name: "Emergency Fund Top-up", targetAmount: 10000, currentAmount: 10000, targetDate: new Date(2025, 5, 30), icon: "shield-check", userId: "1", createdAt: new Date(), monthlyContribution: 0, monthsRemaining: 0 },
  { id: "goal4", name: "New Laptop", targetAmount: 1500, currentAmount: 300, targetDate: new Date(2025, 2, 15), icon: "briefcase", userId: "1", createdAt: new Date(), monthlyContribution: 100, monthsRemaining: 8 },
];

const getGoalIcon = (iconKey: FinancialGoalWithContribution['icon']) => {
    const iconMap: Record<FinancialGoalWithContribution['icon'], React.ElementType> = {
        'default': Icons.GoalDefault, 'home': Icons.Home, 'car': Icons.Car,
        'plane': Icons.Plane, 'briefcase': Icons.Briefcase, 'graduation-cap': Icons.GraduationCap,
        'gift': Icons.Gift, 'piggy-bank': Icons.PiggyBank, 'trending-up': Icons.TrendingUp,
        'shield-check': Icons.ShieldCheck,
    };
    const IconComponent = iconMap[iconKey] || Icons.GoalDefault;
    return <IconComponent className="h-5 w-5 text-primary" />;
};


export function GoalProgressReport() {
  const [isClient, setIsClient] = useState(false);
  const [processedGoals, setProcessedGoals] = useState<FinancialGoalWithContribution[]>([]);

  useEffect(() => {
    setIsClient(true);
     const today = startOfDay(new Date());
     const calculatedGoals = mockGoals.map(goal => {
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
      } else {
        monthlyContribution = amountNeeded / (monthsRemaining + 1); // +1 includes current month for contribution
      }
      return {
        ...goal,
        monthsRemaining: Math.max(0, monthsRemaining),
        monthlyContribution: monthlyContribution > 0 ? parseFloat(monthlyContribution.toFixed(2)) : 0,
      };
    }).sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    setProcessedGoals(calculatedGoals);
  }, []);

  if (!isClient) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Goal Progress Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">Loading goals...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.Goals className="mr-2 h-5 w-5 text-primary"/>
            Goal Progress Summary
        </CardTitle>
        <CardDescription>Overview of your financial goals and their progress.</CardDescription>
      </CardHeader>
      <CardContent>
        {processedGoals.length > 0 ? (
            <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-4">
                {processedGoals.map(goal => {
                    const progressPercentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                    const isAchieved = goal.currentAmount >= goal.targetAmount;
                    return (
                    <div key={goal.id} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                {getGoalIcon(goal.icon)}
                                <span className="font-medium text-foreground">{goal.name}</span>
                            </div>
                            {isAchieved && <Badge variant="default" className="bg-green-500 text-white text-xs">Achieved!</Badge>}
                        </div>
                        <Progress value={progressPercentage} className={cn("h-2.5", isAchieved && "[&>div]:bg-green-500")} />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>${goal.currentAmount.toLocaleString()}/${goal.targetAmount.toLocaleString()}</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        {!isAchieved && (
                            <div className="text-xs text-muted-foreground mt-1.5">
                                Target: {format(new Date(goal.targetDate), "MMM yyyy")} | 
                                Contrib: ${goal.monthlyContribution.toLocaleString()}/mo
                            </div>
                        )}
                    </div>
                    );
                })}
                </div>
            </ScrollArea>
        ) : (
            <p className="text-muted-foreground text-center py-8">No financial goals set up yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
