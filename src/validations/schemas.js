import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  description: z.string().trim().optional(),
  price: z.number({ required_error: 'Price is required' }).nonnegative('Price cannot be negative'),
  stock: z.number({ required_error: 'Stock is required' }).int('Stock must be an integer').nonnegative('Stock cannot be negative'),
  category: z.string().trim().optional(),
  image: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be at least 1'),
});

export const paymentOrderSchema = z.object({
  cartId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Cart ID'),
  shippingAddress: z.union([
    z.string().trim().min(1, 'Shipping address is required'),
    z.record(z.any()).refine((obj) => Object.keys(obj).length > 0, {
      message: 'Shipping address object cannot be empty',
    }),
  ]),
});
