// WhatsApp Messaging via Ultramsg (Platform-level)
// All messages sent from YOUR platform WhatsApp Business number

// SETUP: Add these to your .env.local file:
// VITE_ULTRAMSG_INSTANCE_ID=your_instance_id
// VITE_ULTRAMSG_TOKEN=your_token

const ULTRAMSG_INSTANCE_ID = import.meta.env.VITE_ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = import.meta.env.VITE_ULTRAMSG_TOKEN;

/**
 * Send WhatsApp message via Ultramsg API
 * @param {string} phoneNumber - Customer phone number (format: 27XXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<object>} Response from API
 */
export async function sendWhatsAppMessage(phoneNumber, message) {
  // Check if credentials are configured
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    console.warn('⚠️ Ultramsg credentials not configured. Message not sent.');
    console.log('Message would have been:', message);
    return { success: false, error: 'Credentials not configured' };
  }

  // Format phone number (remove spaces, dashes, + sign)
  const formattedPhone = phoneNumber.replace(/[\s\-+]/g, '');

  // Ensure it starts with country code (27 for South Africa)
  const finalPhone = formattedPhone.startsWith('27')
    ? formattedPhone
    : `27${formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone}`;

  // Ultramsg API endpoint
  const apiUrl = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

  try {
    // Ultramsg expects x-www-form-urlencoded, not JSON
    const payload = new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to: finalPhone,
      body: message,
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const data = await response.json();

    if (response.ok && (data.sent === 'true' || data.status === 'success')) {
      console.log('✅ WhatsApp message sent successfully to', finalPhone);
      return { success: true, data };
    } else {
      console.error('❌ Failed to send WhatsApp message:', { status: response.status, data });
      return { success: false, error: data.error || data.message || `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Order Confirmation message
 */
export async function sendOrderConfirmation(customerPhone, customerName, orderNumber, storeName, estimatedTime, totalAmount, storeSlug) {
  const storeUrl = storeSlug ? `https://${storeSlug}.mzansifoodconnect.app` : '';

  const message = `Hi ${customerName}! 👋

Your order from *${storeName}* has been confirmed! ✅

📦 Order #${orderNumber}
⏱️ Ready in: ${estimatedTime} minutes
💰 Total: R${totalAmount}

Thank you for your order! We'll notify you when it's ready for pickup.

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;

  return await sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send Order Ready message
 */
export async function sendOrderReady(customerPhone, customerName, orderNumber, storeName, storeSlug) {
  const storeUrl = storeSlug ? `https://${storeSlug}.mzansifoodconnect.app` : '';

  const message = `Hi ${customerName}! 🎉

Great news! Your order from *${storeName}* is ready for pickup! ✅

📦 Order #${orderNumber}
📍 Come collect at ${storeName}

See you soon! 😊

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;

  return await sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send Order Fetched (Thank you) message
 */
export async function sendOrderFetched(customerPhone, customerName, orderNumber, storeName, storeSlug) {
  const storeUrl = storeSlug ? `https://${storeSlug}.mzansifoodconnect.app` : '';

  const message = `Thank you for collecting your order, ${customerName}! 🙏

We hope you enjoy your meal from *${storeName}*! 🍽️

📦 Order #${orderNumber}

We'd love to see you again soon! ❤️

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;

  return await sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send Custom message (for future use)
 */
export async function sendCustomMessage(customerPhone, customerName, storeName, customText, storeSlug) {
  const storeUrl = storeSlug ? `https://${storeSlug}.mzansifoodconnect.app` : '';

  const message = `Hi ${customerName}! 👋

${customText}

- ${storeName}

${storeUrl ? `\n🛒 Visit us: ${storeUrl}` : ''}`;

  return await sendWhatsAppMessage(customerPhone, message);
}
