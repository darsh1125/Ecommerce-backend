import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc Create a new cart
// @route POST /api/carts
// @access Public
export const createCart = async (req, res) => {
  try {
    const cart = new Cart({
      items: [],
      status: 'active',
    });
    await cart.save();
    return res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      cart,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get cart by ID
// @route GET /api/carts/:cartId
// @access Public
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cartId).populate('items.product');
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }
    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid cart ID or fetch failed',
    });
  }
};

// @desc Add item to cart
// @route POST /api/carts/:cartId/items
// @access Public
export const addItemToCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productId, quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    // Find cart
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive',
      });
    }

    // Check if product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Product exists in cart, increment quantity
      const newQty = cart.items[itemIndex].quantity + quantity;

      // Validate stock
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available.`,
        });
      }

      cart.items[itemIndex].quantity = newQty;
    } else {
      // Validate stock
      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available.`,
        });
      }

      // Add new item
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    // Fetch and populate updated cart
    const updatedCart = await Cart.findById(cartId).populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Update item quantity in cart
// @route PATCH /api/carts/:cartId/items/:productId
// @access Public
export const updateItemQuantity = async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find product to validate stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} items available.`,
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart',
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cartId).populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Cart item quantity updated',
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Remove item from cart
// @route DELETE /api/carts/:cartId/items/:productId
// @access Public
export const removeItemFromCart = async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const updatedCart = await Cart.findById(cartId).populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
