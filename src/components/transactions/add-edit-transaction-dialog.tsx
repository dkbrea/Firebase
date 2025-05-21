
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
import { Textarea } from "@/components/ui/textarea";
import type { Transaction, Category, Account, TransactionType } from "@/types";
import { useState, useEffect, type ReactNode, useCallback } from "react";
import { Loader2, CalendarIcon, Wand2, TrendingDown, TrendingUp } from "lucide-react";
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
  tags: z.string().optional(), // Input as comma-separated string
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
      tags: "",
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
        tags: transactionToEdit.tags?.join(", ") || "",
      });
    } else if (!isOpen) {
      form.reset({
        date: startOfDay(new Date()), description: "", type: "expense", amount: undefined,
        categoryId: null, accountId: undefined, notes: "", tags: "",
      });
    }
  }, [transactionToEdit, isOpen, form]);

  const handleDescriptionChangeForAISuggestion = useCallback(async (description: string) => {
    if (description.length > 5 && !form.getValues('categoryId') && !transactionToEdit) { 
      setIsAISuggesting(true);
      try {
        const result = await categorizeTransactionFlow({ transactionDescription: description });
        if (result && result.suggestedCategory) {
          const matchedCategory = categories.find(c => c.name.toLowerCase() === result.suggestedCategory.toLowerCase());
          if (matchedCategory && result.confidenceScore > 0.6) { 
            form.setValue('categoryId', matchedCategory.id, { shouldValidate: true });
            toast({
              title: "AI Category Suggested",
              description: `Category set to "${matchedCategory.name}".`,
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error("AI suggestion error:", error);
      }
      setIsAISuggesting(false);
    }
  }, [form, categories, transactionToEdit, toast]);


  async function onSubmit(values: TransactionFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionData = {
      date: startOfDay(values.date),
      description: values.description,
      type: values.type,
      amount: values.type === 'income' ? values.amount : -values.amount, 
      categoryId: values.categoryId === "_UNCATEGORIZED_" ? null : values.categoryId,
      accountId: values.accountId,
      notes: values.notes || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };
    
    onSave(transactionData, transactionToEdit?.id);
    setIsLoading(false);
    onOpenChange(false); 
  }

  const selectedType = form.watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) onOpenChange(open); 
    }}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? "Edit Transaction" : "Record Transaction"}</DialogTitle>
          <DialogDescription>
            {transactionToEdit ? "Update the details of your transaction." : "Enter the details for your new transaction."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-2">
            
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant={selectedType === 'expense' ? 'secondary' : 'outline'}
                    onClick={() => form.setValue('type', 'expense', { shouldValidate: true })}
                    className="w-full"
                >
                    <TrendingDown className="mr-2 h-4 w-4" /> Expense
                </Button>
                <Button
                    type="button"
                    variant={selectedType === 'income' ? 'secondary' : 'outline'}
                    onClick={() => form.setValue('type', 'income', { shouldValidate: true })}
                    className="w-full"
                >
                     <TrendingUp className="mr-2 h-4 w-4" /> Income
                </Button>
            </div>
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="$0.00" {...field} />
                  </FormControl>
                  <FormDescription>Enter a positive value. Type above determines flow.</FormDescription>
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Budget Category
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
                  <Select 
                    onValueChange={(value) => field.onChange(value === "_UNCATEGORIZED_" ? null : value)} 
                    value={field.value === null || field.value === undefined ? "_UNCATEGORIZED_" : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_UNCATEGORIZED_">Uncategorized</SelectItem>
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
                  <FormLabel>From Account *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.filter(acc => acc.type !== 'credit card' || acc.balance >= 0).map(account => (
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
                          onClick={() => setIsDatePickerOpen(true)}
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., work, travel, project-x" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated tags for easy filtering.</FormDescription>
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
