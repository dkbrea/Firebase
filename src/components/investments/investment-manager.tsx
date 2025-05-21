
"use client";

import type { InvestmentAccount, InvestmentAccountType } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { AddInvestmentAccountDialog } from "./add-investment-account-dialog";
import { InvestmentAccountList } from "./investment-account-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, TrendingUp, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real app, this would come from a data store / API
const mockInvestmentAccounts: InvestmentAccount[] = [
  { id: "inv1", name: "Vanguard Brokerage", type: "brokerage", institution: "Vanguard", currentValue: 25340.75, userId: "1", createdAt: new Date() },
  { id: "inv2", name: "Fidelity Roth IRA", type: "ira", institution: "Fidelity", currentValue: 12750.20, userId: "1", createdAt: new Date() },
  { id: "inv3", name: "Coinbase Wallet", type: "crypto", institution: "Coinbase", currentValue: 5820.90, userId: "1", createdAt: new Date() },
  { id: "inv4", name: "Company 401(k)", type: "401k", institution: "Empower", currentValue: 33450.00, userId: "1", createdAt: new Date() },
];

export function InvestmentManager() {
  const [investmentAccounts, setInvestmentAccounts] = useState<InvestmentAccount[]>(mockInvestmentAccounts);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { toast } = useToast();

  const totalPortfolioValue = useMemo(() => {
    return investmentAccounts.reduce((sum, acc) => sum + acc.currentValue, 0);
  }, [investmentAccounts]);

  const handleAddInvestmentAccount = (newAccountData: Omit<InvestmentAccount, "id" | "userId" | "createdAt">) => {
    const newAccount: InvestmentAccount = {
      ...newAccountData,
      id: `inv-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
    };
    
    setInvestmentAccounts((prevAccounts) => [...prevAccounts, newAccount]);
    toast({
      title: "Investment Account Added",
      description: `Account "${newAccount.name}" has been successfully created.`,
    });
    setIsAddAccountDialogOpen(false);
  };

  const handleDeleteInvestmentAccount = (accountId: string) => {
    const accountToDelete = investmentAccounts.find(acc => acc.id === accountId);
    if (!accountToDelete) return;

    setInvestmentAccounts((prevAccounts) => prevAccounts.filter(acc => acc.id !== accountId));
    toast({
      title: "Investment Account Deleted",
      description: `Account "${accountToDelete.name}" has been deleted.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-7 w-7" />
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">
            ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-80 mt-1">
            Across {investmentAccounts.length} account(s).
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-xl">Your Investment Accounts</CardTitle>
                <CardDescription>View and manage your individual investment accounts.</CardDescription>
            </div>
            <AddInvestmentAccountDialog
                isOpen={isAddAccountDialogOpen}
                onOpenChange={setIsAddAccountDialogOpen}
                onAccountAdded={handleAddInvestmentAccount}
            >
                <Button onClick={() => setIsAddAccountDialogOpen(true)} variant="outline" className="bg-card hover:bg-muted">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </AddInvestmentAccountDialog>
        </CardHeader>
        <CardContent>
            {investmentAccounts.length > 0 ? (
                <InvestmentAccountList
                    accounts={investmentAccounts}
                    onDeleteAccount={handleDeleteInvestmentAccount}
                    // onEditAccount={handleEditInvestmentAccount} // For future
                />
            ) : (
                 <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg">
                    <LineChart className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Start Tracking Your Investments</h3>
                    <p className="text-muted-foreground mb-6">Add your brokerage, retirement, or other investment accounts to see your portfolio grow.</p>
                    <AddInvestmentAccountDialog
                        isOpen={isAddAccountDialogOpen}
                        onOpenChange={setIsAddAccountDialogOpen}
                        onAccountAdded={handleAddInvestmentAccount}
                    >
                        <Button onClick={() => setIsAddAccountDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Investment Account
                        </Button>
                    </AddInvestmentAccountDialog>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
