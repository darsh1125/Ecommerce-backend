/**
 * Fetches an access token from PayPal Sandbox using client_credentials grant type.
 * Uses Basic Auth header and native global fetch.
 * @returns {Promise<string>} - The access token.
 */
export const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or client secret is not configured');
  }

  // Base64 encode the PayPal credentials
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || `PayPal Auth failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('PayPal Access Token Generation Error:', error.message);
    throw new Error(`PayPal Authentication failed: ${error.message}`);
  }
};

/**
 * Creates a PayPal order using the calculated amount.
 * @param {string} accessToken - The PayPal access token.
 * @param {number} amount - The calculated total amount.
 * @returns {Promise<Object>} - The PayPal order details.
 */
export const createPayPalOrder = async (accessToken, amount) => {
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `PayPal order creation failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal Order Creation Error:', error.message);
    throw new Error(`PayPal Order Creation failed: ${error.message}`);
  }
};

/**
 * Captures an approved PayPal order.
 * @param {string} accessToken - The PayPal access token.
 * @param {string} orderId - The PayPal order ID.
 * @returns {Promise<Object>} - The capture details.
 */
export const capturePayPalPayment = async (accessToken, orderId) => {
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `PayPal payment capture failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal Payment Capture Error:', error.message);
    throw new Error(`PayPal Payment Capture failed: ${error.message}`);
  }
};
