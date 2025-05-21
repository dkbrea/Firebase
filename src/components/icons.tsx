import type { SVGProps } from "react";
import { Landmark, LayoutDashboard, ListPlus, CreditCard, Users, LogOut, Settings, Wallet, PiggyBank, Library, ShieldCheck, MoreHorizontal, Edit, Trash, DollarSign, HelpCircle, CircleDollarSign } from 'lucide-react';

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
  Accounts: PiggyBank, // Changed from Library for more financial context
  Auth: Users,
  Logout: LogOut,
  Settings: Settings,
  Bank: Landmark,
  Wallet: Wallet,
  Primary: ShieldCheck,
  Edit: Edit,
  Delete: Trash,
  DollarSign: DollarSign,
  AccountTypeChecking: Landmark,
  AccountTypeSavings: PiggyBank,
  AccountTypeCreditCard: CreditCard,
  AccountTypeOther: HelpCircle,
  MoreHorizontal: MoreHorizontal,
};

export default Icons;
