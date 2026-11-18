import { useMonth } from '../../lib/MonthContext.jsx';
import { formatMonth, recentMonths } from '../../lib/month.js';
import { FilterSelect } from '../ui/Field.jsx';

export function MonthSelect({ className = 'w-48' }) {
  const { month, setMonth } = useMonth();
  const months = recentMonths(12);
  if (!months.includes(month)) months.unshift(month);

  return (
    <FilterSelect
      label="Month"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className={className}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonth(m)}
        </option>
      ))}
    </FilterSelect>
  );
}
