import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/change-password', changePassword);
router.delete('/', deleteAccount);

export default router;
