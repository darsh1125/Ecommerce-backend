import mongoose from 'mongoose';
import { calculateCartTotal } from '../services/cart.service.js';
import { getPayPalAccessToken, createPayPalOrder, capturePayPalPayment } from '../services/paypal.service.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

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
    const cartItems = totalResult.cart?.items || [];
    const orderItems = cartItems.map((item) => ({
      product: item.product?._id || item.product,
      quantity: item.quantity,
      price: item.product?.price || 0,
    }));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paypalOrderId: paypalOrder.id,
      paymentStatus: 'pending',
      cart: cartId,
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

    // Find Order in DB
    const order = await Order.findOne({ paypalOrderId: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been completed',
      });
    }

    // Get PayPal Access Token
    const paypalToken = await getPayPalAccessToken();

    // Capture the payment via PayPal API
    const captureData = await capturePayPalPayment(paypalToken, orderId);

    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    if (captureData.status === 'COMPLETED') {
      // Use a database session transaction to ensure consistency
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update Order Status
        order.paymentStatus = 'completed';
        order.paypalCaptureId = captureId;
        await order.save({ session });

        // Deduct Stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } },
            { session, new: true, runValidators: true }
          );
        }

        // Set Cart status to 'ordered'
        await Cart.findByIdAndUpdate(
          order.cart,
          { status: 'ordered' },
          { session }
        );

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }

      return res.status(200).json({
        success: true,
        message: 'PayPal payment captured successfully, stock deducted, and cart status updated',
        captureData,
        orderId: order._id,
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: `Payment capture failed with PayPal status: ${captureData.status}`,
        captureData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
