"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

const mockExpenseData: ExpenseByCategory[] = [
  { category: "Groceries", amount: 350.75 },
  { category: "Dining Out", amount: 220.50 },
  { category: "Utilities", amount: 180.00 },
  { category: "Transport", amount: 120.25 },
  { category: "Entertainment", amount: 95.00 },
  { category: "Shopping", amount: 150.60 },
  { category: "Health", amount: 75.00 },
];

const chartConfig = {
  amount: {
    label: "Amount ($)",
    color: "hsl(var(--primary))",
  },
};

export function ExpenseChart() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render placeholder or null on the server to avoid hydration mismatch
    // as Recharts/ChartContainer might behave differently
    return <Card><CardHeader><CardTitle>Expense Breakdown</CardTitle><CardDescription>Monthly spending by category</CardDescription></CardHeader><CardContent><div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Loading chart...</div></CardContent></Card>;
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Monthly spending by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockExpenseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent />}
              />
              <Legend />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total expenses this month: ${mockExpenseData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing mock data for demonstration.
        </div>
      </CardFooter>
    </Card>
  );
}
