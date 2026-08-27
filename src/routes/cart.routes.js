import { Router } from 'express';
import {
  createCart,
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from '../controllers/cart.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { cartItemSchema, updateCartItemSchema } from '../validations/schemas.js';

const router = Router();

router.post('/', createCart);
router.get('/:cartId', getCart);
router.post('/:cartId/items', validate(cartItemSchema), addItemToCart);
router.patch('/:cartId/items/:productId', validate(updateCartItemSchema), updateItemQuantity);
router.delete('/:cartId/items/:productId', removeItemFromCart);

export default router;
