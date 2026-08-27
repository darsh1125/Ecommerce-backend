import { Router } from 'express';
import { handleCreatePayPalOrder, handleCapturePayPalPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/paypal/create-order', protect, handleCreatePayPalOrder);
router.post('/paypal/:orderId/capture', protect, handleCapturePayPalPayment);

export default router;
