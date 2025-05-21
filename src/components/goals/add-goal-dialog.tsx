
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FinancialGoal, GoalIconKey } from "@/types";
import { goalIconKeys } from "@/types";
import Icons from "@/components/icons";
import { useState, type ReactNode } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfDay, isBefore } from "date-fns";

const goalIconDisplay: { key: GoalIconKey, label: string, IconComponent: React.ElementType }[] = [
    { key: 'default', label: 'Default', IconComponent: Icons.GoalDefault },
    { key: 'home', label: 'House', IconComponent: Icons.Home },
    { key: 'car', label: 'Car', IconComponent: Icons.Car },
    { key: 'plane', label: 'Travel/Vacation', IconComponent: Icons.Plane },
    { key: 'briefcase', label: 'Business/Career', IconComponent: Icons.Briefcase },
    { key: 'graduation-cap', label: 'Education', IconComponent: Icons.GraduationCap },
    { key: 'gift', label: 'Gift/Large Purchase', IconComponent: Icons.Gift },
    { key: 'piggy-bank', label: 'Savings', IconComponent: Icons.PiggyBank },
    { key: 'trending-up', label: 'Investment', IconComponent: Icons.TrendingUp },
    { key: 'shield-check', label: 'Emergency Fund', IconComponent: Icons.ShieldCheck },
];


const formSchema = z.object({
  name: z.string().min(2, { message: "Goal name must be at least 2 characters." }).max(50),
  targetAmount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ required_error: "Target amount is required.", invalid_type_error: "Amount must be a number." }).positive({ message: "Target amount must be positive." })
  ),
  currentAmount: z.preprocess(
    (val) => {
        if (typeof val === 'string' && val.trim() === '') return 0; // Default to 0 if empty string
        return typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val;
    },
    z.number({ invalid_type_error: "Amount must be a number." }).min(0, { message: "Current amount cannot be negative." }).default(0)
  ),
  targetDate: z.date({ required_error: "Target date is required." }).refine(
    (date) => {
        const today = startOfDay(new Date());
        const oneMonthFromToday = addMonths(today, 1);
        return !isBefore(startOfDay(date), oneMonthFromToday);
    },
    { message: "Target date must be at least one month in the future." }
  ),
  icon: z.enum(goalIconKeys).default('default'),
}).refine(data => data.currentAmount <= data.targetAmount, {
  message: "Current amount cannot exceed target amount.",
  path: ["currentAmount"],
});

type AddGoalFormValues = z.infer<typeof formSchema>;

interface AddGoalDialogProps {
  children: ReactNode; // Trigger button
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalAdded: (goalData: Omit<FinancialGoal, "id" | "userId" | "createdAt">) => void;
  // existingGoal?: FinancialGoal; // For editing later
}

export function AddGoalDialog({ children, isOpen, onOpenChange, onGoalAdded }: AddGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<AddGoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: undefined,
      currentAmount: 0,
      targetDate: undefined,
      icon: 'default',
    },
  });

  async function onSubmit(values: AddGoalFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    onGoalAdded({
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        targetDate: startOfDay(values.targetDate), // Ensure time is stripped
        icon: values.icon,
    });
    form.reset();
    setIsLoading(false);
    onOpenChange(false); // Close dialog on success
  }
  
  const resetFormFields = () => {
    form.reset({
      name: "",
      targetAmount: undefined,
      currentAmount: 0,
      targetDate: undefined,
      icon: 'default',
    });
    setIsDatePickerOpen(false);
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetFormFields();
      onOpenChange(open);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Financial Goal</DialogTitle>
          <DialogDescription>
            Define your financial target, how much you've saved, and by when you want to achieve it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dream Vacation, New Laptop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Amount Saved ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Date *</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          onClick={() => setIsDatePickerOpen(true)}
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
                        onSelect={(date) => { field.onChange(date); setIsDatePickerOpen(false); }}
                        disabled={(date) => isBefore(date, startOfDay(addMonths(new Date(), 1)))} // Disable past dates and current month
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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Icon (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goalIconDisplay.map(iconItem => (
                        <SelectItem key={iconItem.key} value={iconItem.key}>
                          <div className="flex items-center gap-2">
                            <iconItem.IconComponent className="h-4 w-4" />
                            {iconItem.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetFormFields(); }} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Add Goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
