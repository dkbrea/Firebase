
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Settings2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const mockAssetAllocationData = [
  { name: "US Stocks", value: 40, fill: "hsl(var(--chart-1))" },
  { name: "Intl Stocks", value: 25, fill: "hsl(var(--chart-2))" },
  { name: "Bonds", value: 15, fill: "hsl(var(--chart-3))" },
  { name: "Crypto", value: 10, fill: "hsl(var(--chart-4))" },
  { name: "Cash/Other", value: 10, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  value: {
    label: "Value",
  },
  ...mockAssetAllocationData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as any),
};


interface PortfolioSummaryCardProps {
  totalPortfolioValue: number;
}

export function PortfolioSummaryCard({ totalPortfolioValue }: PortfolioSummaryCardProps) {
  // Placeholder performance data
  const dailyPerformance = { change: "+$250.75", percent: "+0.45%", positive: true };
  const yearlyPerformance = { change: "+$5,120.30", percent: "+10.8%", positive: true };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-xl">Portfolio Summary</CardTitle>
          <CardDescription>Your total investment performance.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" disabled className="opacity-50 cursor-not-allowed">
            <Settings2 className="h-5 w-5"/>
            <span className="sr-only">Configure Summary</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground">Total Portfolio Value</p>
          <p className="text-4xl font-bold text-foreground">
            ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Daily Performance</p>
            <p className={`font-medium ${dailyPerformance.positive ? "text-green-600" : "text-red-600"}`}>
              {dailyPerformance.change} ({dailyPerformance.percent})
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Yearly Performance</p>
            <p className={`font-medium ${yearlyPerformance.positive ? "text-green-600" : "text-red-600"}`}>
              {yearlyPerformance.change} ({yearlyPerformance.percent})
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2">
            {['1D', '1W', '1M', '1Y', 'All'].map((range) => (
                <Button key={range} variant={range === '1Y' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7 px-2" disabled>
                    {range}
                </Button>
            ))}
        </div>

        <div>
          <h4 className="text-md font-semibold text-foreground mb-2">Asset Allocation (Mock)</h4>
           <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-[200px]"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={mockAssetAllocationData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        strokeWidth={2}
                    >
                        {mockAssetAllocationData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke={entry.fill} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {mockAssetAllocationData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        {item.name} ({item.value}%)
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
       <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
        Performance data and asset allocation are illustrative.
      </CardFooter>
    </Card>
  );
}
