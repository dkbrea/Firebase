import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
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
            <CardTitle className="text-sm font-medium">Total Expenses (Month)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,191.10</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">+2 since last month</p>
          </CardContent>
        </Card>
      </div>

      <ExpenseChart />

      {/* Placeholder for recent transactions or other dashboard widgets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A quick look at your latest transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to show (placeholder).</p>
        </CardContent>
      </Card>
    </div>
  );
}
