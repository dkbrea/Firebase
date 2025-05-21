
"use client";

import { useState, useEffect } from 'react';
import type { UnifiedRecurringListItem } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, isSameMonth } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecurringCalendarViewProps {
  items: UnifiedRecurringListItem[];
}

const MAX_VISIBLE_ITEMS_IN_CELL = 2; 

const getItemBadgeVariant = (itemType: UnifiedRecurringListItem['itemDisplayType']): NonNullable<Parameters<typeof Badge>[0]['variant']> => {
  switch (itemType) {
    case 'income':
      return 'default'; 
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
    <Card className="shadow-lg mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarDays className="mr-2 h-5 w-5 text-primary" />
          Calendar Overview
        </CardTitle>
        <CardDescription>
          Recurring items are shown on their next occurrence date.
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
              head_cell: "w-full text-muted-foreground font-normal text-xs sm:text-sm pb-1",
              table: "w-full border-collapse",
              row: "flex w-full mt-0 border-t", 
              cell: cn( 
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full",
                "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                "border-l" 
              ),
              day: cn( 
                "h-28 sm:h-32 w-full rounded-none p-0 font-normal aria-selected:opacity-100 transition-colors hover:bg-accent/50",
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
  );
}
