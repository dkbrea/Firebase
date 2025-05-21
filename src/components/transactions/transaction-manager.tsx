
"use client";

import type { Transaction, Category, Account, RecurringItem, DebtAccount, FinancialGoalWithContribution, TransactionDetailedType } from "@/types";
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
  { id: "acc3", name: "Discover Savings", type: "savings", bankName: "Discover", last4: "9012", balance: 2000.00, isPrimary: false, userId: "1", createdAt: new Date() },
];

const initialMockTransactions: Transaction[] = [
    { id: "tx1", date: new Date(2024, 6, 15), description: "Trader Joe's Haul", amount: -75.20, type: "expense", detailedType: "variable-expense", categoryId: "cat1", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["food", "weekly shop"]},
    { id: "tx2", date: new Date(2024, 6, 14), description: "Dinner at The Italian Place", amount: -45.50, type: "expense", detailedType: "variable-expense", categoryId: "cat2", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["restaurant"]},
    { id: "tx3", date: new Date(2024, 6, 12), description: "Monthly Rent", amount: -1200.00, type: "expense", detailedType: "fixed-expense", sourceId: "rec3", accountId: "acc1", userId: "1", source: "Manual Entry", tags: []},
    { id: "tx4", date: new Date(2024, 6, 10), description: "Spotify Subscription", amount: -10.99, type: "expense", detailedType: "subscription", sourceId: "rec2", accountId: "acc1", userId: "1", source: "Manual Entry", tags: ["music", "subscription"]},
    { id: "tx5", date: new Date(2024, 6, 5), description: "Paycheck", amount: 2200.00, type: "income", detailedType: "income", sourceId: "rec1", accountId: "acc1", userId: "1", source: "Manual Entry", tags: []},
];

// Mock data for dialog dropdowns
const mockRecurringItems: RecurringItem[] = [
  { id: "rec1", name: "Main Salary", type: "income", amount: 2200, frequency: "monthly", startDate: new Date(2024, 0, 5), userId: "1", createdAt: new Date() },
  { id: "rec2", name: "Spotify Subscription", type: "subscription", amount: 10.99, frequency: "monthly", lastRenewalDate: new Date(2024, 6, 10), categoryId: "subscriptions-media", userId: "1", createdAt: new Date() },
  { id: "rec3", name: "Monthly Rent", type: "fixed-expense", amount: 1200, frequency: "monthly", startDate: new Date(2024, 0, 12), categoryId: "housing", userId: "1", createdAt: new Date() },
];

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date() },
];

const mockGoals: FinancialGoalWithContribution[] = [
  { id: "goal1", name: "New Car Down Payment", targetAmount: 5000, currentAmount: 1200, targetDate: new Date(2025, 11, 31), icon: "car", userId: "1", createdAt: new Date(), monthlyContribution: 150, monthsRemaining: 20 },
  { id: "goal2", name: "Emergency Fund Contribution", targetAmount: 10000, currentAmount: 8500, targetDate: new Date(2025, 11, 31), icon: "shield-check", userId: "1", createdAt: new Date(), monthlyContribution: 75, monthsRemaining: 20 },
];


export function TransactionManager() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
  const [categoriesList, setCategoriesList] = useState<Category[]>(mockCategories); // Renamed
  const [accountsList, setAccountsList] = useState<Account[]>(mockAssetAccounts); // Renamed
  
  const [recurringItemsList, setRecurringItemsList] = useState<RecurringItem[]>(mockRecurringItems); // Renamed
  const [debtAccountsList, setDebtAccountsList] = useState<DebtAccount[]>(mockDebtAccounts); // Renamed
  const [goalsList, setGoalsList] = useState<FinancialGoalWithContribution[]>(mockGoals); // Renamed

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  useEffect(() => {
    // Data is set from mock data above
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
    data: Omit<Transaction, "id" | "userId" | "source" | "createdAt" | "updatedAt">, 
    id?: string
  ) => {
    
    let finalType: Transaction['type'] = 'expense';
    if (data.detailedType === 'income') {
      finalType = 'income';
    } else if (data.detailedType === 'goal-contribution') {
      finalType = 'transfer';
    }
    
    const finalAmount = (finalType === 'income' || finalType === 'transfer') ? Math.abs(data.amount) : -Math.abs(data.amount);

    const processedData: Partial<Transaction> = {
      ...data,
      type: finalType,
      amount: finalAmount,
      tags: data.tags || [],
      categoryId: data.detailedType === 'variable-expense' ? data.categoryId : null, // Ensure categoryId is only set for variable-expense
      toAccountId: data.detailedType === 'goal-contribution' ? data.toAccountId : null, // Ensure toAccountId is only set for goal-contribution
    };


    if (id) { 
      setTransactions(prev => prev.map(t => t.id === id ? { 
        ...t, 
        ...processedData, 
        updatedAt: new Date() 
      } as Transaction : t));
      toast({ title: "Transaction Updated", description: `"${data.description}" has been updated.` });
    } else { 
      const newTransaction: Transaction = {
        ...processedData,
        id: `txn-${Date.now()}`,
        userId: "1", 
        source: "Manual Entry", // Or derive from sourceId if applicable
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Transaction;
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
     const updatedTransaction = transactions.find(t => t.id === transactionId);
     if (updatedTransaction) {
        toast({ title: "Category Updated", description: `Category for "${updatedTransaction.description}" updated.`});
     }
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
            <CardDescription>Manually track all your income and expenses. Use AI to help categorize your spending.</CardDescription>
          </div>
          <AddEditTransactionDialog
            isOpen={isAddEditDialogOpen}
            onOpenChange={setIsAddEditDialogOpen}
            onSave={handleSaveTransaction}
            categories={categoriesList}
            accounts={accountsList}
            recurringItems={recurringItemsList}
            debtAccounts={debtAccountsList}
            goals={goalsList}
            transactionToEdit={transactionToEdit}
          >
            <Button onClick={handleOpenAddDialog} variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Record Transaction
            </Button>
          </AddEditTransactionDialog>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            categories={categoriesList}
            accounts={accountsList}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditDialog}
          />
        </CardContent>
      </Card>
    </div>
  );
}
