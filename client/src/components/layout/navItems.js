import { ArrowLeftRight, LayoutGrid, Ticket, Wallet } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', shortLabel: 'Overview', Icon: LayoutGrid, end: true },
  { to: '/transactions', label: 'Transactions', shortLabel: 'Transactions', Icon: ArrowLeftRight },
  { to: '/budgets', label: 'My budgets', shortLabel: 'Budgets', Icon: Wallet },
  { to: '/activities', label: 'Activities', shortLabel: 'Explore', Icon: Ticket, dot: true },
];
