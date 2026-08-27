import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { admin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { productSchema } from '../validations/schemas.js';

const router = Router();

router.route('/')
  .get(getProducts)
  .post(protect, admin, validate(productSchema), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, validate(productSchema.partial()), updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
