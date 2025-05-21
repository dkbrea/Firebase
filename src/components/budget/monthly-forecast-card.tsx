
"use client";

import type { MonthlyForecast } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Package, Repeat, ListChecks, ShieldCheck, ReceiptText, Info } from "lucide-react";

interface MonthlyForecastCardProps {
  monthData: MonthlyForecast;
  monthIndex: number; // For potential future use with update handlers
  // Add update handlers here when editing is implemented
  // onUpdateVariableAmount: (variableExpenseId: string, newAmount: number) => void;
  // onUpdateGoalContribution: (goalId: string, newAmount: number) => void;
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

export function MonthlyForecastCard({ monthData, monthIndex }: MonthlyForecastCardProps) {
  const summaryItems = [
    { label: "Income", amount: monthData.totalIncome, icon: <TrendingUp className="text-green-500" />, color: "text-green-600" },
    { label: "Fixed Expenses", amount: monthData.totalFixedExpenses, icon: <Package className="text-purple-500" />, color: "text-purple-600" },
    { label: "Subscriptions", amount: monthData.totalSubscriptions, icon: <Repeat className="text-blue-500" />, color: "text-blue-600" },
    { label: "Debt Minimums", amount: monthData.totalDebtMinimumPayments, icon: <TrendingDown className="text-red-500" />, color: "text-red-600" },
    { label: "Variable Expenses", amount: monthData.totalVariableExpenses, icon: <ListChecks className="text-orange-500" />, color: "text-orange-600" },
    { label: "Goal Contributions", amount: monthData.totalGoalContributions, icon: <ShieldCheck className="text-teal-500" />, color: "text-teal-600" },
  ];

  return (
    <Card className="w-[360px] min-w-[360px] flex flex-col shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{monthData.monthLabel}</CardTitle>
        {/* <CardDescription>Projected Financials</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm overflow-y-auto max-h-[400px]">
        {summaryItems.map(item => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="flex items-center text-muted-foreground">
              {React.cloneElement(item.icon, { className: cn(item.icon.props.className, "h-4 w-4 mr-2") })} 
              {item.label}:
            </span>
            <span className={cn("font-medium", item.color)}>{formatCurrency(item.amount)}</span>
          </div>
        ))}

        <Separator className="my-3" />
        
        {/* Placeholder for detailed editable sections - Phase 2 */}
        {/* Variable Expenses Section */}
        <div className="space-y-1">
            <h4 className="font-medium text-foreground flex items-center"><ListChecks className="h-4 w-4 mr-2 text-orange-500"/>Variable Expenses</h4>
            {monthData.variableExpenses.length > 0 ? monthData.variableExpenses.map(ve => (
                <div key={ve.id} className="flex justify-between items-center pl-1">
                    <span className="text-muted-foreground truncate" title={ve.name}>{ve.name}:</span>
                    <span className="text-foreground">{formatCurrency(ve.monthSpecificAmount)}</span>
                </div>
            )) : <p className="text-xs text-muted-foreground pl-1">No variable categories budgeted.</p>}
        </div>

        <Separator className="my-3" />
        
        {/* Goal Contributions Section */}
         <div className="space-y-1">
            <h4 className="font-medium text-foreground flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-teal-500"/>Goal Contributions</h4>
            {monthData.goalContributions.length > 0 ? monthData.goalContributions.map(gc => (
                <div key={gc.id} className="flex justify-between items-center pl-1">
                    <span className="text-muted-foreground truncate" title={gc.name}>{gc.name}:</span>
                    <span className="text-foreground">{formatCurrency(gc.monthSpecificContribution)}</span>
                </div>
            )) : <p className="text-xs text-muted-foreground pl-1">No goals being contributed to this month.</p>}
        </div>


      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4 border-t mt-auto">
        <div className="flex justify-between w-full font-semibold text-md mb-1">
          <span>Remaining:</span>
          <span className={cn(
            monthData.isBalanced && "text-green-600",
            !monthData.isBalanced && monthData.remainingToBudget > 0 && "text-orange-500",
            !monthData.isBalanced && monthData.remainingToBudget < 0 && "text-red-600"
          )}>
            {formatCurrency(monthData.remainingToBudget)}
          </span>
        </div>
        {monthData.isBalanced ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white w-full justify-center">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Balanced
          </Badge>
        ) : (
          <Badge variant="outline" className={cn("w-full justify-center", monthData.remainingToBudget < 0 ? "border-red-500 text-red-500" : "border-orange-500 text-orange-500")}>
            <AlertTriangle className="mr-2 h-4 w-4" /> {monthData.remainingToBudget < 0 ? "Over Budget" : "Needs Allocation"}
          </Badge>
        )}
         <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="h-3 w-3"/>
            <span>Editing within forecast coming soon.</span>
        </div>
      </CardFooter>
    </Card>
  );
}
