
"use client";

import type { 
    RecurringItem, DebtAccount, BudgetCategory, FinancialGoal, FinancialGoalWithContribution, 
    MonthlyForecast, MonthlyForecastVariableExpense, MonthlyForecastGoalContribution,
    MonthlyForecastIncomeItem, MonthlyForecastFixedExpenseItem, MonthlyForecastSubscriptionItem, MonthlyForecastDebtPaymentItem,
    DebtAccountType
} from "@/types";
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
  differenceInCalendarMonths, isPast, format, getYear, getMonth, isSameDay
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
        monthlyContribution = amountNeeded / (monthsRemaining +1); // +1 for current month too
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
        if (item.type === 'subscription') { // For subscriptions, the first occurrence is *after* last renewal
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
      
      // Adjust checkDate if it's before creation or if the day has passed for the creation month.
      if (isBefore(checkDate, debtCreationDate)) {
          checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
          if (isBefore(checkDate, debtCreationDate)) { // If payment day in creation month is still before creation day
              checkDate = addMonths(setDate(debtCreationDate, debt.paymentDayOfMonth), 1);
          }
      }

      while (isWithinInterval(checkDate, {start: currentMonthStart, end: currentMonthEnd})) {
        if (isAfter(checkDate, debtCreationDate) || isSameDay(checkDate, debtCreationDate)) {
          debtMonthlyTotal += debt.minimumPayment;
        }
        // Advance checkDate based on frequency for multiple payments in a month
        let advancedInLoop = false;
        switch (debt.paymentFrequency) {
          case "weekly": checkDate = addWeeks(checkDate, 1); advancedInLoop = true; break;
          case "bi-weekly": checkDate = addWeeks(checkDate, 2); advancedInLoop = true; break;
          case "monthly": 
          case "annually":
          case "other":
          default: break; 
        }
        if(!advancedInLoop) break; 
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

      const monthIncomeItems: MonthlyForecastIncomeItem[] = [];
      const monthFixedExpenseItems: MonthlyForecastFixedExpenseItem[] = [];
      const monthSubscriptionItems: MonthlyForecastSubscriptionItem[] = [];
      const monthDebtPaymentItems: MonthlyForecastDebtPaymentItem[] = [];

      recurringItems.forEach(item => {
        if (item.endDate && isBefore(startOfDay(new Date(item.endDate)), monthStart)) return;
        
        let itemAmountInMonth = 0;
        if (item.frequency === 'semi-monthly') {
          if (item.semiMonthlyFirstPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlyFirstPayDate)), { start: monthStart, end: monthEnd })) {
            if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlyFirstPayDate)), startOfDay(new Date(item.endDate)))) itemAmountInMonth += item.amount;
          }
          if (item.semiMonthlySecondPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlySecondPayDate)), { start: monthStart, end: monthEnd })) {
            if (!item.endDate || !isAfter(startOfDay(new Date(item.semiMonthlySecondPayDate)), startOfDay(new Date(item.endDate)))) itemAmountInMonth += item.amount;
          }
        } else {
          let baseIterationDate: Date | null = item.type === 'subscription' ? (item.lastRenewalDate ? startOfDay(new Date(item.lastRenewalDate)) : null) : (item.startDate ? startOfDay(new Date(item.startDate)) : null);
          if (!baseIterationDate || (isAfter(baseIterationDate, monthEnd) && item.type !== 'subscription')) return;
          
          let tempDate = new Date(baseIterationDate);
          if (item.type === 'subscription') { // First occurrence after last renewal
            switch (item.frequency) {
                case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
            }
          }
          while (isBefore(tempDate, monthEnd) || isWithinInterval(tempDate, { start: monthStart, end: monthEnd })) {
            if (item.endDate && isAfter(tempDate, startOfDay(new Date(item.endDate)))) break;
            if (isWithinInterval(tempDate, { start: monthStart, end: monthEnd })) itemAmountInMonth += item.amount;
            if (isAfter(tempDate, monthEnd) && item.frequency !== 'daily') break;
            switch (item.frequency) {
                case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
                default: tempDate = addYears(tempDate, 100); break;
            }
          }
        }

        if (itemAmountInMonth > 0) {
            if (item.type === 'income') monthIncomeItems.push({ id: item.id, name: item.name, totalAmountInMonth: itemAmountInMonth });
            else if (item.type === 'fixed-expense') monthFixedExpenseItems.push({ id: item.id, name: item.name, totalAmountInMonth: itemAmountInMonth, categoryId: item.categoryId });
            else if (item.type === 'subscription') monthSubscriptionItems.push({ id: item.id, name: item.name, totalAmountInMonth: itemAmountInMonth, categoryId: item.categoryId });
        }
      });

      debtAccounts.forEach(debt => {
        let debtAmountInMonth = 0;
        const debtCreationDate = startOfDay(new Date(debt.createdAt));
        let checkDate = setDate(monthStart, debt.paymentDayOfMonth);
        
        if (isBefore(checkDate, debtCreationDate)) {
             checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
             if (isBefore(checkDate, debtCreationDate) && getMonth(checkDate) === getMonth(debtCreationDate)) { 
                checkDate = addMonths(setDate(debtCreationDate, debt.paymentDayOfMonth),1);
             } else if (isBefore(checkDate, debtCreationDate)) { 
                checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
             }
        }
        
        // Ensure checkDate starts within or before the current forecast month for iteration
        while(isBefore(checkDate, monthStart) && !(debt.paymentFrequency === 'monthly' || debt.paymentFrequency === 'annually' || debt.paymentFrequency === 'other')) {
            let advanced = false;
            switch(debt.paymentFrequency) {
                case "weekly": checkDate = addWeeks(checkDate, 1); advanced = true; break;
                case "bi-weekly": checkDate = addWeeks(checkDate, 2); advanced = true; break;
                default: break; 
            }
            if (!advanced) break; 
        }

        while (isWithinInterval(checkDate, {start: monthStart, end: monthEnd})) {
          if (isAfter(checkDate, debtCreationDate) || isSameDay(checkDate, debtCreationDate)) {
            debtAmountInMonth += debt.minimumPayment;
          }
          let advancedInLoop = false;
          switch (debt.paymentFrequency) {
            case "weekly": checkDate = addWeeks(checkDate, 1); advancedInLoop = true; break;
            case "bi-weekly": checkDate = addWeeks(checkDate, 2); advancedInLoop = true; break;
            case "monthly": 
            case "annually":
            case "other":
            default: break; 
          }
          if(!advancedInLoop) break; 
        }
        if (debtAmountInMonth > 0) {
            monthDebtPaymentItems.push({ id: debt.id, name: debt.name, totalAmountInMonth: debtAmountInMonth, debtType: debt.type });
        }
      });
      
      const totalMonthIncome = monthIncomeItems.reduce((sum, item) => sum + item.totalAmountInMonth, 0);
      const totalMonthFixedExpenses = monthFixedExpenseItems.reduce((sum, item) => sum + item.totalAmountInMonth, 0);
      const totalMonthSubscriptions = monthSubscriptionItems.reduce((sum, item) => sum + item.totalAmountInMonth, 0);
      const totalMonthDebtMinimumPayments = monthDebtPaymentItems.reduce((sum, item) => sum + item.totalAmountInMonth, 0);


      const forecastVariableExpenses: MonthlyForecastVariableExpense[] = variableCategories.map(vc => ({
        id: vc.id,
        name: vc.name,
        monthSpecificAmount: vc.budgetedAmount, // Initialize with default
      }));
      const monthTotalVariableExpenses = forecastVariableExpenses.reduce((sum, ve) => sum + ve.monthSpecificAmount, 0);

      const forecastGoalContributions: MonthlyForecastGoalContribution[] = goalsWithContributions
        .filter(goal => goal.currentAmount < goal.targetAmount) // Only active goals
        .map(goal => {
            const targetDate = startOfDay(new Date(goal.targetDate));
            const amountNeeded = goal.targetAmount - goal.currentAmount;
            let baseContribution = 0;

            if (amountNeeded > 0 && !isAfter(monthStart, targetDate)) {
                const monthsToTargetFromForecastMonth = differenceInCalendarMonths(targetDate, monthStart);
                if (monthsToTargetFromForecastMonth >= 0) {
                    baseContribution = amountNeeded / Math.max(1, monthsToTargetFromForecastMonth + 1);
                }
            }
            return {
                id: goal.id,
                name: goal.name,
                monthSpecificContribution: baseContribution > 0 ? parseFloat(baseContribution.toFixed(2)) : 0,
            };
      }).filter(gc => gc.monthSpecificContribution > 0); // Only include if there's a contribution

      const monthTotalGoalContributions = forecastGoalContributions.reduce((sum, gc) => sum + gc.monthSpecificContribution, 0);
      
      const remainingToBudget = totalMonthIncome - (totalMonthFixedExpenses + totalMonthSubscriptions + totalMonthDebtMinimumPayments + monthTotalVariableExpenses + monthTotalGoalContributions);

      newForecastData.push({
        month: monthDate,
        monthLabel,
        incomeItems: monthIncomeItems,
        fixedExpenseItems: monthFixedExpenseItems,
        subscriptionItems: monthSubscriptionItems,
        debtPaymentItems: monthDebtPaymentItems,
        totalIncome: totalMonthIncome,
        totalFixedExpenses: totalMonthFixedExpenses,
        totalSubscriptions: totalMonthSubscriptions,
        totalDebtMinimumPayments: totalMonthDebtMinimumPayments,
        variableExpenses: forecastVariableExpenses,
        totalVariableExpenses: monthTotalVariableExpenses,
        goalContributions: forecastGoalContributions,
        totalGoalContributions: monthTotalGoalContributions,
        remainingToBudget: remainingToBudget,
        isBalanced: Math.abs(remainingToBudget) < 0.01, // Check if close to zero
      });
    }
    setForecastData(newForecastData);
  }, [recurringItems, debtAccounts, variableCategories, goals, goalsWithContributions]);


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
        {/* Replace Fragment with a non-visible element that can accept props */}
        <div style={{ display: 'none' }} />
      </AddBudgetCategoryDialog>
    </div>
  );
}
