
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
export interface BudgetCategory { // Represents user-defined variable expense categories
  id: string;
  name: string;
  budgetedAmount: number; // Default monthly budgeted amount
  userId: string;
  createdAt: Date;
}

// Financial Goals Types
export const goalIconKeys = ['default', 'home', 'car', 'plane', 'briefcase', 'graduation-cap', 'gift', 'piggy-bank', 'trending-up', 'shield-check'] as const;
export type GoalIconKey = typeof goalIconKeys[number];

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  icon: GoalIconKey;
  userId: string;
  createdAt: Date;
}

export interface FinancialGoalWithContribution extends FinancialGoal {
  monthlyContribution: number;
  monthsRemaining: number;
}

// Budget Forecast Types
export interface MonthlyForecastVariableExpense {
  id: string; // BudgetCategory id
  name: string;
  // baseBudgetedAmount: number; // The default from BudgetCategory
  monthSpecificAmount: number; // Editable amount for this specific month, initialized with baseBudgetedAmount
}

export interface MonthlyForecastGoalContribution {
  id: string; // FinancialGoal id
  name: string;
  // baseProjectedContribution: number; // The default calculated contribution
  monthSpecificContribution: number; // Editable amount for this specific month, initialized with baseProjectedContribution
}

export interface MonthlyForecast {
  month: Date; // First day of the month
  monthLabel: string; // e.g., "January 2024"
  totalIncome: number;
  totalFixedExpenses: number; // Original fixed expenses (RecurringItem type 'fixed-expense')
  totalSubscriptions: number; // Original subscriptions (RecurringItem type 'subscription')
  totalDebtMinimumPayments: number; // Minimum payments from DebtAccount
  
  // These will store the sum of month-specific amounts for display
  // The editable versions will be lists within the card.
  totalVariableExpenses: number; // Sum of monthSpecificAmount for all variable categories
  totalGoalContributions: number; // Sum of monthSpecificContribution for all goals

  // Detailed items for potential editing (editing not in Phase 1)
  variableExpenses: MonthlyForecastVariableExpense[];
  goalContributions: MonthlyForecastGoalContribution[];
  // Potentially add debtPayments array here later for additional payments.

  remainingToBudget: number;
  isBalanced: boolean;
}
