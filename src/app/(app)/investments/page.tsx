
import { InvestmentManager } from "@/components/investments/investment-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investments - Pocket Ledger",
  description: "Track and manage your investment accounts and portfolio value.",
};

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Investments</h1>
      <p className="text-muted-foreground">
        Monitor your investment portfolio, add accounts, and view your overall market value.
      </p>
      <InvestmentManager />
    </div>
  );
}
