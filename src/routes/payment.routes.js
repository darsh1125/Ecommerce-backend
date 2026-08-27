import { Router } from 'express';
import { handleCreatePayPalOrder } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/paypal/create-order', protect, handleCreatePayPalOrder);

export default router;
