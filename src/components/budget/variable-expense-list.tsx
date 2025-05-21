
"use client";

import type { BudgetCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface VariableExpenseListProps {
  categories: BudgetCategory[];
  onUpdateCategoryAmount: (categoryId: string, newAmount: number) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddCategoryClick: () => void;
}

export function VariableExpenseList({ categories, onUpdateCategoryAmount, onDeleteCategory, onAddCategoryClick }: VariableExpenseListProps) {
  const { toast } = useToast();
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  // Sync editingAmounts when categories prop changes (e.g. after adding/deleting)
  useEffect(() => {
    const newEditingAmounts: Record<string, string> = {};
    categories.forEach(cat => {
      newEditingAmounts[cat.id] = cat.budgetedAmount.toString();
    });
    setEditingAmounts(newEditingAmounts);
  }, [categories]);


  const handleAmountChange = (categoryId: string, value: string) => {
    setEditingAmounts(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleAmountBlur = (categoryId: string) => {
    const stringValue = editingAmounts[categoryId];
    const originalCategory = categories.find(c => c.id === categoryId);

    if (stringValue === undefined || stringValue.trim() === "" || originalCategory === undefined) {
      // Revert to original if input is cleared or category not found
      if (originalCategory) {
        setEditingAmounts(prev => ({ ...prev, [categoryId]: originalCategory.budgetedAmount.toString() }));
      }
      return;
    }
    const numericValue = parseFloat(stringValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      if (numericValue !== originalCategory.budgetedAmount) { // Only update if changed
        onUpdateCategoryAmount(categoryId, numericValue);
        toast({ title: "Budget Updated", description: `Budget for ${originalCategory.name} updated.` });
      }
    } else {
      setEditingAmounts(prev => ({ ...prev, [categoryId]: originalCategory.budgetedAmount.toString() }));
      toast({ title: "Invalid Amount", description: "Please enter a valid non-negative number.", variant: "destructive" });
    }
  };
  
  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Variable Expense Categories</CardTitle>
            <CardDescription>Allocate your remaining income to these spending categories.</CardDescription>
        </div>
        <Button onClick={onAddCategoryClick} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No variable expense categories yet. Click "Add Category" to start.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-right w-[200px]">Budgeted Amount ($)</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingAmounts[category.id] ?? category.budgetedAmount.toString()}
                      onChange={(e) => handleAmountChange(category.id, e.target.value)}
                      onBlur={() => handleAmountBlur(category.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur();}}
                      className="w-32 ml-auto text-right"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will remove the category and its budgeted amount. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteCategory(category.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {categories.length > 0 && (
                <TableRow className="font-bold border-t-2 bg-muted/50">
                    <TableCell>Total Budgeted Variable Expenses</TableCell>
                    <TableCell className="text-right text-lg">${totalBudgeted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            )}
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
