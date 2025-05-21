
"use client";

import { useState, useEffect } from 'react';
import type { UnifiedRecurringListItem } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, isSameMonth } from 'date-fns'; // Added isSameMonth
import type { DayContentProps } from 'react-day-picker'; // Import DayContentProps
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays } from 'lucide-react';

interface RecurringCalendarViewProps {
  items: UnifiedRecurringListItem[];
}

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

  // Custom DayContent component to render inside each calendar day cell
  const CustomDayContent = ({ date, displayMonth }: DayContentProps) => {
    const dayOfMonth = format(date, "d");
    
    // Filter items for the current day AND current display month
    const itemsOnThisDay = items.filter(item => 
        isSameDay(new Date(item.nextOccurrenceDate), date) && 
        item.status !== "Ended" && 
        isSameMonth(date, displayMonth)
    );

    return (
        <div className="flex flex-col items-center justify-start h-full w-full pt-0.5 sm:pt-1">
            <span className="text-xs font-medium">{dayOfMonth}</span>
            {itemsOnThisDay.length > 0 && (
                <div className="mt-px w-full overflow-hidden px-0.5 text-center">
                    <p className="text-[10px] leading-tight truncate text-primary dark:text-primary-foreground/80">
                        {itemsOnThisDay[0].name}
                    </p>
                    {itemsOnThisDay.length > 1 && (
                        <p className="text-[9px] leading-tight text-muted-foreground">
                            +{itemsOnThisDay.length - 1} more
                        </p>
                    )}
                </div>
            )}
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
            Days with upcoming recurring items show item names. Click a day to see full details.
            (Currently shows next occurrence only for each item).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-2 sm:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            components={{ DayContent: CustomDayContent }} // Use custom DayContent
            className="p-0 rounded-md border" 
            classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                day_today: "bg-accent text-accent-foreground font-bold",
                caption_label: "text-lg font-medium",
                head_cell: "w-10 sm:w-12",
                day: "h-10 w-10 sm:h-12 sm:w-12 p-0", // Reset padding for custom content
            }}
            showOutsideDays={true} // Show outside days for better context
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
                            variant={item.itemDisplayType === 'income' ? 'default' 
                                 : item.itemDisplayType === 'subscription' ? 'secondary' 
                                 : item.itemDisplayType === 'debt-payment' ? 'destructive'
                                 : 'outline'} 
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
