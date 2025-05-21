
"use client";

import { useState, useEffect } from 'react';
import type { UnifiedRecurringListItem } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, isSameMonth } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecurringCalendarViewProps {
  items: UnifiedRecurringListItem[];
}

const MAX_VISIBLE_ITEMS_IN_CELL = 2; // Show 2 items, then "+N more"

const getItemBadgeVariant = (itemType: UnifiedRecurringListItem['itemDisplayType']): NonNullable<Parameters<typeof Badge>[0]['variant']> => {
  switch (itemType) {
    case 'income':
      return 'default'; // Usually primary color
    case 'subscription':
      return 'secondary';
    case 'fixed-expense':
      return 'outline';
    case 'debt-payment':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function RecurringCalendarView({ items }: RecurringCalendarViewProps) {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDayItems, setSelectedDayItems] = useState<UnifiedRecurringListItem[]>([]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedDayItems(
        items.filter(
          (item) => isSameDay(new Date(item.nextOccurrenceDate), selectedDate) && item.status !== "Ended"
        )
      );
    } else {
      setSelectedDayItems([]);
    }
  }, [selectedDate, items, month]);

  const CustomDayContent = ({ date, displayMonth }: DayContentProps) => {
    const dayOfMonth = format(date, "d");
    
    const itemsOnThisDay = items.filter(item => 
        isSameDay(new Date(item.nextOccurrenceDate), date) && 
        item.status !== "Ended" && 
        isSameMonth(date, displayMonth)
    );

    return (
        <div className="flex flex-col items-start justify-start h-full w-full p-1.5">
            <span className="text-xs font-medium self-start mb-1">{dayOfMonth}</span>
            <div className="space-y-1 w-full overflow-hidden">
                {itemsOnThisDay.slice(0, MAX_VISIBLE_ITEMS_IN_CELL).map(item => (
                    <Badge
                        key={item.id + item.source}
                        variant={getItemBadgeVariant(item.itemDisplayType)}
                        className="w-full text-[10px] leading-tight truncate justify-start px-1 py-0.5"
                    >
                        {item.name}
                    </Badge>
                ))}
                {itemsOnThisDay.length > MAX_VISIBLE_ITEMS_IN_CELL && (
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        +{itemsOnThisDay.length - MAX_VISIBLE_ITEMS_IN_CELL} more
                    </p>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 mt-4">
      <Card className="shadow-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Calendar Overview
          </CardTitle>
          <CardDescription>
            Recurring items are shown on their next occurrence date. Click a day to see full details.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-2 sm:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            components={{ DayContent: CustomDayContent }}
            className="p-0 rounded-md border w-full" 
            classNames={{
                day_selected: "bg-primary/20 text-primary-foreground ring-1 ring-primary",
                day_today: "bg-accent text-accent-foreground font-bold ring-1 ring-accent",
                caption_label: "text-lg font-medium",
                head_cell: "w-full text-muted-foreground font-normal text-xs sm:text-sm pb-1", // Adjusted head_cell
                table: "w-full border-collapse",
                row: "flex w-full mt-0 border-t", // Removed mt-2, added border-t for horizontal lines
                cell: cn( // Cell takes full width within its column, height defined by day
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full",
                  "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  "border-l" // Add left border to cells
                ),
                day: cn( // Day component itself fills the cell
                  "h-24 sm:h-28 w-full rounded-none p-0 font-normal aria-selected:opacity-100 transition-colors hover:bg-accent/50",
                  "focus:bg-accent/70 focus:outline-none"
                ),
                day_outside: "text-muted-foreground/50 aria-selected:bg-accent/30",
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-2 w-full",
            }}
            showOutsideDays={true}
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-xl">
            {selectedDate ? `Items for ${format(selectedDate, 'MMM dd, yyyy')}` : 'Select a Day'}
          </CardTitle>
          <CardDescription>
            {selectedDate ? (selectedDayItems.length > 0 ? `Found ${selectedDayItems.length} item(s).` : 'No items for this day.') : 'Click a day on the calendar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDayItems.length > 0 ? (
            <ScrollArea className="h-[300px] pr-3">
              <ul className="space-y-3">
                {selectedDayItems.map(item => (
                  <li key={item.id + item.source} className="p-3 rounded-md border bg-card shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold flex items-center gap-2 text-sm">
                             {item.itemDisplayType === 'income' ? <ArrowUpCircle className="h-4 w-4 text-green-500" /> : <ArrowDownCircle className="h-4 w-4 text-red-500" />}
                            {item.name}
                        </span>
                        <span className={`font-bold text-sm ${item.itemDisplayType === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                            ${item.amount.toFixed(2)}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-1">
                        <span>Type:</span>
                        <Badge 
                            variant={getItemBadgeVariant(item.itemDisplayType)} 
                            className="capitalize text-xs"
                        >
                          {item.itemDisplayType.replace('-', ' ')}
                        </Badge>
                        <span>/</span> 
                        <span>Freq:</span>
                        <Badge variant="outline" className="capitalize text-xs">{item.frequency}</Badge>
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-dashed italic">Notes: {item.notes}</p>}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">
              {selectedDate ? 'No items scheduled for this day based on their next occurrence.' : 'Select a day from the calendar to see item details.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

