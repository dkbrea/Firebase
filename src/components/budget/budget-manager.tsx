
"use client";

import type {
    RecurringItem, DebtAccount, BudgetCategory, FinancialGoal, FinancialGoalWithContribution,
    MonthlyForecast, MonthlyForecastVariableExpense, MonthlyForecastGoalContribution,
    MonthlyForecastIncomeItem, MonthlyForecastFixedExpenseItem, MonthlyForecastSubscriptionItem, MonthlyForecastDebtPaymentItem,
    DebtAccountType
} from "@/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { BudgetSummary } from "./budget-summary";
import { VariableExpenseList } from "./variable-expense-list";
import { AddBudgetCategoryDialog } from "./add-budget-category-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetForecastView } from "./budget-forecast-view";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  startOfMonth, endOfMonth, isWithinInterval, setDate, addDays, addWeeks,
  addMonths, addQuarters, addYears, getDate, startOfDay, isBefore, isAfter,
  differenceInCalendarMonths, isPast, format, getYear, getMonth, isSameDay
} from "date-fns";

export function BudgetManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>([]);
  const [variableCategories, setVariableCategories] = useState<BudgetCategory[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch recurring items
        const { data: recurringData, error: recurringError } = await supabase
          .from('recurring_items')
          .select('*')
          .eq('user_id', user.id);

        if (recurringError) throw new Error(recurringError.message);

        // Fetch debt accounts
        const { data: debtData, error: debtError } = await supabase
          .from('debt_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (debtError) throw new Error(debtError.message);

        // Fetch budget categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('budget_categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesError) throw new Error(categoriesError.message);

        // Fetch financial goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('financial_goals')
          .select('*')
          .eq('user_id', user.id);

        if (goalsError) throw new Error(goalsError.message);

        // Transform the data to match our types
        const formattedRecurringItems = recurringData?.map(item => {
          const recurringItem: RecurringItem = {
            id: item.id,
            name: item.name,
            type: item.type,
            amount: item.amount,
            frequency: item.frequency,
            startDate: item.start_date ? new Date(item.start_date) : null,
            lastRenewalDate: item.last_renewal_date ? new Date(item.last_renewal_date) : null,
            endDate: item.end_date ? new Date(item.end_date) : null,
            semiMonthlyFirstPayDate: item.semi_monthly_first_pay_date ? new Date(item.semi_monthly_first_pay_date) : null,
            semiMonthlySecondPayDate: item.semi_monthly_second_pay_date ? new Date(item.semi_monthly_second_pay_date) : null,
            userId: item.user_id,
            createdAt: new Date(item.created_at),
            categoryId: item.category_id || null,
          };
          
          // Only add notes if it exists
          if (item.notes) {
            recurringItem.notes = item.notes;
          }
          
          return recurringItem;
        }) || [];

        const formattedDebtAccounts: DebtAccount[] = debtData?.map(debt => ({
          id: debt.id,
          name: debt.name,
          type: debt.type,
          balance: debt.balance,
          apr: debt.apr,
          minimumPayment: debt.minimum_payment,
          paymentDayOfMonth: debt.payment_day_of_month,
          paymentFrequency: debt.payment_frequency,
          userId: debt.user_id,
          createdAt: new Date(debt.created_at)
        })) || [];

        const formattedCategories: BudgetCategory[] = categoriesData?.map(category => ({
          id: category.id,
          name: category.name,
          budgetedAmount: category.budgeted_amount,
          userId: category.user_id,
          createdAt: new Date(category.created_at)
        })) || [];

        const formattedGoals: FinancialGoal[] = goalsData?.map(goal => ({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          targetDate: new Date(goal.target_date),
          icon: goal.icon,
          userId: goal.user_id,
          createdAt: new Date(goal.created_at)
        })) || [];

        setRecurringItems(formattedRecurringItems);
        setDebtAccounts(formattedDebtAccounts);
        setVariableCategories(formattedCategories);
        setGoals(formattedGoals);
      } catch (error) {
        console.error('Error fetching budget data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load budget data.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  const [currentMonthSummary, setCurrentMonthSummary] = useState({
    totalIncome: 0,
    totalActualFixedExpenses: 0, // 'fixed-expense' type recurring items
    totalSubscriptions: 0,
    totalDebtPayments: 0,
    totalGoalContributions: 0,
  });

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
        monthlyContribution = amountNeeded / (monthsRemaining + 1); // +1 for current month too
      }

      return {
        ...goal,
        monthsRemaining: Math.max(0, monthsRemaining),
        monthlyContribution: monthlyContribution > 0 ? monthlyContribution : 0,
      };
    }).sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [goals]);

  const totalCurrentMonthGoalContributions = useMemo(() => {
    return goalsWithContributions.reduce((sum, goal) => {
      if (goal.currentAmount < goal.targetAmount && goal.monthsRemaining > 0) {
        return sum + goal.monthlyContribution;
      }
      return sum;
    }, 0);
  }, [goalsWithContributions]);

  useEffect(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    let calculatedIncome = 0;
    let calculatedActualFixedExpenses = 0; // Specifically for 'fixed-expense' type
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
      else if (item.type === 'fixed-expense') calculatedActualFixedExpenses += itemMonthlyTotal;
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
        totalIncome: calculatedIncome,
        totalActualFixedExpenses: calculatedActualFixedExpenses,
        totalSubscriptions: calculatedSubscriptions,
        totalDebtPayments: calculatedDebtPayments,
        totalGoalContributions: totalCurrentMonthGoalContributions,
    });
  }, [recurringItems, debtAccounts, totalCurrentMonthGoalContributions]);

  const [forecastData, setForecastData] = useState<MonthlyForecast[]>([]);

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
            monthDebtPaymentItems.push({
              id: debt.id,
              name: debt.name,
              totalAmountInMonth: debtAmountInMonth,
              debtType: debt.type,
              additionalPayment: 0 // Initialize additional payment to 0
            });
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
      const monthTotalAdditionalDebtPayments = monthDebtPaymentItems.reduce((sum, debt) => sum + (debt.additionalPayment || 0), 0);

      const remainingToBudget = totalMonthIncome - (totalMonthFixedExpenses + totalMonthSubscriptions + totalMonthDebtMinimumPayments + monthTotalAdditionalDebtPayments + monthTotalVariableExpenses + monthTotalGoalContributions);

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

  const handleAddCategory = async (newCategory: Omit<BudgetCategory, "id" | "userId" | "createdAt">) => {
    if (!user?.id) return;
    
    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          name: newCategory.name,
          budgeted_amount: newCategory.budgetedAmount,
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add to local state
      const category: BudgetCategory = {
        id: data.id,
        name: data.name,
        budgetedAmount: data.budgeted_amount,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
      };
      
      setVariableCategories([...variableCategories, category]);
      setIsAddCategoryDialogOpen(false);
      
      toast({
        title: "Category Added",
        description: `"${category.name}" has been added to your budget.`,
      });
    } catch (error) {
      console.error('Error adding budget category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add budget category.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateVariableCategoryAmount = (categoryId: string, newAmount: number) => {
    setVariableCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, budgetedAmount: newAmount } : cat));
     // This also requires updating the *current month's default* in forecast if it's the current month,
     // or rely on full forecast re-calculation if variableCategories changes.
  };

  const handleDeleteVariableCategory = (categoryId: string) => {
    const categoryToDelete = variableCategories.find(cat => cat.id === categoryId);
    setVariableCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (categoryToDelete) {
        toast({ title: "Budget Category Deleted", description: `"${categoryToDelete.name}" removed.`, variant: "destructive" });
    }
  };

  const updateForecastMonth = (monthIndex: number, updatedMonthData: Partial<MonthlyForecast>) => {
    setForecastData(prevData => {
        const newData = [...prevData];
        const currentMonth = {...newData[monthIndex], ...updatedMonthData};

        // Recalculate totals and remaining for the specific month
        currentMonth.totalVariableExpenses = currentMonth.variableExpenses.reduce((sum, ve) => sum + ve.monthSpecificAmount, 0);
        currentMonth.totalGoalContributions = currentMonth.goalContributions.reduce((sum, gc) => sum + gc.monthSpecificContribution, 0);
        const totalAdditionalDebtPayments = currentMonth.debtPaymentItems.reduce((sum, debt) => sum + (debt.additionalPayment || 0), 0);

        currentMonth.remainingToBudget = currentMonth.totalIncome - (
            currentMonth.totalFixedExpenses +
            currentMonth.totalSubscriptions +
            currentMonth.totalDebtMinimumPayments +
            totalAdditionalDebtPayments +
            currentMonth.totalVariableExpenses +
            currentMonth.totalGoalContributions
        );
        currentMonth.isBalanced = Math.abs(currentMonth.remainingToBudget) < 0.01;

        newData[monthIndex] = currentMonth;
        return newData;
    });
  };

  const handleUpdateForecastVariableAmount = (monthIndex: number, variableExpenseId: string, newAmount: number) => {
    const monthToUpdate = forecastData[monthIndex];
    if (!monthToUpdate) return;

    const updatedVariableExpenses = monthToUpdate.variableExpenses.map(ve =>
      ve.id === variableExpenseId ? { ...ve, monthSpecificAmount: newAmount } : ve
    );
    updateForecastMonth(monthIndex, { variableExpenses: updatedVariableExpenses });
  };

  const handleUpdateForecastGoalContribution = (monthIndex: number, goalId: string, newAmount: number) => {
    const monthToUpdate = forecastData[monthIndex];
    if (!monthToUpdate) return;

    const updatedGoalContributions = monthToUpdate.goalContributions.map(gc =>
      gc.id === goalId ? { ...gc, monthSpecificContribution: newAmount } : gc
    );
    updateForecastMonth(monthIndex, { goalContributions: updatedGoalContributions });
  };

  const handleUpdateForecastDebtAdditionalPayment = (monthIndex: number, debtId: string, newAdditionalAmount: number) => {
    const monthToUpdate = forecastData[monthIndex];
    if (!monthToUpdate) return;

    const updatedDebtPayments = monthToUpdate.debtPaymentItems.map(dp =>
      dp.id === debtId ? { ...dp, additionalPayment: newAdditionalAmount } : dp
    );
    updateForecastMonth(monthIndex, { debtPaymentItems: updatedDebtPayments });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="currentMonth" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="currentMonth">Current Month Budget</TabsTrigger>
          <TabsTrigger value="forecast">12-Month Forecast</TabsTrigger>
        </TabsList>
        <TabsContent value="currentMonth">
          <BudgetSummary
            totalIncome={currentMonthSummary.totalIncome}
            totalActualFixedExpenses={currentMonthSummary.totalActualFixedExpenses}
            totalSubscriptions={currentMonthSummary.totalSubscriptions}
            totalDebtPayments={currentMonthSummary.totalDebtPayments}
            totalGoalContributions={currentMonthSummary.totalGoalContributions}
            totalBudgetedVariable={totalBudgetedVariable}
            onAddCategoryClick={() => setIsAddCategoryDialogOpen(true)}
          />
          <VariableExpenseList
            categories={variableCategories}
            onUpdateCategoryAmount={handleUpdateVariableCategoryAmount}
            onDeleteCategory={handleDeleteVariableCategory}
          />
        </TabsContent>
        <TabsContent value="forecast">
            <BudgetForecastView
                forecastData={forecastData}
                onUpdateVariableAmount={handleUpdateForecastVariableAmount}
                onUpdateGoalContribution={handleUpdateForecastGoalContribution}
                onUpdateDebtAdditionalPayment={handleUpdateForecastDebtAdditionalPayment}
            />
        </TabsContent>
      </Tabs>

      <AddBudgetCategoryDialog
        isOpen={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onCategoryAdded={handleAddCategory}
      >
        <div style={{ display: 'none' }} />
      </AddBudgetCategoryDialog>
    </div>
  );
}

    