
"use client";

import type { RecurringItem, DebtAccount, BudgetCategory, FinancialGoal, FinancialGoalWithContribution, MonthlyForecast, MonthlyForecastVariableExpense, MonthlyForecastGoalContribution } from "@/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { BudgetSummary } from "./budget-summary";
import { VariableExpenseList } from "./variable-expense-list";
import { AddBudgetCategoryDialog } from "./add-budget-category-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetForecastView } from "./budget-forecast-view";
import { 
  startOfMonth, endOfMonth, isWithinInterval, setDate, addDays, addWeeks, 
  addMonths, addQuarters, addYears, getDate, startOfDay, isBefore, isAfter, 
  differenceInCalendarMonths, isPast, format, getYear, getMonth
} from "date-fns";

// Mock data - in a real app, this would come from a data store / API
const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Main Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec-sm", name: "Bi-weekly Pay", type: "income", amount: 1200, frequency: "semi-monthly", semiMonthlyFirstPayDate: new Date(2024, 6, 1), semiMonthlySecondPayDate: new Date(2024, 6, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", lastRenewalDate: new Date(2024, 6, 5), userId: "1", createdAt: new Date(), categoryId: "subscriptions-media" },
  { id: "rec3", name: "Rent Payment", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date(), categoryId: "housing" },
  { id: "rec4", name: "Car Insurance", type: "fixed-expense", amount: 150, frequency: "monthly", startDate: new Date(2024, 0, 10), userId: "1", createdAt: new Date(), categoryId: "insurance" },
];
const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold Credit Card", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2025,0,1) },
  { id: "debt2", name: "Student Loan - Federal", type: "student-loan", balance: 22000, apr: 5.0, minimumPayment: 250, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2025,0,1) },
];
const mockVariableCategories: BudgetCategory[] = [
  { id: "var1", name: "Groceries", budgetedAmount: 400, userId: "1", createdAt: new Date() },
  { id: "var2", name: "Dining Out / Restaurants", budgetedAmount: 150, userId: "1", createdAt: new Date() },
  { id: "var3", name: "Gasoline / Transportation", budgetedAmount: 100, userId: "1", createdAt: new Date() },
  { id: "var4", name: "Entertainment", budgetedAmount: 75, userId: "1", createdAt: new Date() },
];
const mockGoals: FinancialGoal[] = [
  { id: "goal1", name: "New Car Down Payment", targetAmount: 5000, currentAmount: 1200, targetDate: new Date(2025, 11, 31), icon: "car", userId: "1", createdAt: new Date() },
  { id: "goal2", name: "Vacation to Hawaii", targetAmount: 3000, currentAmount: 300, targetDate: new Date(2025, 11, 31), icon: "plane", userId: "1", createdAt: new Date() },
  { id: "goal3", name: "Emergency Fund Top-up", targetAmount: 10000, currentAmount: 8500, targetDate: new Date(2025, 11, 31), icon: "shield-check", userId: "1", createdAt: new Date() },
];


export function BudgetManager() {
  const { toast } = useToast();
  // In a real app, these would be fetched
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(mockRecurringItems);
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>(mockDebtAccounts);
  const [variableCategories, setVariableCategories] = useState<BudgetCategory[]>(mockVariableCategories);
  const [goals, setGoals] = useState<FinancialGoal[]>(mockGoals); 
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [currentMonthSummary, setCurrentMonthSummary] = useState({
    income: 0,
    fixedOutflows: 0, // Fixed Expenses + Subscriptions + Debt Minimums + Goal Contributions
    goalContributions: 0,
  });

  const [forecastData, setForecastData] = useState<MonthlyForecast[]>([]);

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
        monthlyContribution = amountNeeded / monthsRemaining;
      }
      
      return {
        ...goal,
        monthsRemaining: Math.max(0, monthsRemaining),
        monthlyContribution: monthlyContribution > 0 ? monthlyContribution : 0,
      };
    }).sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [goals]);

  // Calculate total monthly goal contributions for the *current month's* budget
  const totalCurrentMonthGoalContributions = useMemo(() => {
    return goalsWithContributions.reduce((sum, goal) => {
      if (goal.currentAmount < goal.targetAmount && goal.monthsRemaining > 0) {
        return sum + goal.monthlyContribution;
      }
      return sum;
    }, 0);
  }, [goalsWithContributions]);

  // Calculate summaries for the *current month*
  useEffect(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    let calculatedIncome = 0;
    let calculatedFixedExpenses = 0;
    let calculatedSubscriptions = 0;
    let calculatedDebtPayments = 0;

    recurringItems.forEach(item => {
      if (item.endDate && isBefore(startOfDay(new Date(item.endDate)), currentMonthStart)) return;
      let itemMonthlyTotal = 0;
      if (item.frequency === 'semi-monthly') {
        if (item.semiMonthlyFirstPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlyFirstPayDate)), { start: currentMonthStart, end: currentMonthEnd })) {
          if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlyFirstPayDate)), startOfDay(new Date(item.endDate)))) itemMonthlyTotal += item.amount;
        }
        if (item.semiMonthlySecondPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlySecondPayDate)), { start: currentMonthStart, end: currentMonthEnd })) {
          if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlySecondPayDate)), startOfDay(new Date(item.endDate)))) itemMonthlyTotal += item.amount;
        }
      } else {
        let baseIterationDate: Date | null = item.type === 'subscription' ? (item.lastRenewalDate ? startOfDay(new Date(item.lastRenewalDate)) : null) : (item.startDate ? startOfDay(new Date(item.startDate)) : null);
        if (!baseIterationDate || (isAfter(baseIterationDate, currentMonthEnd) && item.type !== 'subscription')) return;
        let tempDate = new Date(baseIterationDate);
        if (item.type === 'subscription') {
          switch (item.frequency) {
            case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
            case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
            case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
          }
        }
        while (isBefore(tempDate, currentMonthEnd) || isWithinInterval(tempDate, { start: currentMonthStart, end: currentMonthEnd })) {
          if (item.endDate && isAfter(tempDate, startOfDay(new Date(item.endDate)))) break;
          if (isWithinInterval(tempDate, { start: currentMonthStart, end: currentMonthEnd })) itemMonthlyTotal += item.amount;
          if (isAfter(tempDate, currentMonthEnd) && item.frequency !== 'daily') break;
          switch (item.frequency) {
            case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
            case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
            case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
            default: tempDate = addYears(tempDate, 100); break;
          }
        }
      }
      if (item.type === 'income') calculatedIncome += itemMonthlyTotal;
      else if (item.type === 'fixed-expense') calculatedFixedExpenses += itemMonthlyTotal;
      else if (item.type === 'subscription') calculatedSubscriptions += itemMonthlyTotal;
    });

    debtAccounts.forEach(debt => {
      let debtMonthlyTotal = 0;
      const debtCreationDate = startOfDay(new Date(debt.createdAt));
      let checkDate = setDate(currentMonthStart, debt.paymentDayOfMonth);
      if (isBefore(checkDate, debtCreationDate) && getDate(checkDate) < getDate(debtCreationDate)) checkDate = addMonths(setDate(debtCreationDate, debt.paymentDayOfMonth),1);
      else if (isBefore(checkDate, debtCreationDate)) checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);

      while (isBefore(checkDate, currentMonthEnd) || isWithinInterval(checkDate, {start: currentMonthStart, end: currentMonthEnd})) {
        if (isWithinInterval(checkDate, { start: currentMonthStart, end: currentMonthEnd }) && (isAfter(checkDate, debtCreationDate) || isWithinInterval(checkDate, {start: debtCreationDate, end: addDays(debtCreationDate,1)}))) {
          debtMonthlyTotal += debt.minimumPayment;
        }
        if (debt.paymentFrequency === "monthly" || debt.paymentFrequency === "annually" || debt.paymentFrequency === "other") break;
        else if (debt.paymentFrequency === "bi-weekly") checkDate = addWeeks(checkDate, 2);
        else if (debt.paymentFrequency === "weekly") checkDate = addWeeks(checkDate, 1);
        else break;
      }
      calculatedDebtPayments += debtMonthlyTotal;
    });

    setCurrentMonthSummary({
        income: calculatedIncome,
        fixedOutflows: calculatedFixedExpenses + calculatedSubscriptions + calculatedDebtPayments + totalCurrentMonthGoalContributions,
        goalContributions: totalCurrentMonthGoalContributions,
    });
  }, [recurringItems, debtAccounts, totalCurrentMonthGoalContributions]);


  // Generate 12-Month Forecast Data
  useEffect(() => {
    const currentYear = getYear(new Date());
    const newForecastData: MonthlyForecast[] = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = startOfMonth(new Date(currentYear, monthIndex, 1));
      const monthStart = startOfDay(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMMM yyyy");

      let monthIncome = 0;
      let monthFixedExpenses = 0;
      let monthSubscriptions = 0;
      let monthDebtMinimumPayments = 0;

      recurringItems.forEach(item => {
        if (item.endDate && isBefore(startOfDay(new Date(item.endDate)), monthStart)) return;
        let itemMonthlyTotal = 0;
        if (item.frequency === 'semi-monthly') {
          if (item.semiMonthlyFirstPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlyFirstPayDate)), { start: monthStart, end: monthEnd })) {
            if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlyFirstPayDate)), startOfDay(new Date(item.endDate)))) itemMonthlyTotal += item.amount;
          }
          if (item.semiMonthlySecondPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlySecondPayDate)), { start: monthStart, end: monthEnd })) {
            if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlySecondPayDate)), startOfDay(new Date(item.endDate)))) itemMonthlyTotal += item.amount;
          }
        } else {
          let baseIterationDate: Date | null = item.type === 'subscription' ? (item.lastRenewalDate ? startOfDay(new Date(item.lastRenewalDate)) : null) : (item.startDate ? startOfDay(new Date(item.startDate)) : null);
          if (!baseIterationDate || (isAfter(baseIterationDate, monthEnd) && item.type !== 'subscription')) return;
          let tempDate = new Date(baseIterationDate);
          if (item.type === 'subscription') {
            switch (item.frequency) { /* ... advance logic ... */ 
                case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
            }
          }
          while (isBefore(tempDate, monthEnd) || isWithinInterval(tempDate, { start: monthStart, end: monthEnd })) {
            if (item.endDate && isAfter(tempDate, startOfDay(new Date(item.endDate)))) break;
            if (isWithinInterval(tempDate, { start: monthStart, end: monthEnd })) itemMonthlyTotal += item.amount;
            if (isAfter(tempDate, monthEnd) && item.frequency !== 'daily') break;
            switch (item.frequency) { /* ... advance logic ... */
                case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
                default: tempDate = addYears(tempDate, 100); break;
            }
          }
        }
        if (item.type === 'income') monthIncome += itemMonthlyTotal;
        else if (item.type === 'fixed-expense') monthFixedExpenses += itemMonthlyTotal;
        else if (item.type === 'subscription') monthSubscriptions += itemMonthlyTotal;
      });

      debtAccounts.forEach(debt => {
        let debtMonthlyTotal = 0;
        const debtCreationDate = startOfDay(new Date(debt.createdAt));
        let checkDate = setDate(monthStart, debt.paymentDayOfMonth);
        // Adjust checkDate to be on or after debt creation, and handle payment day correctly for the specific month
        if (isBefore(checkDate, debtCreationDate)) {
             checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
             if (isBefore(checkDate, debtCreationDate) && getMonth(checkDate) === getMonth(debtCreationDate)) { // if payment day for creation month already passed
                checkDate = addMonths(setDate(debtCreationDate, debt.paymentDayOfMonth),1);
             } else if (isBefore(checkDate, debtCreationDate)) { // if payment day is earlier in creation month
                checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
             }
        }
         // If checkDate is before the current forecast month, advance it until it's in or after
        while(isBefore(checkDate, monthStart)) {
            switch(debt.paymentFrequency) {
                case "weekly": checkDate = addWeeks(checkDate, 1); break;
                case "bi-weekly": checkDate = addWeeks(checkDate, 2); break;
                case "monthly": checkDate = addMonths(checkDate, 1); break;
                case "annually": checkDate = addYears(checkDate, 1); break;
                default: checkDate = addMonths(checkDate, 1); break; // Ensure it moves forward
            }
        }


        while (isWithinInterval(checkDate, {start: monthStart, end: monthEnd})) {
          if (isAfter(checkDate, debtCreationDate) || isSameDay(checkDate, debtCreationDate)) {
            debtMonthlyTotal += debt.minimumPayment;
          }
          if (debt.paymentFrequency === "monthly" || debt.paymentFrequency === "annually" || debt.paymentFrequency === "other") break;
          else if (debt.paymentFrequency === "bi-weekly") checkDate = addWeeks(checkDate, 2);
          else if (debt.paymentFrequency === "weekly") checkDate = addWeeks(checkDate, 1);
          else break;
        }
        monthDebtMinimumPayments += debtMonthlyTotal;
      });

      const forecastVariableExpenses: MonthlyForecastVariableExpense[] = variableCategories.map(vc => ({
        id: vc.id,
        name: vc.name,
        monthSpecificAmount: vc.budgetedAmount, // Initialize with default
      }));
      const monthTotalVariableExpenses = forecastVariableExpenses.reduce((sum, ve) => sum + ve.monthSpecificAmount, 0);

      const forecastGoalContributions: MonthlyForecastGoalContribution[] = goals.map(goal => {
        // Simplified: use original monthly contribution if goal is active in this month
        const targetDate = startOfDay(new Date(goal.targetDate));
        const amountNeeded = goal.targetAmount - goal.currentAmount;
        let baseContribution = 0;
        if (amountNeeded > 0 && !isAfter(monthStart, targetDate)) {
           const monthsToTargetFromForecastMonth = differenceInCalendarMonths(targetDate, monthStart);
           if (monthsToTargetFromForecastMonth >=0) {
             baseContribution = amountNeeded / Math.max(1, monthsToTargetFromForecastMonth);
           } else { // target date past for this forecast month
             baseContribution = 0; // or amountNeeded if you want to show it as due
           }
        }
        return {
          id: goal.id,
          name: goal.name,
          monthSpecificContribution: baseContribution > 0 ? baseContribution : 0,
        };
      });
      const monthTotalGoalContributions = forecastGoalContributions.reduce((sum, gc) => sum + gc.monthSpecificContribution, 0);
      
      const remainingToBudget = monthIncome - (monthFixedExpenses + monthSubscriptions + monthDebtMinimumPayments + monthTotalVariableExpenses + monthTotalGoalContributions);

      newForecastData.push({
        month: monthDate,
        monthLabel,
        totalIncome: monthIncome,
        totalFixedExpenses: monthFixedExpenses,
        totalSubscriptions: monthSubscriptions,
        totalDebtMinimumPayments: monthDebtMinimumPayments,
        variableExpenses: forecastVariableExpenses,
        totalVariableExpenses: monthTotalVariableExpenses,
        goalContributions: forecastGoalContributions,
        totalGoalContributions: monthTotalGoalContributions,
        remainingToBudget: remainingToBudget,
        isBalanced: Math.abs(remainingToBudget) < 0.01, // Check if close to zero
      });
    }
    setForecastData(newForecastData);
  }, [recurringItems, debtAccounts, variableCategories, goals]);


  const totalBudgetedVariable = useMemo(() => {
    return variableCategories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
  }, [variableCategories]);

  const handleAddVariableCategory = (categoryData: Omit<BudgetCategory, "id" | "userId" | "createdAt">) => {
    const newCategory: BudgetCategory = {
      ...categoryData,
      id: `var-${Date.now()}`,
      userId: "1", 
      createdAt: new Date(),
    };
    setVariableCategories(prev => [...prev, newCategory]);
    toast({ title: "Budget Category Added", description: `"${newCategory.name}" added to your variable expenses.` });
  };

  const handleUpdateVariableCategoryAmount = (categoryId: string, newAmount: number) => {
    setVariableCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, budgetedAmount: newAmount } : cat));
     // Also update in forecast data for the current month if needed, or rely on re-calculation
  };

  const handleDeleteVariableCategory = (categoryId: string) => {
    const categoryToDelete = variableCategories.find(cat => cat.id === categoryId);
    setVariableCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (categoryToDelete) {
        toast({ title: "Budget Category Deleted", description: `"${categoryToDelete.name}" removed.`, variant: "destructive" });
    }
  };
  
  // Placeholder for updating forecast data - will be implemented in Phase 2
  const handleUpdateForecastVariableAmount = (monthIndex: number, variableExpenseId: string, newAmount: number) => {
    // TODO: Phase 2 - Update forecastData state
    console.log(`Update forecast: Month ${monthIndex}, VarExpense ${variableExpenseId}, Amount ${newAmount}`);
  };
  const handleUpdateForecastGoalContribution = (monthIndex: number, goalId: string, newAmount: number) => {
    // TODO: Phase 2 - Update forecastData state
    console.log(`Update forecast: Month ${monthIndex}, Goal ${goalId}, Amount ${newAmount}`);
  };


  return (
    <div className="space-y-8">
      <Tabs defaultValue="currentMonth" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="currentMonth">Current Month Budget</TabsTrigger>
          <TabsTrigger value="forecast">12-Month Forecast</TabsTrigger>
        </TabsList>
        <TabsContent value="currentMonth">
          <BudgetSummary 
            totalIncome={currentMonthSummary.income}
            totalFixedOutflows={currentMonthSummary.fixedOutflows}
            totalBudgetedVariable={totalBudgetedVariable}
            totalGoalContributions={currentMonthSummary.goalContributions}
          />
          <VariableExpenseList 
            categories={variableCategories}
            onUpdateCategoryAmount={handleUpdateVariableCategoryAmount}
            onDeleteCategory={handleDeleteVariableCategory}
            onAddCategoryClick={() => setIsAddCategoryDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="forecast">
            <BudgetForecastView 
                forecastData={forecastData}
                onUpdateVariableAmount={handleUpdateForecastVariableAmount}
                onUpdateGoalContribution={handleUpdateForecastGoalContribution}
            />
        </TabsContent>
      </Tabs>
      
      <AddBudgetCategoryDialog
        isOpen={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onCategoryAdded={handleAddVariableCategory}
      >
        <></> 
      </AddBudgetCategoryDialog>
    </div>
  );
}
