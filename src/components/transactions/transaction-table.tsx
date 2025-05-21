
"use client";

import type { Transaction, Category, Account } from "@/types";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Trash2, Edit3, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { categorizeTransaction as categorizeTransactionFlow } from "@/ai/flows/categorize-transaction";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdateTransactionCategory: (transactionId: string, categoryId: string | null) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions, categories, accounts,
  onUpdateTransactionCategory, onDeleteTransaction, onEditTransaction,
}: TransactionTableProps) {
  const { toast } = useToast();
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    onUpdateTransactionCategory(transactionId, categoryId === "none" ? null : categoryId);
  };

  const handleSuggestCategory = async (transaction: Transaction) => {
    if (!transaction.description) {
        toast({ title: "AI Suggestion", description: "Please enter a description first.", variant: "default" });
        return;
    }
    setSuggestingFor(transaction.id);
    try {
      const result = await categorizeTransactionFlow({ transactionDescription: transaction.description });
      if (result && result.suggestedCategory) {
        const matchedCategory = categories.find(c => c.name.toLowerCase() === result.suggestedCategory.toLowerCase());
        if (matchedCategory) {
          onUpdateTransactionCategory(transaction.id, matchedCategory.id);
          toast({
            title: "AI Suggestion Applied",
            description: `Transaction "${transaction.description}" categorized as "${matchedCategory.name}" (Confidence: ${(result.confidenceScore * 100).toFixed(0)}%).`,
          });
        } else {
          toast({
            title: "AI Suggestion",
            description: `Suggested: "${result.suggestedCategory}" (Confidence: ${(result.confidenceScore * 100).toFixed(0)}%). Category not found.`,
            variant: "default",
          });
        }
      } else {
        toast({ title: "AI Suggestion", description: "Could not determine a category.", variant: "default" });
      }
    } catch (error) {
      console.error("AI categorization error:", error);
      toast({ title: "Error", description: "Failed to get AI category suggestion.", variant: "destructive" });
    }
    setSuggestingFor(null);
  };
  
  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || "N/A";
  }

  if (transactions.length === 0) {
    return <p className="text-muted-foreground mt-4 text-center py-6">No transactions yet. Click "Add Transaction" to get started.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.date), "MMM dd, yy")}</TableCell>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{getAccountName(transaction.accountId)}</TableCell>
            <TableCell>
              <Select
                value={transaction.categoryId || "none"}
                onValueChange={(value) => handleCategoryChange(transaction.id, value)}
              >
                <SelectTrigger className="w-full min-w-[150px] text-xs h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className={cn("text-right font-semibold", transaction.type === 'income' ? 'text-green-600' : 'text-foreground')}>
              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEditTransaction(transaction)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSuggestCategory(transaction)} disabled={suggestingFor === transaction.id}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {suggestingFor === transaction.id ? "Suggesting..." : "AI Suggest Category"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the transaction: "{transaction.description}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteTransaction(transaction.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete Transaction
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
