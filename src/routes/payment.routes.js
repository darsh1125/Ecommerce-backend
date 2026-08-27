import { Router } from 'express';
import { handleCreatePayPalOrder, handleCapturePayPalPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { paymentOrderSchema } from '../validations/schemas.js';

const router = Router();

router.post('/paypal/create-order', protect, validate(paymentOrderSchema), handleCreatePayPalOrder);
router.post('/paypal/:orderId/capture', protect, handleCapturePayPalPayment);

export default router;
