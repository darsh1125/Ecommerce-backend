import Cart from '../models/Cart.js';

/**
 * Calculates the cart total amount securely on the server side.
 * Validates stock and reads prices directly from the database.
 * @param {string} cartId - The cart ID.
 * @returns {Promise<{ cart: Object, totalAmount: number }>}
 */
export const calculateCartTotal = async (cartId) => {
  const cart = await Cart.findById(cartId).populate('items.product');
  if (!cart) {
    throw new Error('Cart not found');
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active');
  }

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  let totalAmount = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      throw new Error(`Product "${product ? product.name : 'Unknown'}" is no longer available`);
    }

    if (item.quantity > product.stock) {
      throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
    }

    totalAmount += product.price * item.quantity;
  }

  // Round to 2 decimal places to prevent float precision issues
  totalAmount = Math.round(totalAmount * 100) / 100;

  return {
    cart,
    totalAmount,
  };
};
