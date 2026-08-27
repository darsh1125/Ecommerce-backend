import { calculateCartTotal } from '../services/cart.service.js';
import { getPayPalAccessToken, createPayPalOrder, capturePayPalPayment } from '../services/paypal.service.js';
import Order from '../models/Order.js';

// @desc Create a PayPal order for checkout and persist order in DB
// @route POST /api/payments/paypal/create-order
// @access Private (Customer)
export const handleCreatePayPalOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
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

    // Persist pending Order in MongoDB
    const orderItems = totalResult.cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paypalOrderId: paypalOrder.id,
      paymentStatus: 'pending',
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: 'PayPal order created and persisted successfully',
      paypalOrderId: paypalOrder.id,
      orderId: order._id,
      paypalOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Capture PayPal payment
// @route POST /api/payments/paypal/:orderId/capture
// @access Private (Customer)
export const handleCapturePayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'PayPal Order ID is required',
      });
    }

    // Get PayPal Access Token
    const paypalToken = await getPayPalAccessToken();

    // Capture the payment via PayPal API
    const captureData = await capturePayPalPayment(paypalToken, orderId);

    return res.status(200).json({
      success: true,
      message: 'PayPal payment captured successfully',
      captureData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
