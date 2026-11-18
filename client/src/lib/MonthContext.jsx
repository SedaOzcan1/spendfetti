import { createContext, useContext, useMemo, useState } from 'react';
import { currentMonthKey } from './month.js';

const MonthContext = createContext(null);

export function MonthProvider({ children, initialMonth = currentMonthKey() }) {
  const [month, setMonth] = useState(initialMonth);
  const value = useMemo(() => ({ month, setMonth }), [month]);
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives with its provider
export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) throw new Error('useMonth must be used inside <MonthProvider>');
  return context;
}
