
"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { CategorySpending } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const mockSpendingData: CategorySpending[] = [
  { name: "Housing", value: 1850, color: "hsl(var(--chart-1))" }, // Blue-ish (primary might be too dark, using chart-1 for now)
  { name: "Food", value: 850, color: "hsl(var(--chart-2))" },    // Green-ish (using chart-2 for now)
  { name: "Transportation", value: 450, color: "hsl(var(--chart-3))" }, // Purple-ish
  { name: "Entertainment", value: 350, color: "hsl(var(--chart-4))" }, // Yellow-ish (using chart-4 for now)
  { name: "Utilities", value: 320, color: "hsl(var(--chart-5))" },   // Red-ish (using chart-5 for now)
  { name: "Other", value: 580, color: "hsl(var(--muted))" },      // Gray
];

// Define colors directly to match screenshot better if theme colors aren't suitable
const reportColors = {
  Housing: "#2563eb", // blue-600
  Food: "#16a34a",    // green-600
  Transportation: "#7c3aed", // violet-600
  Entertainment: "#f59e0b", // amber-500
  Utilities: "#dc2626", // red-600
  Other: "#64748b", // slate-500
};


export function SpendingByCategoryReport() {
  const [isClient, setIsClient] = useState(false);
  const [chartData, setChartData] = useState<CategorySpending[]>([]);

  useEffect(() => {
    setIsClient(true);
    const totalSpending = mockSpendingData.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentages = mockSpendingData.map(item => ({
      ...item,
      // @ts-ignore
      color: reportColors[item.name] || item.color, // Use specific report color if defined
      percentage: totalSpending > 0 ? parseFloat(((item.value / totalSpending) * 100).toFixed(1)) : 0,
    }));
    setChartData(dataWithPercentages);
  }, []);

  const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);

  const chartConfig = chartData.reduce((acc, item) => {
    // @ts-ignore
    acc[item.name] = { label: item.name, color: item.color };
    return acc;
  }, {});


  if (!isClient) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[350px]">
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-2">Spending Distribution</p>
          <ChartContainer config={chartConfig} className="aspect-square h-[280px] w-full max-w-[280px] mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  strokeWidth={2}
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color} />
                  ))}
                </Pie>
                 {/* Custom center label */}
                 <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-semibold fill-foreground"
                  >
                    ${totalValue.toLocaleString()}
                  </text>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Breakdown by Category</h3>
          <ul className="space-y-2.5">
            {chartData.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                    <span className="font-semibold text-foreground">${item.value.toLocaleString()}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.percentage}%</span>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="link" className="p-0 h-auto text-primary text-sm" disabled>
            View detailed breakdown <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
