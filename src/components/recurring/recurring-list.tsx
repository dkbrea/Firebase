
"use client";

import type { UnifiedRecurringListItem, RecurringItem } from "@/types"; // Updated import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle, AlertCircle } from "lucide-react";
import { format, isPast, isToday, isSameDay } from "date-fns";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RecurringListProps {
  items: UnifiedRecurringListItem[];
  onDeleteItem: (itemId: string, source: 'recurring' | 'debt') => void;
  onEditItem: (item: RecurringItem) => void; // Still expects original RecurringItem for editing
}

const formatDisplayType = (type: UnifiedRecurringListItem['itemDisplayType']) => {
  switch (type) {
    case 'income': return 'Income';
    case 'subscription': return 'Subscription';
    case 'fixed-expense': return 'Fixed Expense';
    case 'debt-payment': return 'Debt Payment';
    default: return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const formatFrequency = (frequency: UnifiedRecurringListItem['frequency']) => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
};

export function RecurringList({ items, onDeleteItem, onEditItem }: RecurringListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground mt-4 text-center py-8">No recurring items or debt payments set up yet.</p>;
  }
  
  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Occurrence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isExpenseType = item.itemDisplayType === 'subscription' || item.itemDisplayType === 'fixed-expense' || item.itemDisplayType === 'debt-payment';
              
              return (
                <TableRow key={item.id + item.source} className={cn(item.status === "Ended" && "opacity-60")}>
                  <TableCell>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex items-center justify-center">
                                {item.itemDisplayType === 'income' ? <ArrowUpCircle className="h-5 w-5 text-green-500" /> : <ArrowDownCircle className="h-5 w-5 text-red-500" />}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{formatDisplayType(item.itemDisplayType)}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge 
                        variant={item.itemDisplayType === 'income' ? 'default' 
                                 : item.itemDisplayType === 'subscription' ? 'secondary' 
                                 : item.itemDisplayType === 'debt-payment' ? 'destructive'
                                 : 'outline'} 
                        className="capitalize"
                    >
                      {formatDisplayType(item.itemDisplayType)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${item.itemDisplayType === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                    ${item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{formatFrequency(item.frequency)}</TableCell>
                  <TableCell>
                    {format(item.nextOccurrenceDate, "MMM dd, yyyy")}
                    {item.endDate && item.source === 'recurring' && <div className="text-xs text-muted-foreground">Ends: {format(new Date(item.endDate), "MMM dd, yyyy")}</div>}
                  </TableCell>
                  <TableCell>
                     <Badge 
                        variant={item.status === "Ended" ? "outline" 
                                 : item.status === "Today" ? "default" 
                                 : "secondary" } 
                        className={cn(item.status === "Today" && "bg-blue-500 text-white")}
                    >
                        {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {item.isDebt ? (
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled className="opacity-50 cursor-not-allowed">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="flex items-center gap-1"><AlertCircle className="h-4 w-4"/> Manage in Debt Plan</p>
                        </TooltipContent>
                       </Tooltip>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={() => onEditItem(item as unknown as RecurringItem)} disabled={item.status === "Ended"} className="hover:text-primary h-8 w-8">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={item.isDebt} className={cn("hover:text-destructive h-8 w-8", item.isDebt && "opacity-50 cursor-not-allowed")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this recurring item.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteItem(item.id, item.source)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
