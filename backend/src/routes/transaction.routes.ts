import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getDashboardSummary,
} from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { transactionSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.post('/', validateRequest(transactionSchema), createTransaction);
router.get('/summary', getDashboardSummary);
router.put('/:id', validateRequest(transactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
