import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import profileRoutes from './profile.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/chats', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);

export default router;
