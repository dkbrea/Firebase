
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Transaction, Category, Account, TransactionType } from "@/types";
import { useState, useEffect, type ReactNode, useCallback } from "react";
import { Loader2, CalendarIcon, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { categorizeTransaction as categorizeTransactionFlow } from "@/ai/flows/categorize-transaction";

const formSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(1, "Description is required.").max(100, "Description must be 100 characters or less."),
  type: z.enum(["income", "expense"], { required_error: "Transaction type is required." }),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ required_error: "Amount is required.", invalid_type_error: "Amount must be a number." })
     .positive({ message: "Amount must be a positive number." })
  ),
  categoryId: z.string().nullable().optional(),
  accountId: z.string({ required_error: "Account is required." }),
  notes: z.string().max(200, "Notes must be 200 characters or less.").optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface AddEditTransactionDialogProps {
  children: ReactNode; // Trigger button for adding
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Transaction, "id" | "userId" | "source" | "createdAt" | "updatedAt">, id?: string) => void;
  categories: Category[];
  accounts: Account[]; // Asset accounts
  transactionToEdit?: Transaction | null;
}

export function AddEditTransactionDialog({
  children, isOpen, onOpenChange, onSave, categories, accounts, transactionToEdit
}: AddEditTransactionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: startOfDay(new Date()),
      description: "",
      type: "expense",
      amount: undefined,
      categoryId: null,
      accountId: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (transactionToEdit && isOpen) {
      form.reset({
        date: startOfDay(new Date(transactionToEdit.date)),
        description: transactionToEdit.description,
        type: transactionToEdit.type,
        amount: Math.abs(transactionToEdit.amount), // Form always deals with positive amount
        categoryId: transactionToEdit.categoryId || null,
        accountId: transactionToEdit.accountId,
        notes: transactionToEdit.notes || "",
      });
    } else if (!isOpen) {
      form.reset({
        date: startOfDay(new Date()), description: "", type: "expense", amount: undefined,
        categoryId: null, accountId: undefined, notes: "",
      });
    }
  }, [transactionToEdit, isOpen, form]);

  const handleDescriptionChangeForAISuggestion = useCallback(async (description: string) => {
    if (description.length > 5 && !form.getValues('categoryId') && !transactionToEdit) { // Only suggest if no category and not editing
      setIsAISuggesting(true);
      try {
        const result = await categorizeTransactionFlow({ transactionDescription: description });
        if (result && result.suggestedCategory) {
          const matchedCategory = categories.find(c => c.name.toLowerCase() === result.suggestedCategory.toLowerCase());
          if (matchedCategory && result.confidenceScore > 0.6) { // Confidence threshold
            form.setValue('categoryId', matchedCategory.id, { shouldValidate: true });
            toast({
              title: "AI Category Suggested",
              description: `Category set to "${matchedCategory.name}".`,
              duration: 3000,
            });
          }
        }
      } catch (error) {
        // Silently fail or log, don't bother user for background suggestion
        console.error("AI suggestion error:", error);
      }
      setIsAISuggesting(false);
    }
  }, [form, categories, transactionToEdit, toast]);


  async function onSubmit(values: TransactionFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionData = {
      ...values,
      amount: values.type === 'income' ? values.amount : -values.amount, // Apply sign based on type
      date: startOfDay(values.date), // Ensure date is at start of day
    };
    
    onSave(transactionData, transactionToEdit?.id);
    setIsLoading(false);
    onOpenChange(false); // Close dialog on success
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) onOpenChange(open); // Prevent closing while loading
    }}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          <DialogDescription>
            {transactionToEdit ? "Update the details of your transaction." : "Enter the details for your new transaction."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setIsDatePickerOpen(false); }}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Groceries, Salary" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleDescriptionChangeForAISuggestion(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Expense</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Income</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Enter a positive value. "Type" determines if it's income or expense.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Category
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDescriptionChangeForAISuggestion(form.getValues('description'))} 
                      disabled={isAISuggesting || !form.getValues('description')}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                      {isAISuggesting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                      Suggest
                    </Button>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.filter(acc => acc.type !== 'credit card' || acc.balance >= 0).map(account => ( // Filter out debt-like credit cards
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.type})
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any extra details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isAISuggesting}>
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                {transactionToEdit ? "Save Changes" : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
