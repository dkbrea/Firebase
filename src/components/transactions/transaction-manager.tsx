"use client";

import type { Transaction, Category } from "@/types";
import { useState, useEffect } from "react";
import { PlaidConnect } from "./plaid-connect";
import { TransactionTable } from "./transaction-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
// Mock data for categories, in a real app this would come from a store/API
const mockCategories: Category[] = [
  { id: "1", name: "Groceries", userId: "1", createdAt: new Date() },
  { id: "2", name: "Dining Out", userId: "1", createdAt: new Date() },
  { id: "3", name: "Utilities", userId: "1", createdAt: new Date() },
  { id: "4", name: "Transport", userId: "1", createdAt: new Date() },
  { id: "5", name: "Entertainment", userId: "1", createdAt: new Date() },
  { id: "6", name: "Shopping", userId: "1", createdAt: new Date() },
  { id: "7", name: "Health", userId: "1", createdAt: new Date() },
  { id: "8", name: "Salary", userId: "1", createdAt: new Date() }, // For income
];

const initialMockTransactions: Transaction[] = [
    { id: "tx1", date: new Date(2024, 6, 15), description: "Trader Joe's Haul", amount: -75.20, categoryId: "1", userId: "1", source: "Manual"},
    { id: "tx2", date: new Date(2024, 6, 14), description: "Dinner at The Italian Place", amount: -45.50, categoryId: "2", userId: "1", source: "Manual"},
    { id: "tx3", date: new Date(2024, 6, 12), description: "Monthly Rent", amount: -1200.00, categoryId: "3", userId: "1", source: "Manual"},
    { id: "tx4", date: new Date(2024, 6, 10), description: "Spotify Subscription", amount: -10.99, categoryId: "5", userId: "1", source: "Manual"},
    { id: "tx5", date: new Date(2024, 6, 5), description: "Paycheck", amount: 2200.00, categoryId: "8", userId: "1", source: "Manual"},
];


export function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
  const [categories, setCategories] = useState<Category[]>(mockCategories); // Should be fetched or passed

  // In a real app, categories would be fetched, e.g., in a useEffect
  useEffect(() => {
    // Simulate fetching categories if needed, or assume they are passed correctly
    // For now, using mockCategories directly
  }, []);

  const handleTransactionsFetched = (newlyFetchedTransactions: any[]) => {
     const formattedTransactions = newlyFetchedTransactions.map(t => ({
        ...t,
        date: new Date(t.date), // ensure date is a Date object
        userId: "1" // mock user ID
    })) as Transaction[];
    setTransactions((prevTransactions) => [...formattedTransactions, ...prevTransactions]);
  };

  const handleUpdateTransactionCategory = (transactionId: string, categoryId: string | null) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((t) =>
        t.id === transactionId ? { ...t, categoryId } : t
      )
    );
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions((prevTransactions) => prevTransactions.filter(t => t.id !== transactionId));
  };
  
  // Placeholder for adding manual transaction
  const handleAddManualTransaction = () => {
    // This would open a modal or form
    console.log("Add manual transaction clicked");
     const newMockTransaction: Transaction = {
      id: `manual-${Date.now()}`,
      date: new Date(),
      description: "New Manual Transaction",
      amount: -Math.floor(Math.random() * 100 + 10), // Random expense
      categoryId: null,
      userId: "1",
      source: "Manual Entry"
    };
    setTransactions(prev => [newMockTransaction, ...prev]);
  };


  return (
    <div className="space-y-6">
      <PlaidConnect onTransactionsFetched={handleTransactionsFetched} />
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View, categorize, and manage your transactions.</CardDescription>
          </div>
          <Button onClick={handleAddManualTransaction} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Manually
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            categories={categories}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
