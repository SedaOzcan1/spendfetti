import { HttpError } from '../lib/httpError.js';
import { Category } from '../models/index.js';

/** Categories visible to a user: built-in defaults plus their own. */
export const visibleCategoriesFilter = (userId) => ({ userId: { $in: [null, userId] } });

/** Loads a category the user may use, or throws 400. */
export async function getUsableCategory(userId, categoryId) {
  const category = await Category.findOne({ _id: categoryId, ...visibleCategoriesFilter(userId) });
  if (!category) throw HttpError.badRequest('Unknown category');
  return category;
}
