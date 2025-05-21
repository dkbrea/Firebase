
"use client";

import type { DebtAccount, DebtPayoffStrategy, PaymentFrequency } from "@/types";
import { useState, useEffect } from "react";
import { DebtList } from "./debt-list";
import { AddDebtDialog } from "./add-debt-dialog";
import { PayoffStrategySelector } from "./payoff-strategy-selector";
import { Button } from "@/components/ui/button";
import { PlusCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, paymentDayOfMonth: 15, paymentFrequency: "monthly", userId: "1", createdAt: new Date() },
  { id: "debt2", name: "Student Loan - Navient", type: "student-loan", balance: 22500.00, apr: 6.8, minimumPayment: 280, paymentDayOfMonth: 1, paymentFrequency: "monthly", userId: "1", createdAt: new Date() },
  { id: "debt3", name: "Car Loan - Local CU", type: "auto-loan", balance: 8700.50, apr: 4.2, minimumPayment: 350, paymentFrequency: "bi-weekly", userId: "1", createdAt: new Date() },
];

export function DebtManager() {
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>([]);
  const [payoffStrategy, setPayoffStrategy] = useState<DebtPayoffStrategy | null>(null);
  const [isAddDebtDialogOpen, setIsAddDebtDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching debt accounts and saved strategy
    setDebtAccounts(mockDebtAccounts);
    // setPayoffStrategy('snowball'); // Optionally load a saved strategy
  }, []);

  const handleAddDebtAccount = (newDebtData: Omit<DebtAccount, "id" | "userId" | "createdAt">) => {
    const newAccount: DebtAccount = {
      ...newDebtData,
      id: `debt-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
    };
    
    setDebtAccounts((prevAccounts) => [...prevAccounts, newAccount]);
    toast({
      title: "Debt Account Added",
      description: `Debt "${newAccount.name}" has been successfully added.`,
    });
    setIsAddDebtDialogOpen(false);
  };

  const handleDeleteDebtAccount = (debtId: string) => {
    const accountToDelete = debtAccounts.find(acc => acc.id === debtId);
    if (!accountToDelete) return;

    setDebtAccounts((prevAccounts) => prevAccounts.filter(acc => acc.id !== debtId));
    toast({
      title: "Debt Account Deleted",
      description: `Debt "${accountToDelete.name}" has been deleted.`,
      variant: "destructive",
    });
  };
  
  const handleStrategySelect = (strategy: DebtPayoffStrategy) => {
    setPayoffStrategy(strategy);
    toast({
      title: "Payoff Strategy Updated",
      description: `You've selected the ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} method.`,
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Your Debt Accounts</CardTitle>
            <CardDescription>Manage all your outstanding debts here.</CardDescription>
          </div>
          <AddDebtDialog
            isOpen={isAddDebtDialogOpen}
            onOpenChange={setIsAddDebtDialogOpen}
            onDebtAdded={handleAddDebtAccount}
          >
            <Button onClick={() => setIsAddDebtDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Debt
            </Button>
          </AddDebtDialog>
        </CardHeader>
        <CardContent>
          {debtAccounts.length > 0 ? (
            <DebtList
              debtAccounts={debtAccounts}
              onDeleteDebtAccount={handleDeleteDebtAccount}
              // onEditDebtAccount={handleEditDebtAccount} // For future implementation
            />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p className="text-lg">No debt accounts yet.</p>
              <p>Click "Add New Debt" to start planning your payoff.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {debtAccounts.length > 0 && (
        <PayoffStrategySelector
          selectedStrategy={payoffStrategy}
          onStrategySelect={handleStrategySelect}
        />
      )}

      {payoffStrategy && debtAccounts.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Next Steps</AlertTitle>
          <AlertDescription>
            Based on the <strong>{payoffStrategy}</strong> method and your listed debts, a detailed payoff plan would be generated here. (This part is for future implementation). For now, ensure all debts are accurately entered.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
