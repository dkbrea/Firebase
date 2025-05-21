
"use client";

import type { RecurringItem, RecurringItemType, RecurringFrequency } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, List, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecurringItemDialog } from "./add-recurring-item-dialog";
import { RecurringList } from "./recurring-list";
import { RecurringCalendarView } from "./recurring-calendar-view"; // Placeholder
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Salary", type: "income", amount: 3000, frequency: "monthly", startDate: new Date(2024, 0, 15), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Netflix Subscription", type: "subscription", amount: 15.99, frequency: "monthly", startDate: new Date(2024, 0, 5), userId: "1", createdAt: new Date() },
  { id: "rec3", name: "Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 1), userId: "1", createdAt: new Date() },
  { id: "rec4", name: "Gym Membership", type: "subscription", amount: 40, frequency: "monthly", startDate: new Date(2024, 0, 10), userId: "1", createdAt: new Date() },
  { id: "rec5", name: "Freelance Project A", type: "income", amount: 500, frequency: "weekly", startDate: new Date(2024, 6, 1), userId: "1", createdAt: new Date(), endDate: new Date(2024, 8, 30) },
];

export function RecurringManager() {
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching recurring items
    setRecurringItems(mockRecurringItems);
  }, []);

  const handleAddRecurringItem = (newItemData: Omit<RecurringItem, "id" | "userId" | "createdAt">) => {
    const newItem: RecurringItem = {
      ...newItemData,
      id: `rec-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
    };
    setRecurringItems((prevItems) => [...prevItems, newItem].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()));
    toast({
      title: "Recurring Item Added",
      description: `"${newItem.name}" has been successfully added.`,
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteRecurringItem = (itemId: string) => {
    const itemToDelete = recurringItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    setRecurringItems((prevItems) => prevItems.filter(item => item.id !== itemId));
    toast({
      title: "Recurring Item Deleted",
      description: `"${itemToDelete.name}" has been deleted.`,
      variant: "destructive",
    });
  };
  
  const handleUpdateRecurringItem = (updatedItem: RecurringItem) => {
    setRecurringItems(prevItems => 
        prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        .sort((a,b) => a.startDate.getTime() - b.startDate.getTime())
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
              <CardTitle>All Recurring Items</CardTitle>
              <CardDescription>View and manage your scheduled income and expenses.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringList
                items={recurringItems}
                onDeleteItem={handleDeleteRecurringItem}
                onEditItem={(itemToEdit) => {
                  // Logic to open AddRecurringItemDialog in edit mode
                  // For now, this will require enhancing AddRecurringItemDialog
                  // For simplicity, re-adding an item can be the current workflow.
                  // Or, we can pass the item to edit and have the dialog populate.
                  console.log("Edit item:", itemToEdit);
                   toast({ title: "Edit (Coming Soon)", description: "Editing will be fully implemented later. For now, delete and re-add if needed."})
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar">
            <RecurringCalendarView items={recurringItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
