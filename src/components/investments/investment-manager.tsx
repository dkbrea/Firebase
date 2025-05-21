
"use client";

import type { InvestmentAccount, InvestmentAccountType, Holding } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { AddInvestmentAccountDialog } from "./add-investment-account-dialog";
import { InvestmentAccountList } from "./investment-account-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Icons from "@/components/icons";
import { PlusCircle, TrendingUp, LineChart, Clock, RefreshCw, BarChartBig, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MarketOverviewCard } from "./market-overview-card";
import { PortfolioSummaryCard } from "./portfolio-summary-card";
import { TopHoldingsTable } from "./top-holdings-table";

const mockInvestmentAccounts: InvestmentAccount[] = [
  { id: "inv1", name: "Vanguard Brokerage", type: "brokerage", institution: "Vanguard", currentValue: 25340.75, userId: "1", createdAt: new Date() },
  { id: "inv2", name: "Fidelity Roth IRA", type: "ira", institution: "Fidelity", currentValue: 12750.20, userId: "1", createdAt: new Date() },
  { id: "inv3", name: "Coinbase Wallet", type: "crypto", institution: "Coinbase", currentValue: 5820.90, userId: "1", createdAt: new Date() },
  { id: "inv4", name: "Company 401(k)", type: "401k", institution: "Empower", currentValue: 33450.00, userId: "1", createdAt: new Date() },
];

const mockHoldings: Holding[] = [
    { id: "h1", symbol: "AAPL", name: "Apple Inc.", value: 10250.75, shares: 50, price: 205.015, changePercent: 1.2, userId: "1", accountId: "inv1", logoUrl: "https://placehold.co/32x32.png?text=AAPL&font=roboto" },
    { id: "h2", symbol: "MSFT", name: "Microsoft Corp.", value: 8500.00, shares: 20, price: 425.00, changePercent: -0.5, userId: "1", accountId: "inv1", logoUrl: "https://placehold.co/32x32.png?text=MSFT&font=roboto" },
    { id: "h3", symbol: "BTC", name: "Bitcoin", value: 3500.00, shares: 0.05, price: 70000.00, changePercent: 2.5, userId: "1", accountId: "inv3", logoUrl: "https://placehold.co/32x32.png?text=BTC&font=roboto" },
    { id: "h4", symbol: "VTSAX", name: "Vanguard Total Stock Market Index Fund Admiral Shares", value: 6590.00, shares: 50, price: 131.80, changePercent: 0.8, userId: "1", accountId: "inv2" },
];


export function InvestmentManager() {
  const [investmentAccounts, setInvestmentAccounts] = useState<InvestmentAccount[]>(mockInvestmentAccounts);
  const [holdings, setHoldings] = useState<Holding[]>(mockHoldings);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { toast } = useToast();

  const totalPortfolioValue = useMemo(() => {
    return investmentAccounts.reduce((sum, acc) => sum + acc.currentValue, 0);
  }, [investmentAccounts]);

  const handleAddInvestmentAccount = (newAccountData: Omit<InvestmentAccount, "id" | "userId" | "createdAt">) => {
    const newAccount: InvestmentAccount = {
      ...newAccountData,
      id: `inv-${Date.now()}`,
      userId: "1", 
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
    setHoldings((prevHoldings) => prevHoldings.filter(h => h.accountId !== accountId)); // Also remove associated holdings
    toast({
      title: "Investment Account Deleted",
      description: `Account "${accountToDelete.name}" and its holdings have been deleted.`,
      variant: "destructive",
    });
  };

  const handleDeleteHolding = (holdingId: string) => {
     const holdingToDelete = holdings.find(h => h.id === holdingId);
     if(holdingToDelete) {
        setHoldings(prev => prev.filter(h => h.id !== holdingId));
        toast({ title: "Holding Removed", description: `Holding "${holdingToDelete.name}" removed.`});
     }
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700 [&>svg]:text-blue-700">
        <Icons.Info className="h-4 w-4" />
        <AlertTitle>Portfolio Data</AlertTitle>
        <AlertDescription>
          Market data and holdings are updated manually. Automated updates coming soon.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <MarketOverviewCard />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <PortfolioSummaryCard totalPortfolioValue={totalPortfolioValue} />
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
                <CardTitle className="text-xl flex items-center gap-2"><BarChartBig className="h-5 w-5 text-primary"/> Investment Accounts</CardTitle>
                <CardDescription>Manage your individual investment accounts.</CardDescription>
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
                />
            ) : (
                 <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg bg-muted/30">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Investment Accounts Yet</h3>
                    <p className="text-muted-foreground mb-6">Add your brokerage, retirement, or other investment accounts to start tracking your portfolio.</p>
                    <AddInvestmentAccountDialog
                        isOpen={isAddAccountDialogOpen}
                        onOpenChange={setIsAddAccountDialogOpen}
                        onAccountAdded={handleAddInvestmentAccount}
                    >
                        <Button onClick={() => setIsAddAccountDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Account
                        </Button>
                    </AddInvestmentAccountDialog>
                </div>
            )}
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
                <CardTitle className="text-xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/> Top Holdings</CardTitle>
                <CardDescription>Overview of your major investment positions.</CardDescription>
            </div>
            {/* Placeholder for Add Holding Button */}
             <Button variant="outline" className="bg-card hover:bg-muted" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Holding (Soon)
            </Button>
        </CardHeader>
        <CardContent>
           {holdings.length > 0 ? (
             <TopHoldingsTable holdings={holdings} onDeleteHolding={handleDeleteHolding} />
           ) : (
             <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg bg-muted/30">
                <LineChart className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Holdings Tracked</h3>
                <p className="text-muted-foreground mb-6">Add individual stocks, ETFs, or crypto to see your positions here.</p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
