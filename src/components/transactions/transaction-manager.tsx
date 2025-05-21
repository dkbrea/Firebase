
"use client";

import type { Transaction, Category, Account } from "@/types";
import { useState, useEffect } from "react";
import { TransactionTable } from "./transaction-table";
import { AddEditTransactionDialog } from "./add-edit-transaction-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real app this would come from a data store / API
const mockCategories: Category[] = [
  { id: "cat1", name: "Groceries", userId: "1", createdAt: new Date() },
  { id: "cat2", name: "Dining Out", userId: "1", createdAt: new Date() },
  { id: "cat3", name: "Utilities", userId: "1", createdAt: new Date() },
  { id: "cat4", name: "Transport", userId: "1", createdAt: new Date() },
  { id: "cat5", name: "Entertainment", userId: "1", createdAt: new Date() },
  { id: "cat6", name: "Shopping", userId: "1", createdAt: new Date() },
  { id: "cat7", name: "Health", userId: "1", createdAt: new Date() },
  { id: "cat8", name: "Salary", userId: "1", createdAt: new Date() },
  { id: "cat9", name: "Freelance", userId: "1", createdAt: new Date() },
  { id: "cat10", name: "Bills", userId: "1", createdAt: new Date() },
];

const mockAssetAccounts: Account[] = [
  { id: "acc1", name: "Main Checking", type: "checking", bankName: "Capital One", last4: "1234", balance: 5231.89, isPrimary: true, userId: "1", createdAt: new Date() },
  { id: "acc2", name: "Emergency Fund", type: "savings", bankName: "Ally Bank", last4: "5678", balance: 10500.00, isPrimary: false, userId: "1", createdAt: new Date() },
];

const initialMockTransactions: Transaction[] = [
    { id: "tx1", date: new Date(2024, 6, 15), description: "Trader Joe's Haul", amount: -75.20, type: "expense", categoryId: "cat1", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["food", "weekly shop"]},
    { id: "tx2", date: new Date(2024, 6, 14), description: "Dinner at The Italian Place", amount: -45.50, type: "expense", categoryId: "cat2", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["restaurant"]},
    { id: "tx3", date: new Date(2024, 6, 12), description: "Monthly Rent", amount: -1200.00, type: "expense", categoryId: "cat10", accountId: "acc1", userId: "1", source: "Manual Entry", tags: []},
    { id: "tx4", date: new Date(2024, 6, 10), description: "Spotify Subscription", amount: -10.99, type: "expense", categoryId: "cat5", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["music", "subscription"]},
    { id: "tx5", date: new Date(2024, 6, 5), description: "Paycheck", amount: 2200.00, type: "income", categoryId: "cat8", accountId: "acc1", userId: "1", source: "Manual Entry", tags: []},
];


export function TransactionManager() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [accounts, setAccounts] = useState<Account[]>(mockAssetAccounts);
  
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  useEffect(() => {
    // Categories and accounts are set from mock data above
  }, []);

  const handleOpenAddDialog = () => {
    setTransactionToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleOpenEditDialog = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsAddEditDialogOpen(true);
  };

  const handleSaveTransaction = (
    data: Omit<Transaction, "id" | "userId" | "source" | "createdAt" | "updatedAt" | "tags"> & { tags?: string[] }, 
    id?: string
  ) => {
    const processedData = {
      ...data,
      amount: data.type === 'income' ? Math.abs(data.amount) : -Math.abs(data.amount),
      tags: data.tags || [], // Ensure tags is an array
    };

    if (id) { 
      setTransactions(prev => prev.map(t => t.id === id ? { 
        ...t, 
        ...processedData, 
        updatedAt: new Date() 
      } : t));
      toast({ title: "Transaction Updated", description: `"${data.description}" has been updated.` });
    } else { 
      const newTransaction: Transaction = {
        ...processedData,
        id: `txn-${Date.now()}`,
        userId: "1", 
        source: "Manual Entry",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Transaction Added", description: `"${newTransaction.description}" has been added.` });
    }
    setIsAddEditDialogOpen(false);
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    setTransactions((prevTransactions) => prevTransactions.filter(t => t.id !== transactionId));
    if (transactionToDelete) {
        toast({
            title: "Transaction Deleted",
            description: `Transaction "${transactionToDelete.description}" has been removed.`,
            variant: "destructive"
        });
    }
  };
  
  const handleUpdateTransactionCategory = (transactionId: string, categoryId: string | null) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((t) =>
        t.id === transactionId ? { ...t, categoryId, updatedAt: new Date() } : t
      )
    );
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0); 
  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on current transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Based on current transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netFlow.toFixed(2)}
            </div>
             <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Manually add, view, categorize, and manage your transactions.</CardDescription>
          </div>
          <AddEditTransactionDialog
            isOpen={isAddEditDialogOpen}
            onOpenChange={setIsAddEditDialogOpen}
            onSave={handleSaveTransaction}
            categories={categories}
            accounts={accounts}
            transactionToEdit={transactionToEdit}
          >
            <Button onClick={handleOpenAddDialog} variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </AddEditTransactionDialog>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            categories={categories}
            accounts={accounts}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditDialog}
          />
        </CardContent>
      </Card>
    </div>
  );
}
