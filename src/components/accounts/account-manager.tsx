"use client";

import type { Account, AccountType } from "@/types";
import { useState, useEffect } from "react";
import { AccountList } from "./account-list";
import { AddAccountDialog } from "./add-account-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockAccounts: Account[] = [
  { id: "acc1", name: "Main Checking", type: "checking", bankName: "Capital One", last4: "1234", balance: 5231.89, isPrimary: true, userId: "1", createdAt: new Date() },
  { id: "acc2", name: "Emergency Fund", type: "savings", bankName: "Ally Bank", last4: "5678", balance: 10500.00, isPrimary: false, userId: "1", createdAt: new Date() },
  { id: "acc3", name: "Travel Rewards Card", type: "credit card", bankName: "Chase", last4: "9012", balance: -345.67, isPrimary: false, userId: "1", createdAt: new Date() },
];

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching accounts
    setAccounts(mockAccounts);
  }, []);

  const handleAddAccount = (newAccountData: Omit<Account, "id" | "userId" | "createdAt" | "isPrimary">) => {
    const newAccount: Account = {
      ...newAccountData,
      id: `acc-${Date.now()}`,
      userId: "1", // Mock user ID
      createdAt: new Date(),
      isPrimary: accounts.length === 0, // Make first account primary by default
    };
    
    setAccounts((prevAccounts) => {
      if (newAccount.isPrimary) {
        // If new account is primary, set all others to not primary
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
    const accountToDelete = accounts.find(acc => acc.id === accountId);
    if (!accountToDelete) return;

    setAccounts((prevAccounts) => prevAccounts.filter(acc => acc.id !== accountId));
    toast({
      title: "Account Deleted",
      description: `Account "${accountToDelete.name}" has been deleted.`,
      variant: "destructive",
    });
  };

  const handleSetPrimaryAccount = (accountId: string) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId,
      }))
    );
    const primaryAccount = accounts.find(acc => acc.id === accountId);
    if (primaryAccount) {
      toast({
        title: "Primary Account Updated",
        description: `"${primaryAccount.name}" is now your primary account.`,
      });
    }
  };
  
  // Placeholder for editing - can be implemented later
  const handleEditAccount = (updatedAccount: Account) => {
    setAccounts(prevAccounts => prevAccounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    toast({
      title: "Account Updated",
      description: `Account "${updatedAccount.name}" has been updated.`,
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddAccountDialog
          isOpen={isAddAccountDialogOpen}
          onOpenChange={setIsAddAccountDialogOpen}
          onAccountAdded={handleAddAccount}
        >
          <Button onClick={() => setIsAddAccountDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
          </Button>
        </AddAccountDialog>
      </div>

      <AccountList
        accounts={accounts}
        onDeleteAccount={handleDeleteAccount}
        onSetPrimaryAccount={handleSetPrimaryAccount}
        onEditAccount={handleEditAccount} // Pass if edit functionality is implemented in AccountList/Dialog
      />
       {accounts.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          <p className="text-lg">No accounts yet.</p>
          <p>Click "Add New Account" to get started.</p>
        </div>
      )}
    </div>
  );
}
