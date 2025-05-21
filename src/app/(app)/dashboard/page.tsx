import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Users, TrendingUp } from "lucide-react";
import { RecurringList } from "@/components/recurring/recurring-list";

export default function DashboardPage() {
  // TODO: Fetch and filter upcoming recurring items
  const upcomingItems = []; // Placeholder for actual data

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      {/* First row: Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spending Overview</CardTitle>
            <select className="text-xs border rounded p-1">
              <option>Month</option>
              <option>Year</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,432.55 <span className="text-green-500 text-sm ml-1">8%</span></div>
            <p className="text-xs text-muted-foreground">from $50,000.00</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Food</span>
                <span className="ml-auto text-sm font-semibold">$6,010.31</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Shopping</span>
                <span className="ml-auto text-sm font-semibold">$2,345.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments (7-Day)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* TODO: Replace with actual 7-day investment performance data */}
            <div className="text-2xl font-bold text-green-500">+2.5%</div>
            <p className="text-xs text-muted-foreground">+$1,234.56 in the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Statistics Overview and Upcoming Expenses */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Statistics Overview */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Statistics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for the updated chart - Assuming ExpenseChart or similar could go here */}
              <ExpenseChart /> 
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Expenses */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Expenses</CardTitle>
              {/* Optional: Add a description if needed */}
              {/* <CardDescription>You have {upcomingItems.length} upcoming payments.</CardDescription> */}
            </CardHeader>
            <CardContent>
              {upcomingItems.length > 0 ? (
                <RecurringList items={upcomingItems} />
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming payments.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
