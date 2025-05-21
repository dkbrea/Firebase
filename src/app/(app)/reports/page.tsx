
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons"; // Corrected import
import { SpendingByCategoryReport } from "@/components/reports/spending-by-category-report";
import { IncomeAnalysisReport } from "@/components/reports/income-analysis-report";
import { SpendingTrendsReport } from "@/components/reports/spending-trends-report";
import { TaxReport } from "@/components/reports/tax-report";
import { NetWorthTrendReport } from "@/components/reports/net-worth-trend-report";
import { GoalProgressReport } from "@/components/reports/goal-progress-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export const metadata: Metadata = {
  title: "Reports - Pocket Ledger",
  description: "Visualize and analyze your financial data.",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Icons.CalendarDays className="mr-2 h-4 w-4" />
            Last 6 months
          </Button>
          <Button variant="outline" disabled>
            <Icons.Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="spending-by-category" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="spending-by-category" className="text-xs sm:text-sm">
            <Icons.History className="mr-2 h-4 w-4" /> Spending by Category
          </TabsTrigger>
          <TabsTrigger value="income-analysis" className="text-xs sm:text-sm">
            <Icons.BarChartBig className="mr-2 h-4 w-4" /> Income Analysis
          </TabsTrigger>
          <TabsTrigger value="spending-trends" className="text-xs sm:text-sm">
            <Icons.LineChartIcon className="mr-2 h-4 w-4" /> Spending Trends
          </TabsTrigger>
          <TabsTrigger value="tax-report" className="text-xs sm:text-sm">
            <Icons.FileTextIcon className="mr-2 h-4 w-4" /> Tax Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spending-by-category" className="mt-6">
          <SpendingByCategoryReport />
        </TabsContent>
        <TabsContent value="income-analysis" className="mt-6">
          <IncomeAnalysisReport />
        </TabsContent>
        <TabsContent value="spending-trends" className="mt-6">
          <SpendingTrendsReport />
        </TabsContent>
        <TabsContent value="tax-report" className="mt-6">
          <TaxReport />
        </TabsContent>
      </Tabs>

      {/* Creative Bottom Section */}
      <div className="grid gap-6 mt-8 md:grid-cols-1 lg:grid-cols-2">
        <NetWorthTrendReport />
        <GoalProgressReport />
      </div>
    </div>
  );
}
