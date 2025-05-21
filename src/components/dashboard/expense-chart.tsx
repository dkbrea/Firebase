"use client";

import { TrendingUp, CalendarDays } from "lucide-react";
// Added Area to imports, kept Bar and BarChart in case they are used elsewhere or for future refactoring.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ExpenseByCategory } from "@/types";
import { useEffect, useState } from "react";

const mockChartData = [
  { date: "2023-10-01", amount: 1500 },
  { date: "2023-10-05", amount: 1700 },
  { date: "2023-10-10", amount: 1900 },
  { date: "2023-10-15", amount: 2100 },
  { date: "2023-10-20", amount: 2000 },
  { date: "2023-10-25", amount: 2300 },
  { date: "2023-10-30", amount: 2500 },
];

const chartConfig = {
  amount: {
    label: "Amount ($)",
    color: "hsl(var(--primary))", // This color might be for the legend or tooltip, not directly the area stroke if using gradient
  },
};

export function ExpenseChart() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Monthly spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-2 shadow-lg"> 
      <CardHeader>
        <CardTitle>Statistics Overview</CardTitle>
        <CardDescription>Income and expenses over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <Tooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend />
              {/* Changed Bar to Area and configured to use the gradient */}
              <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart> {/* Corrected closing tag */}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total amount shown: ${mockChartData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing mock data for demonstration.
        </div>
      </CardFooter>
    </Card>
  );
}
