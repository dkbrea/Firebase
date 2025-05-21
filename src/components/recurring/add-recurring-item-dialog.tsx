
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
  FormDescription as FormDesc,
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

const formSchemaBase = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  type: z.enum(recurringItemTypes, { required_error: "Please select a type." }),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "Amount must be a number." }).positive({ message: "Amount must be positive." })
  ),
  frequency: z.enum(recurringFrequencies, { required_error: "Please select a frequency." }),
  startDate: z.date().nullable().optional(),
  semiMonthlyFirstPayDate: z.date().nullable().optional(),
  semiMonthlySecondPayDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters.").optional(),
});

const refinedFormSchema = formSchemaBase.superRefine((data, ctx) => {
  // Validate endDate relative to startDate or semiMonthly dates
  if (data.endDate) {
    if (data.frequency !== 'semi-monthly' && data.startDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before start date.",
        path: ["endDate"],
      });
    }
    if (data.frequency === 'semi-monthly' && data.semiMonthlySecondPayDate && data.endDate < data.semiMonthlySecondPayDate) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before the second semi-monthly pay date.",
        path: ["endDate"],
      });
    }
     if (data.frequency === 'semi-monthly' && data.semiMonthlyFirstPayDate && data.endDate < data.semiMonthlyFirstPayDate && !data.semiMonthlySecondPayDate) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before the first semi-monthly pay date.",
        path: ["endDate"],
      });
    }
  }

  // Conditional requirements based on frequency
  if (data.frequency === 'semi-monthly') {
    if (!data.semiMonthlyFirstPayDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First upcoming pay date is required for semi-monthly frequency.",
        path: ["semiMonthlyFirstPayDate"],
      });
    }
    if (!data.semiMonthlySecondPayDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Second upcoming pay date is required for semi-monthly frequency.",
        path: ["semiMonthlySecondPayDate"],
      });
    }
    if (data.semiMonthlyFirstPayDate && data.semiMonthlySecondPayDate && data.semiMonthlySecondPayDate <= data.semiMonthlyFirstPayDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Second pay date must be after the first pay date.",
        path: ["semiMonthlySecondPayDate"],
      });
    }
  } else {
    if (!data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: data.type === 'income' ? "Next pay date is required." : "Start date is required.",
        path: ["startDate"],
      });
    }
  }
});


type AddRecurringItemFormValues = z.infer<typeof refinedFormSchema>;

interface AddRecurringItemDialogProps {
  children: ReactNode; // Trigger button
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRecurringItemAdded: (itemData: Omit<RecurringItem, "id" | "userId" | "createdAt">) => void;
}

export function AddRecurringItemDialog({ children, isOpen, onOpenChange, onRecurringItemAdded }: AddRecurringItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddRecurringItemFormValues>({
    resolver: zodResolver(refinedFormSchema),
    defaultValues: {
      name: "",
      type: undefined,
      amount: undefined,
      frequency: undefined,
      startDate: new Date(),
      semiMonthlyFirstPayDate: null,
      semiMonthlySecondPayDate: null,
      endDate: null,
      notes: "",
    },
  });

  const selectedFrequency = form.watch("frequency");
  const selectedType = form.watch("type");

  const resetFormFields = () => {
    form.reset({
      name: "",
      type: undefined,
      amount: undefined,
      frequency: undefined,
      startDate: selectedFrequency !== 'semi-monthly' ? new Date() : null,
      semiMonthlyFirstPayDate: selectedFrequency === 'semi-monthly' ? new Date() : null,
      semiMonthlySecondPayDate: selectedFrequency === 'semi-monthly' ? new Date() : null,
      endDate: null,
      notes: "",
    });
  }

  useEffect(() => {
    // Reset specific date fields when frequency changes to ensure correct default/null state
    if (selectedFrequency === 'semi-monthly') {
        form.setValue('startDate', null);
        if (!form.getValues('semiMonthlyFirstPayDate')) form.setValue('semiMonthlyFirstPayDate', new Date());
        if (!form.getValues('semiMonthlySecondPayDate')) form.setValue('semiMonthlySecondPayDate', new Date(new Date().setDate(new Date().getDate() + 15)) ); // Default 15 days after
    } else {
        form.setValue('semiMonthlyFirstPayDate', null);
        form.setValue('semiMonthlySecondPayDate', null);
        if (!form.getValues('startDate')) form.setValue('startDate', new Date());
    }
  }, [selectedFrequency, form]);


  async function onSubmit(values: AddRecurringItemFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const itemData: Partial<RecurringItem> = {
        name: values.name,
        type: values.type,
        amount: values.amount,
        frequency: values.frequency,
        endDate: values.endDate || undefined,
        notes: values.notes || undefined,
    };

    if (values.frequency === 'semi-monthly') {
        itemData.semiMonthlyFirstPayDate = values.semiMonthlyFirstPayDate;
        itemData.semiMonthlySecondPayDate = values.semiMonthlySecondPayDate;
        itemData.startDate = null; // Ensure startDate is null for semi-monthly
    } else {
        itemData.startDate = values.startDate;
        itemData.semiMonthlyFirstPayDate = null;
        itemData.semiMonthlySecondPayDate = null;
    }
    
    onRecurringItemAdded(itemData as Omit<RecurringItem, "id" | "userId" | "createdAt">);
    resetFormFields();
    setIsLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetFormFields();
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

            {selectedFrequency !== 'semi-monthly' && (
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{selectedType === 'income' ? 'Next Pay Date *' : 'Start Date *'}</FormLabel>
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
                              format(new Date(field.value), "PPP")
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
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedFrequency === 'semi-monthly' && (
              <>
                <FormField
                  control={form.control}
                  name="semiMonthlyFirstPayDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>First Upcoming Pay Date *</FormLabel>
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
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick first pay date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
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
                  name="semiMonthlySecondPayDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Second Upcoming Pay Date *</FormLabel>
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
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick second pay date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date)}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
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
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick an end date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date)}
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

