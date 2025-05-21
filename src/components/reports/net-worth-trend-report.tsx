
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { NetWorthDataPoint } from "@/types";
import { Icons } from "@/components/icons"; // Corrected import

const mockNetWorthData: NetWorthDataPoint[] = [
  { month: "Jan '24", assets: 30000, liabilities: 15000, netWorth: 15000 },
  { month: "Feb '24", assets: 30500, liabilities: 14800, netWorth: 15700 },
  { month: "Mar '24", assets: 31200, liabilities: 14500, netWorth: 16700 },
  { month: "Apr '24", assets: 32000, liabilities: 14200, netWorth: 17800 },
  { month: "May '24", assets: 33500, liabilities: 14000, netWorth: 19500 },
  { month: "Jun '24", assets: 34000, liabilities: 13800, netWorth: 20200 },
];

const chartConfig = {
  netWorth: { label: "Net Worth", color: "hsl(var(--chart-1))" },
  assets: { label: "Assets", color: "hsl(var(--chart-2))" },
  liabilities: { label: "Liabilities", color: "hsl(var(--chart-5))" }, // Using chart-5 for red-ish
};

export function NetWorthTrendReport() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  const currentNetWorth = mockNetWorthData[mockNetWorthData.length - 1];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.TrendingUp className="mr-2 h-5 w-5 text-primary"/>
            Net Worth Over Time
        </CardTitle>
        <CardDescription>Track your asset growth and liability reduction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-xs text-muted-foreground">Total Assets</p>
                <p className="text-lg font-bold text-green-600">${currentNetWorth.assets.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Total Liabilities</p>
                <p className="text-lg font-bold text-red-600">${currentNetWorth.liabilities.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Current Net Worth</p>
                <p className="text-lg font-bold text-primary">${currentNetWorth.netWorth.toLocaleString()}</p>
            </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockNetWorthData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip content={<ChartTooltipContent indicator="dot" />} />
              <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem"}} />
              <Line type="monotone" dataKey="assets" stroke="var(--color-assets)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="liabilities" stroke="var(--color-liabilities)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netWorth" stroke="var(--color-netWorth)" strokeWidth={3} dot={{r:4, fill: "var(--color-netWorth)", strokeWidth:2, stroke: "hsl(var(--background))"}}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
