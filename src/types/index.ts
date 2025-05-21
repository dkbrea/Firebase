export interface User {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string; // Assuming categories are user-specific
  createdAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number; // Positive for income, negative for expense
  categoryId?: string | null; // Optional link to a category
  userId: string;
  source?: string; // e.g., "Bank A", "Plaid Import"
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
}
