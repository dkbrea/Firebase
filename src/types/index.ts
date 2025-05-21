
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

export type TransactionType = 'income' | 'expense' | 'transfer'; // Overall flow direction

export const transactionDetailedTypes = ['income', 'variable-expense', 'fixed-expense', 'subscription', 'debt-payment', 'goal-contribution'] as const;
export type TransactionDetailedType = typeof transactionDetailedTypes[number];


export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number; // Positive for income, negative for expense (persisted this way)
  type: TransactionType; // Main type: 'income' or 'expense', derived from detailedType
  detailedType?: TransactionDetailedType; // Specific user selection
  categoryId?: string | null; // For variable-expenses primarily
  accountId: string; // Link to an asset Account (source for expenses/transfers, destination for income)
  toAccountId?: string | null; // Destination account for transfers (like goal contributions)
  sourceId?: string; // ID of the linked RecurringItem, DebtAccount, or FinancialGoal
  userId: string;
  source?: string; // e.g., "Manual Entry"
  notes?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
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
  { value: 'food-groceries', label: 'Groceries' },
  { value: 'health-wellness', label: 'Health & Wellness (Gym, Meds)' },
  { value: 'childcare-education', label: 'Childcare & Education' },
  { value: 'subscriptions-media', label: 'Subscriptions & Media' },
  { value: 'software-productivity', label: 'Software & Productivity Tools' },
  { value: 'personal-care', label: 'Personal Care Subscriptions' },
  { value: 'loan-payments', label: 'Loan Payments (Non-debt plan)' },
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
  startDate?: Date | null; 
  lastRenewalDate?: Date | null; 
  semiMonthlyFirstPayDate?: Date | null; 
  semiMonthlySecondPayDate?: Date | null; 
  endDate?: Date | null; 
  notes?: string;
  userId: string;
  createdAt: Date;
  categoryId?: PredefinedRecurringCategoryValue | null; 
}

// Unified type for Recurring List
export type UnifiedListItemType = RecurringItemType | 'debt-payment';

export interface UnifiedRecurringListItem {
  id: string; 
  name: string;
  itemDisplayType: UnifiedListItemType; 
  amount: number; 
  frequency: RecurringFrequency | PaymentFrequency; 
  nextOccurrenceDate: Date;
  status: 'Ended' | 'Today' | 'Upcoming';
  isDebt: boolean;
  endDate?: Date | null; 
  semiMonthlyFirstPayDate?: Date | null; 
  semiMonthlySecondPayDate?: Date | null; 
  notes?: string;
  source: 'recurring' | 'debt'; 
  categoryId?: PredefinedRecurringCategoryValue | null; 
}

// Budgeting Types
export interface BudgetCategory { 
  id: string;
  name: string;
  budgetedAmount: number; 
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

// Investment Types
export const investmentAccountTypes = ['brokerage', 'ira', '401k', 'crypto', 'other'] as const;
export type InvestmentAccountType = typeof investmentAccountTypes[number];

export interface InvestmentAccount {
  id: string;
  name: string;
  type: InvestmentAccountType;
  institution?: string;
  currentValue: number;
  userId: string;
  createdAt: Date;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;
  shares: number;
  price: number;
  changePercent: number; // e.g., 1.25 for +1.25%, -0.5 for -0.5%
  logoUrl?: string; // Optional: URL for a company/crypto logo
  userId: string;
  accountId?: string; // Optional: link to an InvestmentAccount
}


// Budget Forecast Types 
export interface MonthlyForecastIncomeItem {
  id: string; 
  name: string;
  totalAmountInMonth: number; 
}
export interface MonthlyForecastFixedExpenseItem {
  id: string; 
  name: string;
  totalAmountInMonth: number; 
  categoryId?: PredefinedRecurringCategoryValue | null;
}
export interface MonthlyForecastSubscriptionItem {
  id: string; 
  name: string;
  totalAmountInMonth: number; 
  categoryId?: PredefinedRecurringCategoryValue | null;
}
export interface MonthlyForecastDebtPaymentItem {
  id: string; 
  name: string;
  totalAmountInMonth: number; // This is the minimum payment
  debtType: DebtAccountType;
  additionalPayment?: number; // User-entered additional payment for the forecast month
}


export interface MonthlyForecastVariableExpense {
  id: string; 
  name: string;
  monthSpecificAmount: number; // User-editable amount for the forecast month
}

export interface MonthlyForecastGoalContribution {
  id: string; 
  name: string;
  monthSpecificContribution: number; // User-editable amount for the forecast month
}

export interface MonthlyForecast {
  month: Date; 
  monthLabel: string; 
  
  incomeItems: MonthlyForecastIncomeItem[];
  fixedExpenseItems: MonthlyForecastFixedExpenseItem[];
  subscriptionItems: MonthlyForecastSubscriptionItem[];
  debtPaymentItems: MonthlyForecastDebtPaymentItem[];
  
  totalIncome: number;
  totalFixedExpenses: number; 
  totalSubscriptions: number; 
  totalDebtMinimumPayments: number; 
  
  variableExpenses: MonthlyForecastVariableExpense[];
  totalVariableExpenses: number; 
  
  goalContributions: MonthlyForecastGoalContribution[];
  totalGoalContributions: number; 

  remainingToBudget: number;
  isBalanced: boolean;
}
