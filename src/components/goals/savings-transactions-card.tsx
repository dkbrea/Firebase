
"use client";

import type { SavingsTransactionItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ArrowRight, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const mockTransactions: SavingsTransactionItem[] = [
  { id: "st1", date: new Date(2025, 1, 29), goalName: "Emergency Fund", amount: 100, method: "Auto-Save", status: "Pending" },
  { id: "st2", date: new Date(2025, 1, 28), goalName: "New Car", amount: 250, method: "Manual", status: "Completed" },
  { id: "st3", date: new Date(2025, 1, 28), goalName: "Vacation", amount: 75, method: "Auto-Save", status: "Completed" },
  { id: "st4", date: new Date(2025, 1, 27), goalName: "Emergency Fund", amount: 200, method: "Auto-Save", status: "Failed" },
  { id: "st5", date: new Date(2025, 1, 26), goalName: "Travel Fund", amount: 150, method: "Manual", status: "Completed" },
];

export function SavingsTransactionsCard() {
  const getStatusBadgeVariant = (status: SavingsTransactionItem['status']) => {
    switch (status) {
      case "Completed": return "default"; // Greenish if theme allows
      case "Pending": return "secondary"; // Yellowish/Grayish
      case "Failed": return "destructive";
      default: return "outline";
    }
  };
   const getStatusBadgeClass = (status: SavingsTransactionItem['status']) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-700 border-green-500/30";
      case "Pending": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "Failed": return "bg-red-500/20 text-red-700 border-red-500/30";
      default: return "";
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-lg font-semibold">Savings Transactions</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue="all-status" disabled>
            <SelectTrigger className="w-auto h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="latest" disabled>
            <SelectTrigger className="w-auto h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mockTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[50px]"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-xs">{format(transaction.date, "MMMM dd, yyyy")}</TableCell>
                  <TableCell className="font-medium text-sm">{transaction.goalName}</TableCell>
                  <TableCell className="text-right text-sm">${transaction.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{transaction.method}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)} className={`text-xs ${getStatusBadgeClass(transaction.status)}`}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50" disabled>
                        <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-10">No savings transactions to display.</p>
        )}
      </CardContent>
    </Card>
  );
}
