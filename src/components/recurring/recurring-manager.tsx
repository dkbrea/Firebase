
"use client";

import type { RecurringItem, DebtAccount, UnifiedRecurringListItem, RecurringFrequency, PaymentFrequency, PredefinedRecurringCategoryValue } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, List, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecurringItemDialog } from "./add-recurring-item-dialog";
import { RecurringList } from "./recurring-list";
import { RecurringCalendarView } from "./recurring-calendar-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurringSummaryCards } from "./recurring-summary-cards";
import { 
  addDays, addWeeks, addMonths, addQuarters, addYears, 
  isPast, isSameDay, setDate, getDate, startOfDay, 
  startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth 
} from "date-fns";

const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", lastRenewalDate: new Date(2024, 6, 5), userId: "1", createdAt: new Date(), categoryId: "subscriptions-media" },
  { id: "rec3", name: "Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date(), categoryId: "housing" },
  { id: "rec4", name: "Gym Membership", type: "subscription", amount: 40, frequency: "monthly", lastRenewalDate: new Date(2024, 5, 10),endDate: new Date(2024, 11, 10), userId: "1", createdAt: new Date(), categoryId: "health-wellness" }, // Ended gym membership
  { id: "rec5", name: "Freelance Project A", type: "income", amount: 500, frequency: "weekly", startDate: new Date(2024, 6, 1), userId: "1", createdAt: new Date(), endDate: new Date(2024, 8, 30) },
  { id: "rec6", name: "Military Pay", type: "income", amount: 2200, frequency: "semi-monthly", semiMonthlyFirstPayDate: new Date(2024, 6, 15), semiMonthlySecondPayDate: new Date(2024, 7, 1), userId: "1", createdAt: new Date() },
];

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 10, 1) },
  { id: "debt2", name: "Student Loan - Navient", type: "student-loan", balance: 22500.00, apr: 6.8, minimumPayment: 280, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 8, 1) },
];

interface MonthlySummary {
  income: number;
  fixedExpenses: number;
  subscriptions: number;
  debtPayments: number;
}

// Helper to calculate the single next occurrence for list view
const calculateNextRecurringItemOccurrence = (item: RecurringItem): Date => {
  const today = startOfDay(new Date());
  const itemEndDate = item.endDate ? startOfDay(new Date(item.endDate)) : null;

  if (itemEndDate && itemEndDate < today) {
    return itemEndDate; 
  }
  
  let baseDate: Date | null = null;
  let nextOccurrence: Date;

  if (item.type === 'subscription') {
    if (!item.lastRenewalDate) return itemEndDate || today; // Should not happen if validation is correct
    baseDate = startOfDay(new Date(item.lastRenewalDate));
    nextOccurrence = new Date(baseDate.getTime()); 
     // Start from the day *after* last renewal to find next one
    do {
      switch (item.frequency) {
        case "daily": nextOccurrence = addDays(nextOccurrence, 1); break;
        case "weekly": nextOccurrence = addWeeks(nextOccurrence, 1); break;
        case "bi-weekly": nextOccurrence = addWeeks(nextOccurrence, 2); break;
        case "monthly": nextOccurrence = addMonths(nextOccurrence, 1); break;
        case "quarterly": nextOccurrence = addQuarters(nextOccurrence, 1); break;
        case "yearly": nextOccurrence = addYears(nextOccurrence, 1); break;
        default: return itemEndDate || today; // Should not happen
      }
      if (itemEndDate && nextOccurrence > itemEndDate) return itemEndDate;
    } while (nextOccurrence < today);
  } else if (item.frequency === 'semi-monthly') {
    const date1 = item.semiMonthlyFirstPayDate ? startOfDay(new Date(item.semiMonthlyFirstPayDate)) : null;
    const date2 = item.semiMonthlySecondPayDate ? startOfDay(new Date(item.semiMonthlySecondPayDate)) : null;
    
    let upcomingDates = [];
    if (date1 && (!itemEndDate || date1 <= itemEndDate) && date1 >= today) upcomingDates.push(date1);
    if (date2 && (!itemEndDate || date2 <= itemEndDate) && date2 >= today) upcomingDates.push(date2);
    
    // If both specified dates are in the past, consider it ended relative to those specific dates
    // unless there's a general endDate that dictates otherwise.
    // For next occurrence, pick the earliest future one. If none, return the later of the two (or endDate).
    if (upcomingDates.length > 0) {
      nextOccurrence = upcomingDates.sort((a,b) => a.getTime() - b.getTime())[0];
    } else { 
      // Both specified semi-monthly dates are in the past or beyond any item-specific end date.
      // If an end date is set and is earlier than the past semi-monthly dates, that end date is the "next" (final) occurrence.
      // Otherwise, use the later of the two semi-monthly dates as the effective "last" occurrence.
      const lastSemiMonthlyDate = date2 && date1 ? (date2 > date1 ? date2 : date1) : (date2 || date1 || today);
      return itemEndDate && itemEndDate < lastSemiMonthlyDate ? itemEndDate : lastSemiMonthlyDate;
    }
  } else { // Standard income or fixed-expense (not semi-monthly)
    if (!item.startDate) return itemEndDate || today; // Should not happen if validation is correct
    baseDate = startOfDay(new Date(item.startDate));
    nextOccurrence = new Date(baseDate.getTime());
    while (nextOccurrence < today) {
      if (itemEndDate && nextOccurrence >= itemEndDate) return itemEndDate;
      switch (item.frequency) {
        case "daily": nextOccurrence = addDays(nextOccurrence, 1); break;
        case "weekly": nextOccurrence = addWeeks(nextOccurrence, 1); break;
        case "bi-weekly": nextOccurrence = addWeeks(nextOccurrence, 2); break;
        case "monthly": nextOccurrence = addMonths(nextOccurrence, 1); break;
        case "quarterly": nextOccurrence = addQuarters(nextOccurrence, 1); break;
        case "yearly": nextOccurrence = addYears(nextOccurrence, 1); break;
        default: return nextOccurrence; // Should not happen
      }
    }
  }

  if (itemEndDate && nextOccurrence > itemEndDate) return itemEndDate;
  return nextOccurrence;
};

const calculateNextDebtOccurrence = (debt: DebtAccount): Date => {
    const today = startOfDay(new Date());
    const debtCreatedAt = startOfDay(new Date(debt.createdAt));
    let currentDate = setDate(today, debt.paymentDayOfMonth);

    if (currentDate < today) { 
        currentDate = addMonths(currentDate, 1);
    }
    
    if (currentDate < debtCreatedAt) {
         currentDate = setDate(debtCreatedAt, debt.paymentDayOfMonth);
         if (currentDate < debtCreatedAt) { 
            currentDate = addMonths(currentDate, 1);
         }
    }

    let nextDate = startOfDay(new Date(currentDate));
    
    if (debt.paymentFrequency !== 'monthly') {
        let checkDate = setDate(debtCreatedAt, debt.paymentDayOfMonth);
        if (checkDate < debtCreatedAt) checkDate = addMonths(checkDate, 1);

        while(checkDate < today) {
            switch (debt.paymentFrequency) {
                case "bi-weekly": checkDate = addWeeks(checkDate, 2); break;
                case "weekly": checkDate = addWeeks(checkDate, 1); break;
                case "annually": checkDate = addYears(checkDate, 1); break;
                default: checkDate = addMonths(checkDate, 1); break; 
            }
        }
        nextDate = checkDate;
    }
    
    return nextDate;
};


export function RecurringManager() {
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(mockRecurringItems);
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>(mockDebtAccounts);
  const [unifiedList, setUnifiedList] = useState<UnifiedRecurringListItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary>({
    income: 0,
    fixedExpenses: 0,
    subscriptions: 0,
    debtPayments: 0,
  });

  // Effect for Unified List (for display)
  useEffect(() => {
    const today = startOfDay(new Date());
    const transformedRecurringItems: UnifiedRecurringListItem[] = recurringItems.map(item => {
      const nextOccurrenceDate = calculateNextRecurringItemOccurrence(item);
      const itemEndDate = item.endDate ? startOfDay(new Date(item.endDate)) : null;
      let status: UnifiedRecurringListItem['status'] = "Upcoming";

      if (itemEndDate && itemEndDate < today && isSameDay(nextOccurrenceDate, itemEndDate)) {
         status = "Ended";
      } else if (isSameDay(nextOccurrenceDate, today)) {
        status = "Today";
      } else if (nextOccurrenceDate < today) { // If calculated next is still past (e.g. for ended semi-monthly)
        status = "Ended";
      }
      
      return {
        id: item.id, name: item.name, itemDisplayType: item.type, amount: item.amount,
        frequency: item.frequency, nextOccurrenceDate, status, isDebt: false,
        endDate: item.endDate, semiMonthlyFirstPayDate: item.semiMonthlyFirstPayDate,
        semiMonthlySecondPayDate: item.semiMonthlySecondPayDate, notes: item.notes,
        categoryId: item.categoryId,
        source: 'recurring',
      };
    });

    const transformedDebtItems: UnifiedRecurringListItem[] = debtAccounts.map(debt => {
      const nextOccurrenceDate = calculateNextDebtOccurrence(debt);
      return {
        id: debt.id, name: `${debt.name} (Payment)`, itemDisplayType: 'debt-payment',
        amount: debt.minimumPayment, frequency: debt.paymentFrequency, nextOccurrenceDate,
        status: isSameDay(nextOccurrenceDate, today) ? "Today" : "Upcoming",
        isDebt: true, source: 'debt',
      };
    });

    const combined = [...transformedRecurringItems, ...transformedDebtItems];
    combined.sort((a, b) => {
        if (a.status === "Ended" && b.status !== "Ended") return 1;
        if (b.status === "Ended" && a.status !== "Ended") return -1;
        return new Date(a.nextOccurrenceDate).getTime() - new Date(b.nextOccurrenceDate).getTime();
    });
    setUnifiedList(combined);

  }, [recurringItems, debtAccounts]);

  // Effect for Monthly Summaries
  useEffect(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    let currentIncome = 0;
    let currentFixedExpenses = 0;
    let currentSubscriptions = 0;
    let currentDebtPayments = 0;

    recurringItems.forEach(item => {
      if (item.endDate && startOfDay(new Date(item.endDate)) < currentMonthStart) return; 

      let itemMonthlyTotal = 0;
      
      if (item.frequency === 'semi-monthly') {
        if (item.semiMonthlyFirstPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlyFirstPayDate)), { start: currentMonthStart, end: currentMonthEnd })) {
          if (!item.endDate || startOfDay(new Date(item.semiMonthlyFirstPayDate)) <= startOfDay(new Date(item.endDate))) {
            itemMonthlyTotal += item.amount;
          }
        }
        if (item.semiMonthlySecondPayDate && isWithinInterval(startOfDay(new Date(item.semiMonthlySecondPayDate)), { start: currentMonthStart, end: currentMonthEnd })) {
           if (!item.endDate || startOfDay(new Date(item.semiMonthlySecondPayDate)) <= startOfDay(new Date(item.endDate))) {
            itemMonthlyTotal += item.amount;
          }
        }
      } else {
        let baseIterationDate: Date | null = null;
        if (item.type === 'subscription') {
            if (!item.lastRenewalDate) return;
            baseIterationDate = startOfDay(new Date(item.lastRenewalDate));
        } else {
            if (!item.startDate) return;
            baseIterationDate = startOfDay(new Date(item.startDate));
        }

        if (baseIterationDate > currentMonthEnd) return;

        let tempDate = new Date(baseIterationDate);
        
        // For subscriptions, first actual payment is *after* last renewal. For others, it *is* the start date.
        if(item.type === 'subscription') {
            switch (item.frequency) {
                case "daily": tempDate = addDays(tempDate, 1); break;
                case "weekly": tempDate = addWeeks(tempDate, 1); break;
                case "bi-weekly": tempDate = addWeeks(tempDate, 2); break;
                case "monthly": tempDate = addMonths(tempDate, 1); break;
                case "quarterly": tempDate = addQuarters(tempDate, 1); break;
                case "yearly": tempDate = addYears(tempDate, 1); break;
            }
        }

        while (tempDate <= currentMonthEnd) {
          if (item.endDate && tempDate > startOfDay(new Date(item.endDate))) break;

          if (tempDate >= currentMonthStart) { 
             if (isWithinInterval(tempDate, { start: currentMonthStart, end: currentMonthEnd })) {
                itemMonthlyTotal += item.amount;
             }
          }
          
          if (tempDate > currentMonthEnd && item.frequency !== 'daily') break; 

          switch (item.frequency) {
            case "daily": tempDate = addDays(tempDate, 1); break;
            case "weekly": tempDate = addWeeks(tempDate, 1); break;
            case "bi-weekly": tempDate = addWeeks(tempDate, 2); break;
            case "monthly": tempDate = addMonths(tempDate, 1); break;
            case "quarterly": tempDate = addQuarters(tempDate, 1); break;
            case "yearly": tempDate = addYears(tempDate, 1); break;
            default: tempDate = addYears(tempDate, 100); break; 
          }
        }
      }

      if (item.type === 'income') currentIncome += itemMonthlyTotal;
      else if (item.type === 'fixed-expense') currentFixedExpenses += itemMonthlyTotal;
      else if (item.type === 'subscription') currentSubscriptions += itemMonthlyTotal;
    });

    debtAccounts.forEach(debt => {
      let debtMonthlyTotal = 0;
      let paymentDateForMonth = setDate(currentMonthStart, debt.paymentDayOfMonth);
      
      // Make sure the first potential payment day for this month isn't before the debt was created
      const debtCreationMonthStart = startOfMonth(new Date(debt.createdAt));
      if (paymentDateForMonth < debtCreationMonthStart && debt.paymentDayOfMonth < getDate(new Date(debt.createdAt))) {
           paymentDateForMonth = setDate(addMonths(paymentDateForMonth,1), debt.paymentDayOfMonth);
      } else if (paymentDateForMonth < debtCreationMonthStart) {
          paymentDateForMonth = setDate(debtCreationMonthStart, debt.paymentDayOfMonth);
      }


      let checkDate = new Date(paymentDateForMonth);
      if (checkDate < currentMonthStart) { // if payment day already passed for current month's start, advance to next cycle start
          switch (debt.paymentFrequency) {
            case "weekly": checkDate = addWeeks(checkDate, 1); break;
            case "bi-weekly": checkDate = addWeeks(checkDate, 2); break;
            case "monthly": checkDate = addMonths(checkDate, 1); break;
            case "annually": checkDate = addYears(checkDate, 1); break;
            default: break; // 'other' assumes one check
          }
      }
      
      // Iterate through possible pay dates in the current month
      while(isWithinInterval(checkDate, { start: currentMonthStart, end: currentMonthEnd })) {
        if (checkDate >= startOfDay(new Date(debt.createdAt))) { // Ensure payment is on or after debt creation
            debtMonthlyTotal += debt.minimumPayment;
        }
        switch (debt.paymentFrequency) {
            case "weekly": checkDate = addWeeks(checkDate, 1); break;
            case "bi-weekly": checkDate = addWeeks(checkDate, 2); break;
            // For monthly and annually, we only expect one payment per month (or less)
            // so we break after the first valid one.
            case "monthly": 
            case "annually":
            case "other":
            default: 
                checkDate = addMonths(checkDate, 1); // Effectively break by moving out of current month
                break; 
        }
      }
      currentDebtPayments += debtMonthlyTotal;
    });

    setMonthlySummaries({
      income: currentIncome,
      fixedExpenses: currentFixedExpenses,
      subscriptions: currentSubscriptions,
      debtPayments: currentDebtPayments,
    });

  }, [recurringItems, debtAccounts]);


  const handleAddRecurringItem = (newItemData: Omit<RecurringItem, "id" | "userId" | "createdAt">) => {
    const newItem: RecurringItem = {
      ...newItemData,
      id: `rec-${Date.now()}`,
      userId: "1", 
      createdAt: new Date(),
      categoryId: newItemData.categoryId || null,
    };
    setRecurringItems((prevItems) => [...prevItems, newItem]);
    toast({
      title: "Recurring Item Added",
      description: `"${newItem.name}" has been successfully added.`,
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteRecurringItem = (itemId: string, source: 'recurring' | 'debt') => {
    if (source === 'recurring') {
      const itemToDelete = recurringItems.find(item => item.id === itemId);
      if (!itemToDelete) return;
      setRecurringItems((prevItems) => prevItems.filter(item => item.id !== itemId));
      toast({
        title: "Recurring Item Deleted",
        description: `"${itemToDelete.name}" has been deleted.`,
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateRecurringItem = (updatedItem: RecurringItem) => {
    setRecurringItems(prevItems => 
        prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    toast({
        title: "Recurring Item Updated",
        description: `"${updatedItem.name}" has been updated.`,
    });
  };


  return (
    <div className="space-y-6">
      <RecurringSummaryCards summaries={monthlySummaries} />

      <div className="flex justify-end">
        <AddRecurringItemDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onRecurringItemAdded={handleAddRecurringItem}
        >
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Recurring Item
          </Button>
        </AddRecurringItemDialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
          <TabsTrigger value="list"><List className="mr-2 h-4 w-4" /> List View</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" /> Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>All Recurring Items & Debt Payments</CardTitle>
              <CardDescription>View and manage your scheduled income, expenses, and debt payments.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringList
                items={unifiedList}
                onDeleteItem={handleDeleteRecurringItem}
                onEditItem={(itemToEdit) => { 
                  const originalItem = recurringItems.find(ri => ri.id === itemToEdit.id);
                  if (originalItem) {
                     toast({ title: "Edit (Full Implementation Coming Soon)", description: `Editing "${itemToEdit.name}" would happen here. For now, delete and re-add if complex changes are needed.`})
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="calendar">
            <RecurringCalendarView items={unifiedList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
