import { Router } from 'express';
import { getChatHistory, sendMessage, clearChat } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { chatSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/history', getChatHistory);
router.post('/message', validateRequest(chatSchema), sendMessage);
router.delete('/clear', clearChat);

export default router;
