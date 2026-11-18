import { colors } from '../../theme/colors.js';

/** Progress color: coral when close to / over the limit, else the category color. */
export function budgetColor(budget) {
  if (budget.status !== 'ok') return colors.coral;
  const categoryColor = budget.category?.color;
  // Very light category colors don't read well as a bar
  return !categoryColor || categoryColor === colors.stone ? colors.sageLight : categoryColor;
}
