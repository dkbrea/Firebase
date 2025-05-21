
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
import { addDays, addWeeks, addMonths, addQuarters, addYears, isPast, isSameDay, setDate, getDate } from "date-fns";

const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", startDate: new Date(2024, 0, 5), userId: "1", createdAt: new Date() },
  { id: "rec3", name: "Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date() },
  { id: "rec4", name: "Gym Membership", type: "subscription", amount: 40, frequency: "monthly", startDate: new Date(2024, 0, 10),endDate: new Date(2024, 5, 10), userId: "1", createdAt: new Date() },
  { id: "rec5", name: "Freelance Project A", type: "income", amount: 500, frequency: "weekly", startDate: new Date(2024, 6, 1), userId: "1", createdAt: new Date(), endDate: new Date(2024, 8, 30) },
];

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 10, 1) },
  { id: "debt2", name: "Student Loan - Navient", type: "student-loan", balance: 22500.00, apr: 6.8, minimumPayment: 280, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date(2023, 8, 1) },
];

// Helper to calculate next occurrence for RecurringItem
const calculateNextRecurringItemOccurrence = (item: RecurringItem): Date => {
  let nextDate = new Date(item.startDate);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (item.endDate && new Date(item.endDate) < today && !isSameDay(new Date(item.endDate), today)) {
    return new Date(item.endDate);
  }
  if (nextDate > today && !(item.endDate && nextDate > new Date(item.endDate))) {
     return nextDate;
  }

  while (nextDate < today || (isSameDay(nextDate, today) && isPast(nextDate) && !isSameDay(nextDate, item.startDate))) {
     if (item.endDate && nextDate >= new Date(item.endDate)) {
        return new Date(item.endDate);
     }
    switch (item.frequency) {
      case "daily": nextDate = addDays(nextDate, 1); break;
      case "weekly": nextDate = addWeeks(nextDate, 1); break;
      case "bi-weekly": nextDate = addWeeks(nextDate, 2); break;
      case "monthly": nextDate = addMonths(nextDate, 1); break;
      case "quarterly": nextDate = addQuarters(nextDate, 1); break;
      case "yearly": nextDate = addYears(nextDate, 1); break;
      default: return nextDate;
    }
  }
  if (item.endDate && nextDate > new Date(item.endDate)) {
    return new Date(item.endDate);
  }
  return nextDate;
};

// Helper to calculate next occurrence for DebtAccount
const calculateNextDebtOccurrence = (debt: DebtAccount): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let year = today.getFullYear();
    let month = today.getMonth();

    // Create a reference date based on debt's createdAt and paymentDayOfMonth
    // This ensures the recurrence cycle is consistent from the debt's origin.
    let anchorDate = setDate(new Date(debt.createdAt.getFullYear(), debt.createdAt.getMonth(), 1), debt.paymentDayOfMonth);
    if (debt.createdAt > anchorDate && debt.createdAt.getDate() > debt.paymentDayOfMonth) {
      anchorDate = addMonths(anchorDate, 1);
    }
    
    // If the anchor is in the future, that's the first valid payment
    if (anchorDate > today) return anchorDate;

    let nextDate = new Date(anchorDate);

    while (nextDate < today) {
        switch (debt.paymentFrequency) {
            // Only monthly is fully supported for debts for simplicity here,
            // other frequencies for debts might need more complex anchor/cycle logic.
            case "monthly":
                nextDate = addMonths(nextDate, 1);
                break;
            case "bi-weekly": // Bi-weekly from anchor
                 nextDate = addWeeks(nextDate, 2);
                 break;
            case "weekly": // Weekly from anchor
                 nextDate = addWeeks(nextDate, 1);
                 break;
            // For 'annually' or 'other', this needs more specific logic or a fixed date.
            // Defaulting to monthly if not explicitly handled or if complex.
            default: // annual, other
                nextDate = addMonths(nextDate, 1); // Fallback for unhandled debt frequencies
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
    // Transform and combine lists
    const transformedRecurringItems: UnifiedRecurringListItem[] = recurringItems.map(item => {
      const nextOccurrenceDate = calculateNextRecurringItemOccurrence(item);
      const isItemEnded = item.endDate && isPast(new Date(item.endDate)) && !isSameDay(new Date(item.endDate), nextOccurrenceDate);
      return {
        id: item.id,
        name: item.name,
        itemDisplayType: item.type,
        amount: item.amount,
        frequency: item.frequency,
        nextOccurrenceDate,
        status: isItemEnded ? "Ended" : isSameDay(nextOccurrenceDate, new Date()) ? "Today" : "Upcoming",
        isDebt: false,
        endDate: item.endDate,
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
        status: isSameDay(nextOccurrenceDate, new Date()) ? "Today" : "Upcoming", // Debts don't 'end' via endDate here
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
                  console.log("Edit item:", itemToEdit);
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
