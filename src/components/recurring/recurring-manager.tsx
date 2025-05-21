
"use client";

import type { RecurringItem, DebtAccount, UnifiedRecurringListItem, RecurringFrequency, PaymentFrequency } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, List, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecurringItemDialog } from "./add-recurring-item-dialog";
import { RecurringList } from "./recurring-list";
import { RecurringCalendarView } from "./recurring-calendar-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, addWeeks, addMonths, addQuarters, addYears, isPast, isSameDay, setDate, getDate, startOfDay } from "date-fns";

const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", startDate: new Date(2024, 0, 5), userId: "1", createdAt: new Date() },
  { id: "rec3", name: "Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date() },
  { id: "rec4", name: "Gym Membership", type: "subscription", amount: 40, frequency: "monthly", startDate: new Date(2024, 0, 10),endDate: new Date(2024, 5, 10), userId: "1", createdAt: new Date() },
  { id: "rec5", name: "Freelance Project A", type: "income", amount: 500, frequency: "weekly", startDate: new Date(2024, 6, 1), userId: "1", createdAt: new Date(), endDate: new Date(2024, 8, 30) },
  { id: "rec6", name: "Military Pay", type: "income", amount: 2200, frequency: "semi-monthly", semiMonthlyFirstPayDate: new Date(2024, 6, 15), semiMonthlySecondPayDate: new Date(2024, 7, 1), userId: "1", createdAt: new Date() },
];

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 10, 1) },
  { id: "debt2", name: "Student Loan - Navient", type: "student-loan", balance: 22500.00, apr: 6.8, minimumPayment: 280, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 8, 1) },
];

const calculateNextRecurringItemOccurrence = (item: RecurringItem): Date => {
  const today = startOfDay(new Date());

  if (item.endDate && startOfDay(new Date(item.endDate)) < today) {
    return startOfDay(new Date(item.endDate)); // Item has ended
  }

  if (item.frequency === 'semi-monthly') {
    const date1 = item.semiMonthlyFirstPayDate ? startOfDay(new Date(item.semiMonthlyFirstPayDate)) : null;
    const date2 = item.semiMonthlySecondPayDate ? startOfDay(new Date(item.semiMonthlySecondPayDate)) : null;

    let nextDate: Date | null = null;

    if (date1 && date1 >= today) {
      nextDate = date1;
    }
    if (date2 && date2 >= today) {
      if (!nextDate || date2 < nextDate) {
        nextDate = date2;
      }
    }

    if (nextDate) { // Found an upcoming date from the pair
      if (item.endDate && nextDate > startOfDay(new Date(item.endDate))) {
        return startOfDay(new Date(item.endDate)); // Next occurrence is after end date
      }
      return nextDate;
    } else { // Both provided dates are in the past or one was not provided
      // If an end date is set and passed, return end date. Otherwise, return the latest of the two if available.
      if (item.endDate) return startOfDay(new Date(item.endDate));
      return date2 || date1 || today; // Fallback, effectively ended or misconfigured
    }
  }

  // Logic for other frequencies
  if (!item.startDate) return today; // Should not happen if validation is correct

  let nextDate = startOfDay(new Date(item.startDate));
  if (nextDate >= today && (!item.endDate || nextDate <= startOfDay(new Date(item.endDate)))) {
    return nextDate;
  }
  
  // If startDate is in the past, calculate forward
  while (nextDate < today) {
    if (item.endDate && nextDate >= startOfDay(new Date(item.endDate))) {
      return startOfDay(new Date(item.endDate)); // Item ended before reaching today
    }
    switch (item.frequency) {
      case "daily": nextDate = addDays(nextDate, 1); break;
      case "weekly": nextDate = addWeeks(nextDate, 1); break;
      case "bi-weekly": nextDate = addWeeks(nextDate, 2); break;
      case "monthly": nextDate = addMonths(nextDate, 1); break;
      case "quarterly": nextDate = addQuarters(nextDate, 1); break;
      case "yearly": nextDate = addYears(nextDate, 1); break;
      default: return nextDate; // Should not happen
    }
  }

  if (item.endDate && nextDate > startOfDay(new Date(item.endDate))) {
    return startOfDay(new Date(item.endDate)); // Calculated next date is past end date
  }
  return nextDate;
};


// Helper to calculate next occurrence for DebtAccount
const calculateNextDebtOccurrence = (debt: DebtAccount): Date => {
    const today = startOfDay(new Date());
    let anchorDate = setDate(startOfDay(new Date(debt.createdAt.getFullYear(), debt.createdAt.getMonth(), 1)), debt.paymentDayOfMonth);
    
    if (startOfDay(debt.createdAt) > anchorDate && getDate(startOfDay(debt.createdAt)) > debt.paymentDayOfMonth) {
      anchorDate = addMonths(anchorDate, 1);
    }
    
    if (anchorDate > today) return anchorDate;

    let nextDate = startOfDay(new Date(anchorDate));

    while (nextDate < today) {
        switch (debt.paymentFrequency) {
            case "monthly":
                nextDate = addMonths(nextDate, 1);
                break;
            case "bi-weekly": 
                 nextDate = addWeeks(nextDate, 2);
                 break;
            case "weekly": 
                 nextDate = addWeeks(nextDate, 1);
                 break;
            default: 
                nextDate = addMonths(nextDate, 1); 
                break; 
        }
    }
    return nextDate;
};


export function RecurringManager() {
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>([]);
  const [unifiedList, setUnifiedList] = useState<UnifiedRecurringListItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setRecurringItems(mockRecurringItems);
    setDebtAccounts(mockDebtAccounts);
  }, []);

  useEffect(() => {
    const today = startOfDay(new Date());
    const transformedRecurringItems: UnifiedRecurringListItem[] = recurringItems.map(item => {
      const nextOccurrenceDate = calculateNextRecurringItemOccurrence(item);
      let status: UnifiedRecurringListItem['status'] = "Upcoming";

      if (item.endDate && startOfDay(new Date(item.endDate)) < today) {
         status = "Ended";
      } else if (item.frequency === 'semi-monthly') {
        const date1 = item.semiMonthlyFirstPayDate ? startOfDay(new Date(item.semiMonthlyFirstPayDate)) : null;
        const date2 = item.semiMonthlySecondPayDate ? startOfDay(new Date(item.semiMonthlySecondPayDate)) : null;
        if ((!date1 || date1 < today) && (!date2 || date2 < today)) {
          // Both explicitly set dates are in the past. If no end date, this logic implies it's ended.
          // If an end date exists and is also in the past, it's definitely ended.
          if (!item.endDate || (item.endDate && startOfDay(new Date(item.endDate)) < today)) {
            status = "Ended";
          }
        }
      }
      
      if (status !== "Ended" && isSameDay(nextOccurrenceDate, today)) {
        status = "Today";
      }


      return {
        id: item.id,
        name: item.name,
        itemDisplayType: item.type,
        amount: item.amount,
        frequency: item.frequency,
        nextOccurrenceDate,
        status,
        isDebt: false,
        endDate: item.endDate,
        semiMonthlyFirstPayDate: item.semiMonthlyFirstPayDate,
        semiMonthlySecondPayDate: item.semiMonthlySecondPayDate,
        notes: item.notes,
        source: 'recurring',
      };
    });

    const transformedDebtItems: UnifiedRecurringListItem[] = debtAccounts.map(debt => {
      const nextOccurrenceDate = calculateNextDebtOccurrence(debt);
      return {
        id: debt.id,
        name: `${debt.name} (Payment)`,
        itemDisplayType: 'debt-payment',
        amount: debt.minimumPayment,
        frequency: debt.paymentFrequency,
        nextOccurrenceDate,
        status: isSameDay(nextOccurrenceDate, today) ? "Today" : "Upcoming",
        isDebt: true,
        source: 'debt',
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

  const handleAddRecurringItem = (newItemData: Omit<RecurringItem, "id" | "userId" | "createdAt">) => {
    const newItem: RecurringItem = {
      ...newItemData,
      id: `rec-${Date.now()}`,
      userId: "1", 
      createdAt: new Date(),
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
    // Deleting debt items from this view is not allowed, should be done in Debt Plan
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
                  console.log("Edit item:", itemToEdit); // Placeholder for full edit implementation
                  // For now, you might allow editing some fields or show a modal with current data
                  // This could re-open AddRecurringItemDialog pre-filled with itemToEdit's data
                   toast({ title: "Edit (Coming Soon)", description: "Editing will be fully implemented later. For now, delete and re-add if needed."})
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
