import { Router } from 'express';
import {
  upsertBudget,
  getBudgets,
  getBudgetProgress,
  deleteBudget,
} from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { budgetSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', validateRequest(budgetSchema), upsertBudget);
router.get('/progress', getBudgetProgress);
router.delete('/:id', deleteBudget);

export default router;
