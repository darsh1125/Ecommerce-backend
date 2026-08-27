import { calculateCartTotal } from '../services/cart.service.js';
import { getPayPalAccessToken, createPayPalOrder } from '../services/paypal.service.js';

// @desc Create a PayPal order for checkout
// @route POST /api/payments/paypal/create-order
// @access Private (Customer)
export const handleCreatePayPalOrder = async (req, res) => {
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    // Calculate total securely on the server-side
    // This function automatically validates stock and product existence
    let totalResult;
    try {
      totalResult = await calculateCartTotal(cartId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const { totalAmount } = totalResult;

    // Get PayPal Access Token
    const paypalToken = await getPayPalAccessToken();

    // Create PayPal Checkout Order
    const paypalOrder = await createPayPalOrder(paypalToken, totalAmount);

    return res.status(201).json({
      success: true,
      message: 'PayPal order created successfully',
      paypalOrderId: paypalOrder.id,
      paypalOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
