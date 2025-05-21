
"use client";

import type { RecurringItem } from "@/types";
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
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addQuarters, addYears, isPast, isToday, isSameDay, parseISO } from "date-fns";
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

interface RecurringListProps {
  items: RecurringItem[];
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: RecurringItem) => void; // Placeholder for now
}

const calculateNextOccurrence = (item: RecurringItem): Date => {
  let nextDate = new Date(item.startDate); // Ensure it's a new Date object
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize today to the start of the day

  // If the start date is in the future, that's the first occurrence
  if (nextDate > today) {
    return nextDate;
  }

  // If there's an end date and it's in the past, there are no more occurrences
  if (item.endDate && new Date(item.endDate) < today) {
    return new Date(item.endDate); // Or handle as 'Ended'
  }

  // Loop until we find a date that is today or in the future
  while (nextDate < today || isSameDay(nextDate, today) && isPast(nextDate)) { // if it's today but already passed
     if (item.endDate && nextDate > new Date(item.endDate)) {
        return new Date(item.endDate); // Past end date
     }
    switch (item.frequency) {
      case "daily":
        nextDate = addDays(nextDate, 1);
        break;
      case "weekly":
        nextDate = addWeeks(nextDate, 1);
        break;
      case "bi-weekly":
        nextDate = addWeeks(nextDate, 2);
        break;
      case "monthly":
        nextDate = addMonths(nextDate, 1);
        break;
      case "quarterly":
        nextDate = addQuarters(nextDate, 1);
        break;
      case "yearly":
        nextDate = addYears(nextDate, 1);
        break;
      default:
        return nextDate; // Should not happen
    }
  }
  
  // If the calculated nextDate exceeds an endDate, cap it at endDate
  if (item.endDate && nextDate > new Date(item.endDate)) {
    return new Date(item.endDate);
  }

  return nextDate;
};


const formatType = (type: RecurringItem['type']) => {
  return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatFrequency = (frequency: RecurringItem['frequency']) => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
};

export function RecurringList({ items, onDeleteItem, onEditItem }: RecurringListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground mt-4 text-center py-8">No recurring items set up yet. Click "Add Recurring Item" to get started.</p>;
  }
  
  const sortedItems = [...items].sort((a,b) => {
    const nextA = calculateNextOccurrence(a);
    const nextB = calculateNextOccurrence(b);
    if (a.endDate && isPast(new Date(a.endDate))) return 1; // Ended items to bottom
    if (b.endDate && isPast(new Date(b.endDate))) return -1;
    return nextA.getTime() - nextB.getTime();
  });


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
            {sortedItems.map((item) => {
              const nextOccurrence = calculateNextOccurrence(item);
              const isEnded = item.endDate && isPast(new Date(item.endDate)) && !isSameDay(new Date(item.endDate), nextOccurrence);
              const status = isEnded ? "Ended" : isToday(nextOccurrence) ? "Today" : "Upcoming";
              
              return (
                <TableRow key={item.id} className={cn(isEnded && "opacity-60")}>
                  <TableCell>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex items-center justify-center">
                                {item.type === 'income' ? <ArrowUpCircle className="h-5 w-5 text-green-500" /> : <ArrowDownCircle className="h-5 w-5 text-red-500" />}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{item.type === 'income' ? 'Income' : 'Expense/Subscription'}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'income' ? 'default' : item.type === 'subscription' ? 'secondary' : 'outline'} className="capitalize">
                      {formatType(item.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                    ${item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{formatFrequency(item.frequency)}</TableCell>
                  <TableCell>
                    {format(nextOccurrence, "MMM dd, yyyy")}
                    {item.endDate && <div className="text-xs text-muted-foreground">Ends: {format(new Date(item.endDate), "MMM dd, yyyy")}</div>}
                  </TableCell>
                  <TableCell>
                     <Badge variant={isEnded ? "outline" : isToday(nextOccurrence) ? "default" : "secondary" } className={cn(isToday(nextOccurrence) && "bg-blue-500 text-white")}>
                        {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* <Button variant="ghost" size="sm" onClick={() => onEditItem(item)} disabled={isEnded} className="hover:text-primary">
                      <Edit3 className="h-4 w-4" />
                    </Button> */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:text-destructive">
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
                          <AlertDialogAction onClick={() => onDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">
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
