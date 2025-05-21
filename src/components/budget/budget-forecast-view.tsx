
"use client";

import type { MonthlyForecast } from "@/types";
import { MonthlyForecastCard } from "./monthly-forecast-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BudgetForecastViewProps {
  forecastData: MonthlyForecast[];
  onUpdateVariableAmount: (monthIndex: number, variableExpenseId: string, newAmount: number) => void;
  onUpdateGoalContribution: (monthIndex: number, goalId: string, newAmount: number) => void;
  // Add onUpdateDebtAdditionalPayment later
}

export function BudgetForecastView({ 
    forecastData, 
    onUpdateVariableAmount, 
    onUpdateGoalContribution 
}: BudgetForecastViewProps) {
  if (!forecastData || forecastData.length === 0) {
    return (
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Forecast Data</AlertTitle>
            <AlertDescription>
                Forecast data is being generated or is not available. Please check your recurring items, debts, and goals.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">12-Month Budget Forecast</h2>
        <p className="text-muted-foreground">
            Review your projected finances for each month of the current year. 
            (Editing capabilities for forecast months will be enabled in a future update.)
        </p>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
            {forecastData.map((monthData, index) => (
                <MonthlyForecastCard
                key={monthData.monthLabel}
                monthData={monthData}
                monthIndex={index} // Pass monthIndex if needed for updates later
                // onUpdateVariableAmount={(variableExpenseId, newAmount) => onUpdateVariableAmount(index, variableExpenseId, newAmount)}
                // onUpdateGoalContribution={(goalId, newAmount) => onUpdateGoalContribution(index, goalId, newAmount)}
                // Pass other handlers as they are implemented
                />
            ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
