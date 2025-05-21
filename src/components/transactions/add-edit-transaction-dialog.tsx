
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
import type { Transaction, Category, Account, TransactionDetailedType, RecurringItem, DebtAccount, FinancialGoalWithContribution } from "@/types";
import { transactionDetailedTypes } from "@/types";
import { useState, useEffect, type ReactNode } from "react";
import { Loader2, CalendarIcon, ShoppingBag, Repeat, Landmark, Flag, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  detailedType: z.enum(transactionDetailedTypes, { required_error: "Transaction type is required." }),
  
  description: z.string().optional(), 
  sourceId: z.string().optional(), // For linking to RecurringItem, DebtAccount, or FinancialGoal
  
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ required_error: "Amount is required.", invalid_type_error: "Amount must be a number." })
     .positive({ message: "Amount must be a positive number." })
  ),
  categoryId: z.string().nullable().optional(), // Only for 'variable-expense'
  accountId: z.string({ required_error: "Account is required." }), // Source account for expenses/transfers, destination for income
  toAccountId: z.string().nullable().optional(), // Destination account for transfers like goal contributions
  notes: z.string().max(200, "Notes must be 200 characters or less.").optional(),
  tags: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.detailedType !== 'variable-expense' && !data.sourceId) {
        ctx.addIssue({
            path: ["sourceId"],
            message: "Please select an item or source for this transaction type.",
        });
    }
    if (data.detailedType === 'variable-expense' && (!data.description || data.description.trim() === '')) {
        ctx.addIssue({
            path: ["description"],
            message: "Description is required for variable expenses.",
        });
    }
     if (data.detailedType === 'variable-expense' && !data.categoryId) {
        ctx.addIssue({
            path: ["categoryId"],
            message: "Budget category is required for variable expenses.",
        });
    }
    if (data.detailedType === 'goal-contribution') {
      if (!data.toAccountId) {
        ctx.addIssue({
            path: ["toAccountId"],
            message: "Destination account is required for goal contributions.",
        });
      }
      if (data.accountId && data.toAccountId && data.accountId === data.toAccountId) {
        ctx.addIssue({
            path: ["toAccountId"],
            message: "From and To accounts cannot be the same for a goal contribution.",
        });
      }
    }
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface AddEditTransactionDialogProps {
  children?: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Transaction, "id" | "userId" | "source" | "createdAt" | "updatedAt">, id?: string) => void;
  categories: Category[]; 
  accounts: Account[]; 
  recurringItems: RecurringItem[];
  debtAccounts: DebtAccount[];
  goals: FinancialGoalWithContribution[];
  transactionToEdit?: Transaction | null;
}

const detailedTypeButtonConfig: { type: TransactionDetailedType; label: string; icon: React.ElementType }[] = [
  { type: 'income', label: 'Income', icon: TrendingUp },
  { type: 'fixed-expense', label: 'Fixed Expense', icon: FileText },
  { type: 'subscription', label: 'Subscription', icon: Repeat },
  { type: 'variable-expense', label: 'Variable Expense', icon: ShoppingBag },
  { type: 'debt-payment', label: 'Debt Payment', icon: Landmark }, 
  { type: 'goal-contribution', label: 'Goal Contribution', icon: Flag },
];

export function AddEditTransactionDialog({
  children, isOpen, onOpenChange, onSave,
  categories, accounts, recurringItems, debtAccounts, goals, transactionToEdit
}: AddEditTransactionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: startOfDay(new Date()),
      detailedType: 'variable-expense', // Default to variable expense
      description: "",
      sourceId: undefined,
      amount: undefined,
      categoryId: null,
      accountId: undefined,
      toAccountId: null,
      notes: "",
      tags: "",
    },
  });

  const selectedDetailedType = form.watch("detailedType");

  useEffect(() => {
    if (transactionToEdit && isOpen) {
      form.reset({
        date: startOfDay(new Date(transactionToEdit.date)),
        detailedType: transactionToEdit.detailedType || 'variable-expense',
        description: transactionToEdit.description || "",
        sourceId: transactionToEdit.sourceId || undefined,
        amount: Math.abs(transactionToEdit.amount), // User always edits positive amount
        categoryId: transactionToEdit.categoryId || null,
        accountId: transactionToEdit.accountId,
        toAccountId: transactionToEdit.toAccountId || null,
        notes: transactionToEdit.notes || "",
        tags: transactionToEdit.tags?.join(", ") || "",
      });
    } else if (!isOpen && !transactionToEdit) { 
      form.reset({
        date: startOfDay(new Date()), detailedType: 'variable-expense', description: "", sourceId: undefined,
        amount: undefined, categoryId: null, accountId: undefined, toAccountId: null, notes: "", tags: "",
      });
    }
  }, [transactionToEdit, isOpen, form]);

  const handleItemSelection = (itemId: string) => {
    form.setValue('sourceId', itemId, {shouldValidate: true});
    let selectedItemName = "";
    let selectedItemAmount: number | undefined;

    if (selectedDetailedType === 'income') {
        const item = recurringItems.find(ri => ri.id === itemId && ri.type === 'income');
        if (item) { selectedItemName = item.name; selectedItemAmount = item.amount; }
    } else if (selectedDetailedType === 'fixed-expense') {
        const item = recurringItems.find(ri => ri.id === itemId && ri.type === 'fixed-expense');
        if (item) { selectedItemName = item.name; selectedItemAmount = item.amount; }
    } else if (selectedDetailedType === 'subscription') {
        const item = recurringItems.find(ri => ri.id === itemId && ri.type === 'subscription');
        if (item) { selectedItemName = item.name; selectedItemAmount = item.amount; }
    } else if (selectedDetailedType === 'debt-payment') {
        const item = debtAccounts.find(da => da.id === itemId);
        if (item) { selectedItemName = item.name; selectedItemAmount = item.minimumPayment; }
    } else if (selectedDetailedType === 'goal-contribution') {
        const item = goals.find(g => g.id === itemId);
        if (item) { selectedItemName = item.name; selectedItemAmount = item.monthlyContribution; }
    }
    
    if (selectedItemName) form.setValue('description', selectedItemName, {shouldValidate: true});
    if (selectedItemAmount !== undefined && selectedItemAmount > 0) {
      form.setValue('amount', parseFloat(selectedItemAmount.toFixed(2)), {shouldValidate: true});
    } else {
      form.setValue('amount', undefined, { shouldValidate: true }); 
    }
  };
  
  useEffect(() => { 
    form.setValue('sourceId', undefined);
    form.setValue('description', '');
    if (selectedDetailedType !== 'goal-contribution') {
      form.setValue('toAccountId', null); 
    }
    if(selectedDetailedType !== 'variable-expense') {
        form.setValue('categoryId', null);
    }
  }, [selectedDetailedType, form]);


  async function onSubmit(values: TransactionFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let baseTransactionType: Transaction['type'] = 'expense';
    if (values.detailedType === 'income') {
        baseTransactionType = 'income';
    } else if (values.detailedType === 'goal-contribution') {
        baseTransactionType = 'transfer'; // Goal contributions are transfers
    }

    const transactionData = {
      date: startOfDay(values.date),
      description: values.description || "N/A", 
      amount: values.amount, 
      type: baseTransactionType, 
      detailedType: values.detailedType,
      sourceId: values.sourceId || undefined,
      categoryId: values.detailedType === 'variable-expense' ? (values.categoryId === "_UNCATEGORIZED_" ? null : values.categoryId) : null,
      accountId: values.accountId, // This is "From Account"
      toAccountId: values.detailedType === 'goal-contribution' ? values.toAccountId : null,
      notes: values.notes || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };
    
    onSave(transactionData, transactionToEdit?.id);
    setIsLoading(false);
    onOpenChange(false); 
  }
  
  const getSourceSelectItems = () => {
    switch(selectedDetailedType) {
        case 'income':
            return recurringItems.filter(item => item.type === 'income').map(item => ({value: item.id, label: item.name}));
        case 'fixed-expense':
            return recurringItems.filter(item => item.type === 'fixed-expense').map(item => ({value: item.id, label: item.name}));
        case 'subscription':
            return recurringItems.filter(item => item.type === 'subscription').map(item => ({value: item.id, label: item.name}));
        case 'debt-payment':
            return debtAccounts.map(item => ({value: item.id, label: item.name}));
        case 'goal-contribution':
            return goals.filter(g => g.currentAmount < g.targetAmount).map(item => ({value: item.id, label: item.name})); 
        default:
            return [];
    }
  };

  const getSourceSelectLabel = () => {
     switch(selectedDetailedType) {
        case 'income': return "Select Income Source";
        case 'fixed-expense': return "Select Fixed Expense";
        case 'subscription': return "Select Subscription";
        case 'debt-payment': return "Select Debt Account";
        case 'goal-contribution': return "Financial Goal"; 
        default: return "Select Item";
    }
  }

  const availableAssetAccounts = accounts.filter(acc => acc.type !== 'credit card' || acc.balance >=0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading && !open) {
        form.reset({ 
            date: startOfDay(new Date()), detailedType: 'variable-expense', description: "", sourceId: undefined,
            amount: undefined, categoryId: null, accountId: undefined, toAccountId: null, notes: "", tags: "",
        });
      }
      if (!isLoading) onOpenChange(open); 
    }}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? "Edit Transaction" : "Record Transaction"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2 max-h-[80vh] overflow-y-auto pr-2">
            
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
                          {field.value ? format(field.value, "MM/dd/yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { if(date) field.onChange(startOfDay(date)); setIsDatePickerOpen(false); }}
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
              name="detailedType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Transaction Type *</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detailedTypeButtonConfig.map(config => (
                        <Button
                            key={config.type}
                            type="button"
                            variant={field.value === config.type ? 'secondary' : 'outline'}
                            onClick={() => {
                              field.onChange(config.type);
                              form.setValue('sourceId', undefined, {shouldValidate: true}); 
                              form.setValue('description', '', {shouldValidate: true});
                              form.setValue('amount', undefined, {shouldValidate: true});
                              form.setValue('categoryId', null, {shouldValidate: true});
                              if (config.type !== 'goal-contribution') {
                                form.setValue('toAccountId', null, {shouldValidate: true});
                              }
                            }}
                            className={cn("w-full justify-start text-left h-auto py-2 px-3", 
                                         field.value === config.type && "ring-2 ring-primary shadow-md"
                            )}
                        >
                            <config.icon className={cn("mr-2 h-4 w-4", field.value === config.type ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs sm:text-sm">{config.label}</span>
                        </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional field for selecting the specific item (goal, recurring income/expense, debt) */}
            {selectedDetailedType !== 'variable-expense' && (
                 <FormField
                    control={form.control}
                    name="sourceId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{getSourceSelectLabel()} *</FormLabel>
                        <Select onValueChange={(value) => handleItemSelection(value)} value={field.value || ""} >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={getSourceSelectLabel()} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {getSourceSelectItems().map(item => (
                                <SelectItem key={item.value} value={item.value}>
                                {item.label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
             {/* Description field (primarily for variable expenses, or if no item selected for others) */}
            {(selectedDetailedType === 'variable-expense' || (selectedDetailedType !== 'variable-expense' && !form.watch('sourceId'))) && (
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description {selectedDetailedType === 'variable-expense' ? '*' : '(Optional)'}</FormLabel>
                        <FormControl><Input placeholder="e.g., Coffee, Lunch with client" {...field} /></FormControl>
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
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-muted-foreground sm:text-sm">$</span>
                        </div>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} 
                               onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                               value={field.value === undefined ? '' : field.value}
                               className="pl-7" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* From Account - Always present */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableAssetAccounts.map(account => (
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
            
            {/* To Account - Only for Goal Contribution */}
            {selectedDetailedType === 'goal-contribution' && (
                <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>To Account *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {availableAssetAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.type})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>Select the account where this goal contribution will be stored.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            
            {/* Budget Category - Only for Variable Expense */}
            {selectedDetailedType === 'variable-expense' && (
                <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Budget Category *</FormLabel>
                    <Select 
                        onValueChange={(value) => field.onChange(value === "_UNCATEGORIZED_" ? null : value)} 
                        value={field.value === null || field.value === undefined ? "_UNCATEGORIZED_" : field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
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
            )}
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., vacation, business, family (comma separated)" {...field} />
                  </FormControl>
                  {/* <FormDescription>Comma-separated tags for easy filtering.</FormDescription> */}
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
                    <Textarea placeholder="Add any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                onOpenChange(false);
                if (!transactionToEdit) { 
                     form.reset({
                        date: startOfDay(new Date()), detailedType: 'variable-expense', description: "", sourceId: undefined,
                        amount: undefined, categoryId: null, accountId: undefined, toAccountId: null, notes: "", tags: "",
                     });
                }
              }} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                {transactionToEdit ? "Save Changes" : "Save Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

