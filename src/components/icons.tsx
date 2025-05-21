
import type { SVGProps } from "react";
import { Landmark, LayoutDashboard, ListPlus, CreditCard, Users, LogOut, Settings, Wallet, PiggyBank, Library, ShieldCheck, MoreHorizontal, Edit, Trash, DollarSign, HelpCircle, CircleDollarSign, Target, TrendingDown, TrendingUp, ReceiptText, CalendarClock, ClipboardList, Flag, Home, Car, Plane, Briefcase, GraduationCap, Gift, LineChart, Coins, BarChart3, RefreshCw, Settings2, Clock, BarChartBig, Info, PieChart, Download, CalendarDays, History, FileText as FileTextIcon } from 'lucide-react';

export const Icons = {
  Logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
      <line x1="2" y1="19" x2="22" y2="19"></line>
      <line x1="4" y1="10" x2="6" y2="10"></line>
    </svg>
  ),
  Dashboard: LayoutDashboard,
  Categories: ListPlus,
  Transactions: CreditCard,
  Accounts: PiggyBank,
  Debts: Target,
  Recurring: CalendarClock,
  Budget: ClipboardList, 
  Goals: Flag,
  Investments: TrendingUp,
  Reports: BarChart3, // Added for Reports
  Auth: Users,
  Logout: LogOut,
  Settings: Settings,
  Bank: Landmark,
  Wallet: Wallet,
  Primary: ShieldCheck,
  Edit: Edit,
  Delete: Trash,
  DollarSign: DollarSign,
  HelpCircle: HelpCircle,
  AccountTypeChecking: Landmark,
  AccountTypeSavings: PiggyBank,
  AccountTypeCreditCard: CreditCard,
  AccountTypeOther: HelpCircle,
  MoreHorizontal: MoreHorizontal,
  DebtTypeCreditCard: CreditCard,
  DebtTypeStudentLoan: Library,
  DebtTypePersonalLoan: DollarSign,
  DebtTypeMortgage: Landmark,
  DebtTypeAutoLoan: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  DebtTypeOther: HelpCircle,
  TrendingDown: TrendingDown,
  // TrendingUp is already defined
  ReceiptText: ReceiptText,
  // Goal specific icons
  GoalDefault: CircleDollarSign, 
  Home: Home,
  Car: Car,
  Plane: Plane,
  Briefcase: Briefcase,
  GraduationCap: GraduationCap,
  Gift: Gift,
  // PiggyBank is already defined
  // ShieldCheck is already defined
  // Investment Account Type Icons
  InvestmentBrokerage: LineChart,
  InvestmentRetirement: BarChartBig, 
  InvestmentCrypto: Coins,
  InvestmentOther: DollarSign, 
  RefreshCw: RefreshCw,
  Settings2: Settings2,
  Clock: Clock, // Used in InvestmentManager and Report tabs
  BarChartBig: BarChartBig, // Ensuring this is explicitly here
  Info: Info,
  // Report specific icons
  PieChart: PieChart, // For Spending by Category tab icon (alternative)
  Download: Download, // For Export button
  CalendarDays: CalendarDays, // For "Last 6 months" button
  History: History, // For Spending by Category tab icon (clock-like)
  FileTextIcon: FileTextIcon, // For Tax Report tab icon
  LineChartIcon: LineChart, // For Spending Trends tab icon
};

export default Icons;
