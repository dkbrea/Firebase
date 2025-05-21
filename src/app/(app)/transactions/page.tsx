import { TransactionManager } from "@/components/transactions/transaction-manager";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
      <TransactionManager />
    </div>
  );
}
