
import { GoalManager } from "@/components/goals/goal-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Goals - Pocket Ledger",
  description: "Set, track, and achieve your financial goals.",
};

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Goals</h1>
      <p className="text-muted-foreground">
        Define your financial aspirations, set target amounts and dates, 
        and let us help you project your monthly contributions.
      </p>
      <GoalManager />
    </div>
  );
}
