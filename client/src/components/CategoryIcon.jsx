import {
  Briefcase,
  Bus,
  Coffee,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Lightbulb,
  Package,
  ShoppingBag,
  ShoppingBasket,
  Tag,
  Ticket,
  Wallet,
} from 'lucide-react';

// Icon + tint per built-in category (by slug)
const BUILT_IN = {
  housing: { Icon: Home, bg: '#e8eedc', fg: '#526a4b' },
  groceries: { Icon: ShoppingBasket, bg: '#f4ede1', fg: '#a0703a' },
  'dining-out': { Icon: Coffee, bg: '#f9ebe5', fg: '#d95138' },
  transport: { Icon: Bus, bg: '#ecebf3', fg: '#6e6a93' },
  bills: { Icon: Lightbulb, bg: '#f4ede1', fg: '#a0703a' },
  health: { Icon: HeartPulse, bg: '#f9ebe5', fg: '#d95138' },
  shopping: { Icon: ShoppingBag, bg: '#f9ebe5', fg: '#b4643f' },
  education: { Icon: GraduationCap, bg: '#ecebf3', fg: '#6e6a93' },
  'fun-activities': { Icon: Ticket, bg: '#e8eedc', fg: '#253d33' },
  'other-expense': { Icon: Package, bg: '#f0f1e9', fg: '#757b74' },
  salary: { Icon: Briefcase, bg: '#e8eedc', fg: '#3f6b52' },
  freelance: { Icon: Laptop, bg: '#e8eedc', fg: '#3f6b52' },
  gifts: { Icon: Gift, bg: '#e8eedc', fg: '#3f6b52' },
  'other-income': { Icon: Wallet, bg: '#e8eedc', fg: '#3f6b52' },
};

export function CategoryIcon({ category, size = 'md' }) {
  const style = BUILT_IN[category?.slug] ?? {
    Icon: Tag,
    bg: `${category?.color ?? '#757b74'}1f`,
    fg: category?.color ?? '#757b74',
  };
  const { Icon } = style;
  const box = size === 'sm' ? 'size-10 rounded-lg' : 'size-12 rounded-xl';

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${box}`}
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  );
}
