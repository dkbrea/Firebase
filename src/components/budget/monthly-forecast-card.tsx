
"use client";

import * as React from "react";
import type { MonthlyForecast, MonthlyForecastIncomeItem, MonthlyForecastFixedExpenseItem, MonthlyForecastSubscriptionItem, MonthlyForecastDebtPaymentItem } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Package, Repeat, ListChecks, ShieldCheck, ReceiptText, Info, DollarSign, Building, CreditCard, HandCoins } from "lucide-react";

interface MonthlyForecastCardProps {
  monthData: MonthlyForecast;
  monthIndex: number; // For potential future use with update handlers
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

interface ForecastItemDisplayProps {
    items: { name: string; totalAmountInMonth: number }[];
    title: string;
    icon: React.ReactNode;
    emptyMessage?: string;
    itemClassName?: string;
}

const ForecastItemsSection: React.FC<ForecastItemDisplayProps> = ({ items, title, icon, emptyMessage = "No items this month.", itemClassName }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-foreground flex items-center mb-1">
            {icon}
            {title}
            <Badge variant="outline" className="ml-auto text-xs">{formatCurrency(items.reduce((sum, item) => sum + item.totalAmountInMonth, 0))}</Badge>
        </h4>
        {items.length > 0 ? items.map(item => (
            <div key={item.name} className="flex justify-between items-center pl-1 text-xs">
                <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
                <span className={cn("text-foreground/90", itemClassName)}>{formatCurrency(item.totalAmountInMonth)}</span>
            </div>
        )) : <p className="text-xs text-muted-foreground pl-1 italic">{emptyMessage}</p>}
    </div>
);


export function MonthlyForecastCard({ monthData, monthIndex }: MonthlyForecastCardProps) {

  return (
    <Card className="w-[380px] min-w-[380px] flex flex-col shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{monthData.monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm overflow-y-auto max-h-[450px] pr-1">
        
        <ForecastItemsSection
            items={monthData.incomeItems}
            title="Income"
            icon={<TrendingUp className="h-5 w-5 mr-2 text-green-500" />}
            emptyMessage="No income projected this month."
            itemClassName="text-green-600"
        />
        <Separator className="my-2" />

        <ForecastItemsSection
            items={monthData.fixedExpenseItems}
            title="Fixed Expenses"
            icon={<Building className="h-5 w-5 mr-2 text-purple-500" />}
            emptyMessage="No fixed expenses this month."
            itemClassName="text-purple-600"
        />
        <Separator className="my-2" />

        <ForecastItemsSection
            items={monthData.subscriptionItems}
            title="Subscriptions"
            icon={<CreditCard className="h-5 w-5 mr-2 text-blue-500" />}
            emptyMessage="No subscriptions this month."
            itemClassName="text-blue-600"
        />
        <Separator className="my-2" />

        <ForecastItemsSection
            items={monthData.debtPaymentItems}
            title="Debt Minimum Payments"
            icon={<TrendingDown className="h-5 w-5 mr-2 text-red-500" />}
            emptyMessage="No debt payments this month."
            itemClassName="text-red-600"
        />
        <Separator className="my-2" />
        
        <div className="space-y-1">
            <h4 className="font-semibold text-foreground flex items-center mb-1">
                <ListChecks className="h-5 w-5 mr-2 text-orange-500"/>
                Variable Expenses
                <Badge variant="outline" className="ml-auto text-xs">{formatCurrency(monthData.totalVariableExpenses)}</Badge>
            </h4>
            {monthData.variableExpenses.length > 0 ? monthData.variableExpenses.map(ve => (
                <div key={ve.id} className="flex justify-between items-center pl-1 text-xs">
                    <span className="text-muted-foreground truncate" title={ve.name}>{ve.name}</span>
                    <span className="text-orange-600">{formatCurrency(ve.monthSpecificAmount)}</span>
                </div>
            )) : <p className="text-xs text-muted-foreground pl-1 italic">No variable categories budgeted.</p>}
        </div>
        <Separator className="my-2" />
        
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground flex items-center mb-1">
                <ShieldCheck className="h-5 w-5 mr-2 text-teal-500"/>
                Goal Contributions
                <Badge variant="outline" className="ml-auto text-xs">{formatCurrency(monthData.totalGoalContributions)}</Badge>
            </h4>
            {monthData.goalContributions.length > 0 ? monthData.goalContributions.map(gc => (
                <div key={gc.id} className="flex justify-between items-center pl-1 text-xs">
                    <span className="text-muted-foreground truncate" title={gc.name}>{gc.name}</span>
                    <span className="text-teal-600">{formatCurrency(gc.monthSpecificContribution)}</span>
                </div>
            )) : <p className="text-xs text-muted-foreground pl-1 italic">No goals being contributed to this month.</p>}
        </div>

      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4 border-t mt-auto bg-muted/30">
        <div className="flex justify-between w-full font-semibold text-md mb-1">
          <span>Remaining to Budget:</span>
          <span className={cn(
            "font-bold",
            monthData.isBalanced && "text-green-600",
            !monthData.isBalanced && monthData.remainingToBudget > 0 && "text-orange-600",
            !monthData.isBalanced && monthData.remainingToBudget < 0 && "text-red-600"
          )}>
            {formatCurrency(monthData.remainingToBudget)}
          </span>
        </div>
        {monthData.isBalanced ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-primary-foreground w-full justify-center py-1.5">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Balanced
          </Badge>
        ) : (
          <Badge variant="outline" className={cn("w-full justify-center py-1.5", monthData.remainingToBudget < 0 ? "border-red-500 text-red-500 bg-red-50" : "border-orange-500 text-orange-500 bg-orange-50")}>
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
