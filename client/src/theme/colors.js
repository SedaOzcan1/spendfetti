// Single source of truth for brand colors (Tailwind tokens in index.css and
// confetti effects mirror these values).
export const colors = {
  page: '#f8f7f3',
  sidebar: '#f0f1e9',
  ink: '#242c29',
  muted: '#757b74',
  line: '#e8e9e1',
  forest: '#253d33',
  coral: '#d95138',
  sage: '#526a4b',
  sageLight: '#7e926d',
  mint: '#e8eedc',
  peach: '#ebb39e',
  tan: '#d9ad78',
  lavender: '#a6a2c0',
  stone: '#d5d9cc',
  income: '#3f6b52',
};

export const chartColors = {
  income: colors.sage,
  expense: colors.peach,
  expenseCurrent: colors.coral,
  grid: colors.line,
  tick: colors.muted,
};

export const confettiColors = [
  colors.coral,
  colors.sage,
  colors.tan,
  colors.lavender,
  colors.peach,
];
