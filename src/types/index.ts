
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

export type AccountType = 'checking' | 'savings' | 'credit card' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  last4?: string;
  balance: number;
  isPrimary: boolean;
  userId: string;
  createdAt: Date;
}

// Debt Management Types
export type DebtAccountType = 'credit-card' | 'student-loan' | 'personal-loan' | 'mortgage' | 'auto-loan' | 'other';

export const debtAccountTypes: DebtAccountType[] = ['credit-card', 'student-loan', 'personal-loan', 'mortgage', 'auto-loan', 'other'];

export type PaymentFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'annually' | 'other';
export const paymentFrequencies: PaymentFrequency[] = ['monthly', 'bi-weekly', 'weekly', 'annually', 'other'];


export interface DebtAccount {
  id: string;
  name: string;
  type: DebtAccountType;
  balance: number;
  apr: number; // Annual Percentage Rate, e.g., 19.9 for 19.9%
  minimumPayment: number;
  paymentDayOfMonth: number; // e.g., 1, 15, 31
  paymentFrequency: PaymentFrequency;
  userId: string;
  createdAt: Date;
}

export type DebtPayoffStrategy = 'snowball' | 'avalanche';

export interface DebtPlan {
  debtAccounts: DebtAccount[];
  strategy: DebtPayoffStrategy | null;
  userId: string;
}

// Recurring Items Types
export const recurringItemTypes = ['income', 'subscription', 'fixed-expense'] as const;
export type RecurringItemType = typeof recurringItemTypes[number];

export const recurringFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'semi-monthly', 'quarterly', 'yearly'] as const;
export type RecurringFrequency = typeof recurringFrequencies[number];

export const predefinedRecurringCategories = [
  { value: 'housing', label: 'Housing (Rent/Mortgage)' },
  { value: 'utilities', label: 'Utilities (Energy, Water, Internet, Phone)' },
  { value: 'transportation', label: 'Transportation (Car, Gas, Public Transit)' },
  { value: 'insurance', label: 'Insurance (Health, Auto, Life)' },
  { value: 'food-groceries', label: 'Groceries' }, // Note: Typically transactional, but some fixed like meal kits
  { value: 'health-wellness', label: 'Health & Wellness (Gym, Meds)' },
  { value: 'childcare-education', label: 'Childcare & Education' },
  { value: 'subscriptions-media', label: 'Subscriptions & Media' },
  { value: 'software-productivity', label: 'Software & Productivity Tools' },
  { value: 'personal-care', label: 'Personal Care Subscriptions' },
  { value: 'loan-payments', label: 'Loan Payments (Non-debt plan)' }, // For fixed loans not in debt strategy
  { value: 'savings-investments', label: 'Savings & Investments (Fixed Transfer)' },
  { value: 'other-fixed', label: 'Other Fixed Expense' },
] as const;
export type PredefinedRecurringCategoryValue = typeof predefinedRecurringCategories[number]['value'];


export interface RecurringItem {
  id: string;
  name: string;
  type: RecurringItemType;
  amount: number; // Always positive, type determines inflow/outflow
  frequency: RecurringFrequency;
  startDate?: Date | null; // Used if type is 'income' or 'fixed-expense' AND frequency is NOT 'semi-monthly'
  lastRenewalDate?: Date | null; // Used if type IS 'subscription'
  semiMonthlyFirstPayDate?: Date | null; // Used if frequency IS 'semi-monthly'
  semiMonthlySecondPayDate?: Date | null; // Used if frequency IS 'semi-monthly'
  endDate?: Date | null; // Only applicable for 'subscription' type
  notes?: string;
  userId: string;
  createdAt: Date;
  categoryId?: PredefinedRecurringCategoryValue | null; // Category for subscriptions/fixed-expenses
}

// Unified type for Recurring List
export type UnifiedListItemType = RecurringItemType | 'debt-payment';

export interface UnifiedRecurringListItem {
  id: string; // Original ID of the item or debt
  name: string;
  itemDisplayType: UnifiedListItemType; // For display (icon, color, type label)
  amount: number; // Raw amount, always positive
  frequency: RecurringFrequency | PaymentFrequency; // Union of possible frequencies
  nextOccurrenceDate: Date;
  status: 'Ended' | 'Today' | 'Upcoming';
  isDebt: boolean;
  endDate?: Date | null; // From RecurringItem
  semiMonthlyFirstPayDate?: Date | null; // From RecurringItem, if applicable
  semiMonthlySecondPayDate?: Date | null; // From RecurringItem, if applicable
  notes?: string;
  source: 'recurring' | 'debt'; // Origin of the item
  categoryId?: PredefinedRecurringCategoryValue | null; // From RecurringItem
}

// Budgeting Types
export interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
  userId: string; // Assuming categories are user-specific
  createdAt: Date;
}
