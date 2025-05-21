
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons"; // Corrected import

export function IncomeAnalysisReport() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
            <Icons.BarChartBig className="mr-3 h-6 w-6 text-primary" />
            Income Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Detailed income analysis report coming soon. This section will break down your income sources over time.
        </p>
        {/* Placeholder for future chart or data */}
        <div className="mt-6 h-60 flex items-center justify-center border-2 border-dashed border-border rounded-md bg-muted/30">
            <p className="text-muted-foreground">Chart Placeholder</p>
        </div>
      </CardContent>
    </Card>
  );
}
