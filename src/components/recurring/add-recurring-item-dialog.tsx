
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as FormDesc, // Renamed to avoid conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import type { RecurringItem, RecurringItemType, RecurringFrequency } from "@/types";
import { recurringItemTypes, recurringFrequencies } from "@/types";
import { useState, type ReactNode, useEffect } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  type: z.enum(recurringItemTypes, { required_error: "Please select a type." }),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "Amount must be a number." }).positive({ message: "Amount must be positive." })
  ),
  frequency: z.enum(recurringFrequencies, { required_error: "Please select a frequency." }),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date().nullable().optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters.").optional(),
}).refine(data => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
        return false;
    }
    return true;
}, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
});

type AddRecurringItemFormValues = z.infer<typeof formSchema>;

interface AddRecurringItemDialogProps {
  children: ReactNode; // Trigger button
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRecurringItemAdded: (itemData: Omit<RecurringItem, "id" | "userId" | "createdAt">) => void;
  // existingItem?: RecurringItem; // For editing, placeholder for now
}

export function AddRecurringItemDialog({ children, isOpen, onOpenChange, onRecurringItemAdded }: AddRecurringItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddRecurringItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: undefined,
      amount: undefined,
      frequency: undefined,
      startDate: new Date(),
      endDate: null,
      notes: "",
    },
  });

  async function onSubmit(values: AddRecurringItemFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const itemData = {
        name: values.name,
        type: values.type,
        amount: values.amount,
        frequency: values.frequency,
        startDate: values.startDate,
        endDate: values.endDate || undefined, // Ensure undefined if null
        notes: values.notes || undefined,
    };
    onRecurringItemAdded(itemData as Omit<RecurringItem, "id" | "userId" | "createdAt">);
    form.reset({ name: "", type: undefined, amount: undefined, frequency: undefined, startDate: new Date(), endDate: null, notes: "" });
    setIsLoading(false);
    onOpenChange(false); // Close dialog on success
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset({ name: "", type: undefined, amount: undefined, frequency: undefined, startDate: new Date(), endDate: null, notes: "" });
      onOpenChange(open);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add New Recurring Item</DialogTitle>
          <DialogDescription>
            Set up your regular income, subscriptions, or fixed expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Salary, Netflix, Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recurringItemTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 15.99 or 2500" {...field} />
                  </FormControl>
                  <FormDesc>Enter a positive value. 'Type' determines if it's income or expense.</FormDesc>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recurringFrequencies.map(freq => (
                        <SelectItem key={freq} value={freq} className="capitalize">
                          {freq.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date (or leave blank)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date)}
                        // initialFocus // Might conflict if two calendars are open
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
