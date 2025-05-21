
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
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", lastRenewalDate: new Date(2024, 6, 5), userId: "1", createdAt: new Date() },
  { id: "rec3", name: "Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date() },
  { id: "rec4", name: "Gym Membership", type: "subscription", amount: 40, frequency: "monthly", lastRenewalDate: new Date(2024, 5, 10),endDate: new Date(2024, 11, 10), userId: "1", createdAt: new Date() }, // Ended gym membership
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
  
  let baseDate: Date | null = null;
  let nextOccurrence: Date;

  if (item.type === 'subscription') {
    if (!item.lastRenewalDate) return item.endDate || today; // Should not happen if validation is correct
    baseDate = startOfDay(new Date(item.lastRenewalDate));
    nextOccurrence = new Date(baseDate.getTime()); // Start with last renewal date for calculation
    // For subscriptions, we need to advance from lastRenewalDate until we are >= today
     while (nextOccurrence < today || isSameDay(nextOccurrence, baseDate) ) { // Ensure we are looking for the *next* occurrence after last renewal
      switch (item.frequency) {
        case "daily": nextOccurrence = addDays(nextOccurrence, 1); break;
        case "weekly": nextOccurrence = addWeeks(nextOccurrence, 1); break;
        case "bi-weekly": nextOccurrence = addWeeks(nextOccurrence, 2); break;
        case "monthly": nextOccurrence = addMonths(nextOccurrence, 1); break;
        case "quarterly": nextOccurrence = addQuarters(nextOccurrence, 1); break;
        case "yearly": nextOccurrence = addYears(nextOccurrence, 1); break;
        default: return item.endDate || today; // Should not happen (e.g. semi-monthly handled below)
      }
      if (item.endDate && nextOccurrence > startOfDay(new Date(item.endDate))) {
        return startOfDay(new Date(item.endDate));
      }
    }
  } else if (item.frequency === 'semi-monthly') {
    const date1 = item.semiMonthlyFirstPayDate ? startOfDay(new Date(item.semiMonthlyFirstPayDate)) : null;
    const date2 = item.semiMonthlySecondPayDate ? startOfDay(new Date(item.semiMonthlySecondPayDate)) : null;
    let upcomingSemiMonthlyDate: Date | null = null;

    if (date1 && date1 >= today) upcomingSemiMonthlyDate = date1;
    if (date2 && date2 >= today) {
      if (!upcomingSemiMonthlyDate || date2 < upcomingSemiMonthlyDate) {
        upcomingSemiMonthlyDate = date2;
      }
    }
    if (upcomingSemiMonthlyDate) {
      nextOccurrence = upcomingSemiMonthlyDate;
    } else { // Both specific dates are in the past
      return item.endDate || (date2 || date1 || today); // Effectively ended or misconfigured if no end date
    }
  } else { // Standard frequencies based on startDate
    if (!item.startDate) return item.endDate || today; // Should not happen
    baseDate = startOfDay(new Date(item.startDate));
    nextOccurrence = new Date(baseDate.getTime());
    // If startDate is in the past, calculate forward
    while (nextOccurrence < today) {
      if (item.endDate && nextOccurrence >= startOfDay(new Date(item.endDate))) {
        return startOfDay(new Date(item.endDate)); // Item ended before reaching today
      }
      switch (item.frequency) {
        case "daily": nextOccurrence = addDays(nextOccurrence, 1); break;
        case "weekly": nextOccurrence = addWeeks(nextOccurrence, 1); break;
        case "bi-weekly": nextOccurrence = addWeeks(nextOccurrence, 2); break;
        case "monthly": nextOccurrence = addMonths(nextOccurrence, 1); break;
        case "quarterly": nextOccurrence = addQuarters(nextOccurrence, 1); break;
        case "yearly": nextOccurrence = addYears(nextOccurrence, 1); break;
        default: return nextOccurrence;
      }
    }
  }

  if (item.endDate && nextOccurrence > startOfDay(new Date(item.endDate))) {
    return startOfDay(new Date(item.endDate)); // Calculated next date is past end date
  }
  return nextOccurrence;
};


// Helper to calculate next occurrence for DebtAccount
const calculateNextDebtOccurrence = (debt: DebtAccount): Date => {
    const today = startOfDay(new Date());
    // Anchor the calculation to the debt's creation month or current month if created long ago
    const calculationMonthAnchor = new Date(Math.max(debt.createdAt.getTime(), new Date(today.getFullYear(), today.getMonth() -1, 1).getTime() ));
    let anchorDate = setDate(startOfDay(new Date(calculationMonthAnchor.getFullYear(), calculationMonthAnchor.getMonth(), 1)), debt.paymentDayOfMonth);

    if (startOfDay(debt.createdAt) > anchorDate && getDate(startOfDay(debt.createdAt)) > debt.paymentDayOfMonth) {
      anchorDate = addMonths(anchorDate, 1);
    }
     // If anchorDate is in the past due to paymentDayOfMonth already passed this month, advance it
    if (anchorDate < today && getDate(today) > debt.paymentDayOfMonth) {
        anchorDate = addMonths(anchorDate,1);
    }


    let nextDate = startOfDay(new Date(anchorDate));
     // Correct initial nextDate if paymentDayOfMonth implies next month already
    if (nextDate < today || (isSameDay(nextDate, today) && debt.paymentFrequency === 'monthly' && getDate(today) > debt.paymentDayOfMonth)) {
         if (debt.paymentFrequency === "monthly") {
             nextDate = addMonths(startOfDay(setDate(today, debt.paymentDayOfMonth)), getDate(today) > debt.paymentDayOfMonth ? 1:0);
         }
    }


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
            default: // "annually" and "other" default to monthly for this simplified calculation
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

      const itemEndDate = item.endDate ? startOfDay(new Date(item.endDate)) : null;

      if (itemEndDate && itemEndDate < today) {
         status = "Ended";
      } else if (item.frequency === 'semi-monthly') {
        const date1 = item.semiMonthlyFirstPayDate ? startOfDay(new Date(item.semiMonthlyFirstPayDate)) : null;
        const date2 = item.semiMonthlySecondPayDate ? startOfDay(new Date(item.semiMonthlySecondPayDate)) : null;
        // If both specific semi-monthly dates are in the past AND no overall end date or end date is also past
        if ((!date1 || date1 < today) && (!date2 || date2 < today)) {
          if (!itemEndDate || itemEndDate < today) { // If no end date, or end date is past
            status = "Ended";
          }
        }
         // if nextOccurrenceDate is one of the semi-monthly dates, it's not necessarily ended yet
        if (status !== "Ended" && (isSameDay(nextOccurrenceDate, date1 || new Date(0)) || isSameDay(nextOccurrenceDate, date2 || new Date(0)))) {
           // if nextOccurrence is today, status is today
        }

      }
      
      if (status !== "Ended" && isSameDay(nextOccurrenceDate, today)) {
        status = "Today";
      } else if (status !== "Ended" && nextOccurrenceDate < today) { 
        // If after all calculations, the next occurrence is still in the past, and it wasn't caught by endDate logic
        // This can happen if startDate was in past, and next projected occurrence is also past today, but before end date.
        // For subscriptions, this means the last renewal was recent but next one is still past.
        // This state might need a review or could indicate an "Overdue" status in a more complex system.
        // For now, if it's not "Ended" and before "Today", it's still "Upcoming" based on future projection.
        // The core `calculateNext...` should always return a date >= today if not ended.
        // If `nextOccurrenceDate` is the `item.endDate` and that `endDate` is in the past, it is "Ended".
         if (itemEndDate && isSameDay(nextOccurrenceDate, itemEndDate) && itemEndDate < today) {
           status = "Ended";
         }
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
                  // This would typically involve opening the AddRecurringItemDialog pre-filled
                  // For now, simplified:
                  const originalItem = recurringItems.find(ri => ri.id === itemToEdit.id);
                  if (originalItem) {
                    // To properly edit, you'd likely open the dialog with itemToEdit's values.
                    // This requires AddRecurringItemDialog to accept an `existingItem` prop
                    // and pre-fill the form. This is a more significant change to that dialog.
                    // For now, a toast message indicates future capability.
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
