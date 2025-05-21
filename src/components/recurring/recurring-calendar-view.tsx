
"use client";

import type { RecurringItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface RecurringCalendarViewProps {
  items: RecurringItem[];
}

export function RecurringCalendarView({ items }: RecurringCalendarViewProps) {
  // Actual calendar implementation will be more complex.
  // This is a placeholder for now.
  return (
    <Card className="shadow-lg mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
          Calendar Overview
        </CardTitle>
        <CardDescription>
          Visualize your recurring income and expenses on a calendar. (Feature coming soon)
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Calendar View Coming Soon!</p>
          <p>This section will display your recurring items in a calendar format.</p>
          {items.length > 0 && <p className="mt-2 text-sm">You have {items.length} recurring item(s) set up.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
