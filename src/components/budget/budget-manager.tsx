
"use client";

import type { RecurringItem, DebtAccount, BudgetCategory } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { BudgetSummary } from "./budget-summary";
import { VariableExpenseList } from "./variable-expense-list";
import { AddBudgetCategoryDialog } from "./add-budget-category-dialog";
import { startOfMonth, endOfMonth, isWithinInterval, setDate, addDays, addWeeks, addMonths, addQuarters, addYears, getDate, startOfDay, isBefore, isAfter } from "date-fns";

// Mock data - in a real app, this would come from a data store / API
const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Main Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec-sm", name: "Bi-weekly Pay", type: "income", amount: 1200, frequency: "semi-monthly", semiMonthlyFirstPayDate: new Date(2024, 6, 1), semiMonthlySecondPayDate: new Date(2024, 6, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", lastRenewalDate: new Date(2024, 6, 5), userId: "1", createdAt: new Date(), categoryId: "subscriptions-media" },
  { id: "rec3", name: "Rent Payment", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date(), categoryId: "housing" },
  { id: "rec4", name: "Car Insurance", type: "fixed-expense", amount: 150, frequency: "monthly", startDate: new Date(2024, 0, 10), userId: "1", createdAt: new Date(), categoryId: "insurance" },
];
const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold Credit Card", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023,1,1) },
  { id: "debt2", name: "Student Loan - Federal", type: "student-loan", balance: 22000, apr: 5.0, minimumPayment: 250, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023,1,1) },
];
const mockVariableCategories: BudgetCategory[] = [
  { id: "var1", name: "Groceries", budgetedAmount: 400, userId: "1", createdAt: new Date() },
  { id: "var2", name: "Dining Out / Restaurants", budgetedAmount: 150, userId: "1", createdAt: new Date() },
  { id: "var3", name: "Gasoline / Transportation", budgetedAmount: 100, userId: "1", createdAt: new Date() },
  { id: "var4", name: "Entertainment", budgetedAmount: 75, userId: "1", createdAt: new Date() },
];

export function BudgetManager() {
  const { toast } = useToast();
  // In a real app, these would be fetched
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(mockRecurringItems);
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>(mockDebtAccounts);
  const [variableCategories, setVariableCategories] = useState<BudgetCategory[]>(mockVariableCategories);
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyFixedOutflows, setMonthlyFixedOutflows] = useState(0);

  useEffect(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    let calculatedIncome = 0;
    let calculatedFixedExpenses = 0;
    let calculatedSubscriptions = 0;
    let calculatedDebtPayments = 0;

    recurringItems.forEach(item => {
      if (item.endDate && isBefore(startOfDay(new Date(item.endDate)), currentMonthStart)) return; // Skip if item ended before this month

      let itemMonthlyTotal = 0;
      
      if (item.frequency === 'semi-monthly') {
        if (item.semiMonthlyFirstPayDate) {
            const firstPayDate = startOfDay(new Date(item.semiMonthlyFirstPayDate));
            if (isWithinInterval(firstPayDate, { start: currentMonthStart, end: currentMonthEnd })) {
                if (!item.endDate || !isAfter(firstPayDate, startOfDay(new Date(item.endDate)))) {
                    itemMonthlyTotal += item.amount;
                }
            }
        }
        if (item.semiMonthlySecondPayDate) {
            const secondPayDate = startOfDay(new Date(item.semiMonthlySecondPayDate));
            if (isWithinInterval(secondPayDate, { start: currentMonthStart, end: currentMonthEnd })) {
                 if (!item.endDate || !isAfter(secondPayDate, startOfDay(new Date(item.endDate)))) {
                    itemMonthlyTotal += item.amount;
                }
            }
        }
      } else {
        let baseIterationDate: Date | null = null;
        if (item.type === 'subscription') {
            if (!item.lastRenewalDate) return;
            baseIterationDate = startOfDay(new Date(item.lastRenewalDate));
        } else { // income or fixed-expense (non-semi-monthly)
            if (!item.startDate) return;
            baseIterationDate = startOfDay(new Date(item.startDate));
        }

        if (isAfter(baseIterationDate, currentMonthEnd) && item.type !== 'subscription') return; // Optimization: if start date is past current month end

        let tempDate = new Date(baseIterationDate);
        
        if(item.type === 'subscription') { // First actual payment for subscription is *after* last renewal
            switch (item.frequency) {
                case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
            }
        }

        while (isBefore(tempDate, currentMonthEnd) || isWithinInterval(tempDate, { start: currentMonthStart, end: currentMonthEnd })) {
          if (item.endDate && isAfter(tempDate, startOfDay(new Date(item.endDate)))) break;
          if (isWithinInterval(tempDate, { start: currentMonthStart, end: currentMonthEnd })) {
            itemMonthlyTotal += item.amount;
          }
          if (isAfter(tempDate, currentMonthEnd) && item.frequency !== 'daily') break; // Optimization
          
          switch (item.frequency) {
            case "daily": tempDate = addDays(tempDate, 1); break; case "weekly": tempDate = addWeeks(tempDate, 1); break;
            case "bi-weekly": tempDate = addWeeks(tempDate, 2); break; case "monthly": tempDate = addMonths(tempDate, 1); break;
            case "quarterly": tempDate = addQuarters(tempDate, 1); break; case "yearly": tempDate = addYears(tempDate, 1); break;
            default: tempDate = addYears(tempDate, 100); break; // Should not happen, effectively breaks loop
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
      let paymentDateForMonthAttempt = setDate(currentMonthStart, debt.paymentDayOfMonth);
      
      // Ensure we start looking for payments from the month of debt creation or later
      let checkDate = isAfter(paymentDateForMonthAttempt, debtCreationDate) || 
                      isWithinInterval(paymentDateForMonthAttempt, {start: debtCreationDate, end: addDays(debtCreationDate,1)}) // same day
                      ? paymentDateForMonthAttempt 
                      : setDate(debtCreationDate, debt.paymentDayOfMonth);

      if (isBefore(checkDate, debtCreationDate) && getDate(checkDate) < getDate(debtCreationDate) ) { // if day in creation month is already past
          checkDate = addMonths(setDate(debtCreationDate, debt.paymentDayOfMonth),1);
      } else if (isBefore(checkDate, debtCreationDate)) {
          checkDate = setDate(debtCreationDate, debt.paymentDayOfMonth);
      }


      // Iterate for frequencies like weekly/bi-weekly that can occur multiple times
      while (isBefore(checkDate, currentMonthEnd) || isWithinInterval(checkDate, {start: currentMonthStart, end: currentMonthEnd})) {
        if (isWithinInterval(checkDate, { start: currentMonthStart, end: currentMonthEnd }) && (isAfter(checkDate, debtCreationDate) || isWithinInterval(checkDate, {start: debtCreationDate, end: addDays(debtCreationDate,1)}))) {
          debtMonthlyTotal += debt.minimumPayment;
        }
        
        if (debt.paymentFrequency === "monthly" || debt.paymentFrequency === "annually" || debt.paymentFrequency === "other") {
            // For these, we only expect one payment to fall in the month, so break after first potential check.
            // For "annually" or "other", it's unlikely to hit multiple times unless dayOfMonth is tricky, but this logic covers one.
             break; 
        } else if (debt.paymentFrequency === "bi-weekly") {
            checkDate = addWeeks(checkDate, 2);
        } else if (debt.paymentFrequency === "weekly") {
            checkDate = addWeeks(checkDate, 1);
        } else { // Should not happen for debts based on current types
            break;
        }
      }
      calculatedDebtPayments += debtMonthlyTotal;
    });

    setMonthlyIncome(calculatedIncome);
    setMonthlyFixedOutflows(calculatedFixedExpenses + calculatedSubscriptions + calculatedDebtPayments);
  }, [recurringItems, debtAccounts]);

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
  };

  const handleDeleteVariableCategory = (categoryId: string) => {
    const categoryToDelete = variableCategories.find(cat => cat.id === categoryId);
    setVariableCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (categoryToDelete) {
        toast({ title: "Budget Category Deleted", description: `"${categoryToDelete.name}" removed.`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <BudgetSummary 
        totalIncome={monthlyIncome}
        totalFixedOutflows={monthlyFixedOutflows}
        totalBudgetedVariable={totalBudgetedVariable}
      />
      <VariableExpenseList 
        categories={variableCategories}
        onUpdateCategoryAmount={handleUpdateVariableCategoryAmount}
        onDeleteCategory={handleDeleteVariableCategory}
        onAddCategoryClick={() => setIsAddCategoryDialogOpen(true)}
      />
      <AddBudgetCategoryDialog
        isOpen={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onCategoryAdded={handleAddVariableCategory}
      >
        {/* This is a controlled dialog, the trigger is in VariableExpenseList */}
        <></> 
      </AddBudgetCategoryDialog>
    </div>
  );
}
