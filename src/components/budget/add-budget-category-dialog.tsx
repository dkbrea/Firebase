
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BudgetCategory } from "@/types";
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name cannot exceed 50 characters."}),
  budgetedAmount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ required_error: "Budgeted amount is required.", invalid_type_error: "Amount must be a number." }).min(0, { message: "Amount cannot be negative." })
  ),
});

type AddBudgetCategoryFormValues = z.infer<typeof formSchema>;

interface AddBudgetCategoryDialogProps {
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (categoryData: Omit<BudgetCategory, "id" | "userId" | "createdAt">) => void;
}

export function AddBudgetCategoryDialog({ children, isOpen, onOpenChange, onCategoryAdded }: AddBudgetCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<AddBudgetCategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", budgetedAmount: undefined },
  });

  async function onSubmit(values: AddBudgetCategoryFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onCategoryAdded(values);
    form.reset();
    setIsLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onOpenChange(open); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Variable Expense Category</DialogTitle>
          <DialogDescription>Define a new category for your variable spending and set a monthly budget for it.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl><Input placeholder="e.g., Groceries, Dining Out" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="budgetedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Budgeted Amount ($) *</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="100.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
