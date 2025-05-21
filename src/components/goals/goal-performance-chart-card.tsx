
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useState, useEffect } from "react";
import type { GoalPerformanceDataPoint } from "@/types";

const mockPerformanceData: GoalPerformanceDataPoint[] = [
  { month: "January", saving: 1200 },
  { month: "February", saving: 1800 },
  { month: "March", saving: 800 },
  { month: "April", saving: 3500 },
  { month: "May", saving: 2800 },
  { month: "June", saving: 4000 },
];

const chartConfig = {
  saving: {
    label: "Saving",
    color: "hsl(var(--chart-1))",
  },
};

export function GoalPerformanceChartCard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Goal Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  const activeDotData = mockPerformanceData.find(d => d.month === "April");

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-lg font-semibold">Goal Performance</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue="emergency-fund" disabled>
            <SelectTrigger className="w-auto h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Select Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency-fund">Emergency Fund</SelectItem>
              <SelectItem value="vacation">Vacation</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="last-6-months" disabled>
            <SelectTrigger className="w-auto h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={mockPerformanceData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickFormatter={(value) => `$${value/1000}k`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <Tooltip 
                content={
                  <ChartTooltipContent 
                    indicator="line" 
                    labelFormatter={(value, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload.month === "April") {
                        return `April 2025`; // Matching screenshot
                      }
                      return value;
                    }}
                  />
                } 
              />
              <Line
                type="monotone"
                dataKey="saving"
                stroke="var(--color-saving)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "var(--color-saving)",
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))"
                }}
              />
              {activeDotData && (
                <ReferenceDot
                    x="April"
                    y={activeDotData.saving}
                    r={6}
                    fill="var(--color-saving)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    ifOverflow="visible"
                    label={{
                      value: `$${activeDotData.saving.toLocaleString()}`,
                      position: "top",
                      dy: -10,
                      fill: "hsl(var(--foreground))",
                      fontSize: 12,
                      fontWeight: 500
                    }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
