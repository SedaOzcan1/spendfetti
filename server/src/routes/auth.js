import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import {
  changePassword,
  changePasswordSchema,
  login,
  loginSchema,
  logout,
  me,
  register,
  registerSchema,
  updateMe,
  updateMeSchema,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/register', credentialsLimiter, validate(registerSchema), register);
router.post('/login', credentialsLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validate(updateMeSchema), updateMe);
router.put(
  '/password',
  requireAuth,
  credentialsLimiter,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
