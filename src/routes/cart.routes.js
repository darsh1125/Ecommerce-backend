import { Router } from 'express';
import {
  createCart,
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from '../controllers/cart.controller.js';

const router = Router();

router.post('/', createCart);
router.get('/:cartId', getCart);
router.post('/:cartId/items', addItemToCart);
router.patch('/:cartId/items/:productId', updateItemQuantity);
router.delete('/:cartId/items/:productId', removeItemFromCart);

export default router;
