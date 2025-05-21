"use client";

import type { Account } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icons from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface AccountListProps {
  accounts: Account[];
  onDeleteAccount: (accountId: string) => void;
  onSetPrimaryAccount: (accountId: string) => void;
  onEditAccount: (account: Account) => void; // Placeholder for now
}

const getAccountTypeIcon = (type: Account["type"]) => {
  switch (type) {
    case "checking":
      return <Icons.AccountTypeChecking className="h-5 w-5" />;
    case "savings":
      return <Icons.AccountTypeSavings className="h-5 w-5" />;
    case "credit card":
      return <Icons.AccountTypeCreditCard className="h-5 w-5" />;
    default:
      return <Icons.AccountTypeOther className="h-5 w-5" />;
  }
};

export function AccountList({ accounts, onDeleteAccount, onSetPrimaryAccount, onEditAccount }: AccountListProps) {

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id} className={`flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out ${account.isPrimary ? 'border-primary border-2' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {getAccountTypeIcon(account.type)}
                {account.name}
              </CardTitle>
              {account.isPrimary && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Icons.Primary className="h-3.5 w-3.5" /> Primary
                </Badge>
              )}
            </div>
            <CardDescription className="capitalize pt-1">
              {account.bankName ? `${account.type} - ${account.bankName}` : account.type}
              {account.last4 && ` (•••• ${account.last4})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-3xl font-bold text-foreground">
              ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              Current Balance
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t">
            {!account.isPrimary && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetPrimaryAccount(account.id)}
                className="w-full sm:w-auto"
              >
                <Icons.Primary className="mr-2 h-4 w-4" /> Set as Primary
              </Button>
            )}
             {account.isPrimary && (
                <div className="w-full sm:w-auto h-9"></div> // Spacer to align buttons when primary
            )}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
               {/* <Button variant="ghost" size="sm" onClick={() => onEditAccount(account)} className="text-muted-foreground hover:text-primary">
                <Icons.Edit className="h-4 w-4" />
              </Button> */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Icons.Delete className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account "{account.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the account
                      and all associated data (not really, this is a mock).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteAccount(account.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
