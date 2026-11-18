import { Router } from 'express';
import {
  createTransaction,
  createTransactionSchema,
  deleteTransaction,
  listTransactions,
  listTransactionsQuerySchema,
  updateTransaction,
  updateTransactionSchema,
} from '../controllers/transactionController.js';
import { idParamsSchema } from '../lib/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(listTransactionsQuerySchema, 'query'), listTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.put(
  '/:id',
  validate(idParamsSchema, 'params'),
  validate(updateTransactionSchema),
  updateTransaction,
);
router.delete('/:id', validate(idParamsSchema, 'params'), deleteTransaction);

export default router;
