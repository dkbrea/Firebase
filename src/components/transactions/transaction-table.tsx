"use client";

import type { Transaction, Category } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { categorizeTransaction as categorizeTransactionFlow } from "@/ai/flows/categorize-transaction";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransactionCategory: (transactionId: string, categoryId: string | null) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export function TransactionTable({
  transactions,
  categories,
  onUpdateTransactionCategory,
  onDeleteTransaction,
}: TransactionTableProps) {
  const { toast } = useToast();
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    onUpdateTransactionCategory(transactionId, categoryId === "none" ? null : categoryId);
  };

  const handleSuggestCategory = async (transaction: Transaction) => {
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
            description: `Suggested category: "${result.suggestedCategory}" (Confidence: ${(result.confidenceScore * 100).toFixed(0)}%). Category not found, please add it first.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "AI Suggestion",
          description: "Could not determine a category for this transaction.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("AI categorization error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI category suggestion.",
        variant: "destructive",
      });
    }
    setSuggestingFor(null);
  };

  const handleDelete = (transaction: Transaction) => {
    onDeleteTransaction(transaction.id);
    toast({
      title: "Transaction Deleted",
      description: `Transaction "${transaction.description}" has been deleted.`,
      variant: "destructive"
    });
  };

  if (transactions.length === 0) {
    return <p className="text-muted-foreground mt-4">No transactions to display. Connect your bank or add transactions manually.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell className={`text-right font-semibold ${transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
              ${Math.abs(transaction.amount).toFixed(2)}
            </TableCell>
            <TableCell>
              <Select
                value={transaction.categoryId || "none"}
                onValueChange={(value) => handleCategoryChange(transaction.id, value)}
              >
                <SelectTrigger className="w-[180px]">
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
            <TableCell className="space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestCategory(transaction)}
                disabled={suggestingFor === transaction.id}
                className="text-xs"
              >
                <Wand2 className="mr-1 h-3 w-3" />
                {suggestingFor === transaction.id ? "Suggesting..." : "Suggest"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                   </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the transaction for "{transaction.description}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(transaction)} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
