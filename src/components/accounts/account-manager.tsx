
"use client";

import type { Account, AccountType, DebtAccount } from "@/types";
import { useState, useEffect } from "react";
import { AccountList } from "./account-list";
import { AddAccountDialog } from "./add-account-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockAssetAccounts: Account[] = [
  { id: "acc1", name: "Main Checking", type: "checking", bankName: "Capital One", last4: "1234", balance: 5231.89, isPrimary: true, userId: "1", createdAt: new Date() },
  { id: "acc2", name: "Emergency Fund", type: "savings", bankName: "Ally Bank", last4: "5678", balance: 10500.00, isPrimary: false, userId: "1", createdAt: new Date() },
  { id: "acc3", name: "Travel Rewards Card", type: "credit card", bankName: "Chase", last4: "9012", balance: -345.67, isPrimary: false, userId: "1", createdAt: new Date() }, // Example of CC as an asset with negative balance
];

const mockDebtAccounts: DebtAccount[] = [
  { id: "debt1", name: "Visa Gold Card Debt", type: "credit-card", balance: 5250.75, apr: 18.9, minimumPayment: 150, userId: "1", createdAt: new Date() },
  { id: "debt2", name: "Student Loan Debt - Navient", type: "student-loan", balance: 22500.00, apr: 6.8, minimumPayment: 280, userId: "1", createdAt: new Date() },
];


export function AccountManager() {
  const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);
  const [debtAccountsList, setDebtAccountsList] = useState<DebtAccount[]>([]); // Renamed to avoid conflict
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching accounts
    setAssetAccounts(mockAssetAccounts);
    setDebtAccountsList(mockDebtAccounts); // Load mock debt accounts
  }, []);

  const handleAddAccount = (newAccountData: Omit<Account, "id" | "userId" | "createdAt" | "isPrimary">) => {
    const newAccount: Account = {
      ...newAccountData,
      id: `acc-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
      isPrimary: assetAccounts.filter(acc => acc.type !== 'credit card' || acc.balance >=0).length === 0, // Make first non-debt-like account primary
    };
    
    setAssetAccounts((prevAccounts) => {
      if (newAccount.isPrimary) {
        return [
          ...prevAccounts.map(acc => ({ ...acc, isPrimary: false })),
          newAccount
        ];
      }
      return [...prevAccounts, newAccount];
    });

    toast({
      title: "Account Added",
      description: `Account "${newAccount.name}" has been successfully created.`,
    });
    setIsAddAccountDialogOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    // This handler currently only manages asset accounts.
    // Deletion of debt accounts should be handled in the Debt Plan section.
    const accountToDelete = assetAccounts.find(acc => acc.id === accountId);
    if (!accountToDelete) return;

    setAssetAccounts((prevAccounts) => prevAccounts.filter(acc => acc.id !== accountId));
    toast({
      title: "Account Deleted",
      description: `Account "${accountToDelete.name}" has been deleted.`,
      variant: "destructive",
    });
  };

  const handleSetPrimaryAccount = (accountId: string) => {
    setAssetAccounts((prevAccounts) =>
      prevAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId,
      }))
    );
    const primaryAccount = assetAccounts.find(acc => acc.id === accountId);
    if (primaryAccount) {
      toast({
        title: "Primary Account Updated",
        description: `"${primaryAccount.name}" is now your primary account.`,
      });
    }
  };
  
  const handleEditAccount = (updatedAccount: Account) => {
    // This handler currently only manages asset accounts.
    setAssetAccounts(prevAccounts => prevAccounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    toast({
      title: "Account Updated",
      description: `Account "${updatedAccount.name}" has been updated.`,
    });
  };

  const allDisplayAccounts = [...assetAccounts, ...debtAccountsList];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddAccountDialog
          isOpen={isAddAccountDialogOpen}
          onOpenChange={setIsAddAccountDialogOpen}
          onAccountAdded={handleAddAccount}
        >
          <Button onClick={() => setIsAddAccountDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset Account
          </Button>
        </AddAccountDialog>
      </div>

      <AccountList
        accounts={allDisplayAccounts}
        onDeleteAccount={handleDeleteAccount} // Only affects asset accounts from here
        onSetPrimaryAccount={handleSetPrimaryAccount} // Only affects asset accounts from here
        onEditAccount={handleEditAccount} // Only affects asset accounts from here
      />
       {allDisplayAccounts.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          <p className="text-lg">No accounts yet.</p>
          <p>Click "Add New Asset Account" to get started or manage debts in the Debt Plan section.</p>
        </div>
      )}
    </div>
  );
}
