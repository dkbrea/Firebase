
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
  onUpdateDebtAdditionalPayment: (monthIndex: number, debtId: string, newAdditionalAmount: number) => void;
}

export function BudgetForecastView({ 
    forecastData, 
    onUpdateVariableAmount, 
    onUpdateGoalContribution,
    onUpdateDebtAdditionalPayment 
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
            Review and adjust your projected finances for each month of the current year. 
            Changes made here only affect the specific forecast month.
        </p>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
            {forecastData.map((monthData, index) => (
                <MonthlyForecastCard
                  key={monthData.monthLabel}
                  monthData={monthData}
                  monthIndex={index} 
                  onUpdateVariableAmount={onUpdateVariableAmount}
                  onUpdateGoalContribution={onUpdateGoalContribution}
                  onUpdateDebtAdditionalPayment={onUpdateDebtAdditionalPayment}
                />
            ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
