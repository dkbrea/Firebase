"use client";

import { Button } from "@/components/ui/button";
import Icons from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PlaidConnectProps {
  onTransactionsFetched: (transactions: any[]) => void; // Adjust 'any' to specific transaction type later
}

export function PlaidConnect({ onTransactionsFetched }: PlaidConnectProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    // Simulate Plaid connection and fetching transactions
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock fetched transactions
    const mockFetchedTransactions = [
      { id: `mock-${Date.now()}`, date: new Date(), description: "Starbucks Coffee", amount: -5.75, source: "Plaid Import" },
      { id: `mock-${Date.now()+1}`, date: new Date(Date.now() - 86400000), description: "Salary Deposit", amount: 2500.00, source: "Plaid Import" },
      { id: `mock-${Date.now()+2}`, date: new Date(Date.now() - 172800000), description: "Netflix Subscription", amount: -15.99, source: "Plaid Import" },
    ];
    
    onTransactionsFetched(mockFetchedTransactions);
    setIsLoading(false);
    toast({
      title: "Bank Connected",
      description: "Successfully fetched mock transactions.",
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Icons.Bank className="h-5 w-5 text-primary"/>
            Connect Bank Account
        </CardTitle>
        <CardDescription>
            Sync your transactions automatically. (This is a mock integration)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Icons.Bank className="mr-2 h-4 w-4" />
          Connect with Plaid (Mock)
        </Button>
      </CardContent>
    </Card>
  );
}
