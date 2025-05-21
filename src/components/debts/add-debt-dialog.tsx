
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
import type { DebtAccount, DebtAccountType } from "@/types";
import { debtAccountTypes } from "@/types"; // Import the array of types
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Debt name must be at least 2 characters." }).max(50),
  type: z.enum(debtAccountTypes, { required_error: "Please select a debt type." }),
  balance: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "Balance must be a number." }).positive({ message: "Balance must be positive." })
  ),
  apr: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "APR must be a number." }).min(0, { message: "APR cannot be negative." }).max(100, {message: "APR seems too high (max 100%)."})
  ),
  minimumPayment: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val),
    z.number({ invalid_type_error: "Minimum payment must be a number." }).positive({ message: "Minimum payment must be positive." })
  ),
});

type AddDebtFormValues = z.infer<typeof formSchema>;

interface AddDebtDialogProps {
  children: ReactNode; // Trigger button
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDebtAdded: (debtData: Omit<DebtAccount, "id" | "userId" | "createdAt">) => void;
  // existingDebt?: DebtAccount; // For editing, implement later
}

export function AddDebtDialog({ children, isOpen, onOpenChange, onDebtAdded }: AddDebtDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddDebtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: undefined,
      balance: undefined,
      apr: undefined,
      minimumPayment: undefined,
    },
  });

  async function onSubmit(values: AddDebtFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    onDebtAdded(values);
    form.reset();
    setIsLoading(false);
    onOpenChange(false); // Close dialog on success
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset();
      onOpenChange(open);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Debt Account</DialogTitle>
          <DialogDescription>
            Enter the details for your debt account (e.g., credit card, loan).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Account Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chase Sapphire, Federal Student Loan" {...field} />
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
                  <FormLabel>Debt Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a debt type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debtAccountTypes.map(type => (
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
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (APR %) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="19.9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Monthly Payment ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="50.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Add Debt Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
