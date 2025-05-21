
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
import type { RecurringItem, RecurringItemType, RecurringFrequency, PredefinedRecurringCategoryValue } from "@/types";
import { recurringItemTypes, recurringFrequencies, predefinedRecurringCategories } from "@/types";
import { useState, type ReactNode, useEffect } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";

const formSchemaBase = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  type: z.enum(recurringItemTypes, { required_error: "Please select a type." }),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "Amount must be a number." }).positive({ message: "Amount must be positive." })
  ),
  frequency: z.enum(recurringFrequencies, { required_error: "Please select a frequency." }),
  startDate: z.date().nullable().optional(),
  lastRenewalDate: z.date().nullable().optional(),
  semiMonthlyFirstPayDate: z.date().nullable().optional(),
  semiMonthlySecondPayDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters.").optional(),
  categoryId: z.string().nullable().optional() as z.ZodType<PredefinedRecurringCategoryValue | null | undefined>,
});

const refinedFormSchema = formSchemaBase.superRefine((data, ctx) => {
  const today = startOfDay(new Date());

  // End date validation
  if (data.type !== 'income' && data.endDate) {
    let baseDateForEndDateValidation: Date | null = null;
    if (data.type === 'subscription' && data.lastRenewalDate) {
      baseDateForEndDateValidation = data.lastRenewalDate;
    } else if (data.frequency === 'semi-monthly' && data.semiMonthlySecondPayDate) {
      baseDateForEndDateValidation = data.semiMonthlySecondPayDate;
    } else if (data.frequency === 'semi-monthly' && data.semiMonthlyFirstPayDate && !data.semiMonthlySecondPayDate) {
        baseDateForEndDateValidation = data.semiMonthlyFirstPayDate;
    } else if (data.startDate) {
      baseDateForEndDateValidation = data.startDate;
    }
    if (baseDateForEndDateValidation && data.endDate < baseDateForEndDateValidation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date cannot be before the relevant start/renewal/pay date.", path: ["endDate"] });
    }
  }

  // Date field requirements based on type and frequency
  if (data.type === 'subscription') {
    if (!data.lastRenewalDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last renewal date is required for subscriptions.", path: ["lastRenewalDate"] });
    }
  } else if (data.frequency === 'semi-monthly') {
    if (!data.semiMonthlyFirstPayDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First upcoming pay date is required.", path: ["semiMonthlyFirstPayDate"] });
    }
    if (!data.semiMonthlySecondPayDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Second upcoming pay date is required.", path: ["semiMonthlySecondPayDate"] });
    }
    if (data.semiMonthlyFirstPayDate && data.semiMonthlySecondPayDate && data.semiMonthlySecondPayDate <= data.semiMonthlyFirstPayDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Second pay date must be after the first.", path: ["semiMonthlySecondPayDate"] });
    }
  } else { // Not a subscription, not semi-monthly
    if (!data.startDate) {
      const message = data.type === 'income' ? "Next pay date is required." : "Next due date is required.";
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["startDate"] });
    }
  }

  // Category ID requirement
  if ((data.type === 'subscription' || data.type === 'fixed-expense') && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Category is required for subscriptions and fixed expenses.", path: ["categoryId"] });
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
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isLastRenewalDatePickerOpen, setIsLastRenewalDatePickerOpen] = useState(false);
  const [isSemiMonthlyFirstDatePickerOpen, setIsSemiMonthlyFirstDatePickerOpen] = useState(false);
  const [isSemiMonthlySecondDatePickerOpen, setIsSemiMonthlySecondDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  const form = useForm<AddRecurringItemFormValues>({
    resolver: zodResolver(refinedFormSchema),
    defaultValues: {
      name: "", type: undefined, amount: undefined, frequency: undefined,
      startDate: startOfDay(new Date()), lastRenewalDate: null,
      semiMonthlyFirstPayDate: null, semiMonthlySecondPayDate: null,
      endDate: null, notes: "", categoryId: null,
    },
  });

  const selectedType = form.watch("type");
  const selectedFrequency = form.watch("frequency");

  const resetFormFields = () => {
    form.reset({
      name: "", type: undefined, amount: undefined, frequency: undefined,
      startDate: startOfDay(new Date()), lastRenewalDate: null,
      semiMonthlyFirstPayDate: null, semiMonthlySecondPayDate: null,
      endDate: null, notes: "", categoryId: null,
    });
    setIsStartDatePickerOpen(false);
    setIsLastRenewalDatePickerOpen(false);
    setIsSemiMonthlyFirstDatePickerOpen(false);
    setIsSemiMonthlySecondDatePickerOpen(false);
    setIsEndDatePickerOpen(false);
  }

  useEffect(() => {
    if (selectedType === 'subscription') {
      form.setValue('startDate', null);
      form.setValue('semiMonthlyFirstPayDate', null);
      form.setValue('semiMonthlySecondPayDate', null);
      if (!form.getValues('lastRenewalDate')) form.setValue('lastRenewalDate', startOfDay(new Date()));
    } else if (selectedFrequency === 'semi-monthly') {
      form.setValue('startDate', null);
      form.setValue('lastRenewalDate', null);
      if (!form.getValues('semiMonthlyFirstPayDate')) form.setValue('semiMonthlyFirstPayDate', startOfDay(new Date()));
      if (!form.getValues('semiMonthlySecondPayDate')) form.setValue('semiMonthlySecondPayDate', startOfDay(new Date(new Date().setDate(new Date().getDate() + 15))));
      form.setValue('categoryId', null); 
    } else { 
      form.setValue('lastRenewalDate', null);
      form.setValue('semiMonthlyFirstPayDate', null);
      form.setValue('semiMonthlySecondPayDate', null);
      if (!form.getValues('startDate')) form.setValue('startDate', startOfDay(new Date()));
       if (selectedType === 'income') { 
         form.setValue('categoryId', null);
       }
    }

    if (selectedType === 'income') {
      form.setValue('endDate', null);
      setIsEndDatePickerOpen(false); // Ensure picker is closed
      form.setValue('categoryId', null);
    }
  }, [selectedType, selectedFrequency, form]);


  async function onSubmit(values: AddRecurringItemFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const itemData: Partial<RecurringItem> = {
        name: values.name,
        type: values.type,
        amount: values.amount,
        frequency: values.frequency,
        endDate: values.type === 'income' ? undefined : (values.endDate || undefined),
        notes: values.notes || undefined,
        categoryId: (values.type === 'subscription' || values.type === 'fixed-expense') ? values.categoryId : null,
    };

    if (values.type === 'subscription') {
        itemData.lastRenewalDate = values.lastRenewalDate ? startOfDay(values.lastRenewalDate) : null;
        itemData.startDate = null;
        itemData.semiMonthlyFirstPayDate = null;
        itemData.semiMonthlySecondPayDate = null;
    } else if (values.frequency === 'semi-monthly') {
        itemData.semiMonthlyFirstPayDate = values.semiMonthlyFirstPayDate ? startOfDay(values.semiMonthlyFirstPayDate) : null;
        itemData.semiMonthlySecondPayDate = values.semiMonthlySecondPayDate ? startOfDay(values.semiMonthlySecondPayDate) : null;
        itemData.startDate = null;
        itemData.lastRenewalDate = null;
    } else {
        itemData.startDate = values.startDate ? startOfDay(values.startDate) : null;
        itemData.lastRenewalDate = null;
        itemData.semiMonthlyFirstPayDate = null;
        itemData.semiMonthlySecondPayDate = null;
    }
    
    onRecurringItemAdded(itemData as Omit<RecurringItem, "id" | "userId" | "createdAt">);
    resetFormFields();
    setIsLoading(false);
    onOpenChange(false);
  }
  
  const getPrimaryDateLabel = () => {
    if (selectedType === 'income') return "Next Pay Date *";
    if (selectedType === 'fixed-expense') return "Next Due Date *";
    // This label is for the 'startDate' field which is hidden for subscriptions and semi-monthly.
    // So, this default won't typically be seen if logic is correct.
    return "Primary Date Field *"; 
  };

  const showPrimaryDateField = selectedType !== 'subscription' && selectedFrequency !== 'semi-monthly';
  const showCategoryField = selectedType === 'subscription' || selectedType === 'fixed-expense';
  const showEndDateField = selectedType !== 'income';

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
                  <Select onValueChange={field.onChange} value={field.value || undefined} >
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

            {showCategoryField && (
                 <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {predefinedRecurringCategories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                {category.label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

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
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
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

            {selectedType === 'subscription' && (
              <FormField
                control={form.control}
                name="lastRenewalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Last Renewal Date *</FormLabel>
                    <Popover open={isLastRenewalDatePickerOpen} onOpenChange={setIsLastRenewalDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            onClick={() => setIsLastRenewalDatePickerOpen(true)}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => { field.onChange(date); setIsLastRenewalDatePickerOpen(false); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showPrimaryDateField && (
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{getPrimaryDateLabel()}</FormLabel>
                    <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            onClick={() => setIsStartDatePickerOpen(true)}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => { field.onChange(date); setIsStartDatePickerOpen(false); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType !== 'subscription' && selectedFrequency === 'semi-monthly' && (
              <>
                <FormField
                  control={form.control}
                  name="semiMonthlyFirstPayDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>First Upcoming Pay Date *</FormLabel>
                      <Popover open={isSemiMonthlyFirstDatePickerOpen} onOpenChange={setIsSemiMonthlyFirstDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              onClick={() => setIsSemiMonthlyFirstDatePickerOpen(true)}
                            >
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick first pay date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => { field.onChange(date); setIsSemiMonthlyFirstDatePickerOpen(false); }}
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
                      <Popover open={isSemiMonthlySecondDatePickerOpen} onOpenChange={setIsSemiMonthlySecondDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              onClick={() => setIsSemiMonthlySecondDatePickerOpen(true)}
                            >
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick second pay date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => { field.onChange(date); setIsSemiMonthlySecondDatePickerOpen(false); }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {showEndDateField && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            onClick={() => setIsEndDatePickerOpen(true)}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick an end date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => { field.onChange(date); setIsEndDatePickerOpen(false); }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetFormFields();}} disabled={isLoading}>
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

    