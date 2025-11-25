// WhatsApp Messaging via Ultramsg (Platform-level)
// All messages sent from YOUR platform WhatsApp Business number
// Now using secure edge function instead of exposing credentials

import { supabase } from "../supabaseClient";

/**
 * Send WhatsApp message via edge function
 * @param {string} phoneNumber - Customer phone number (format: 27XXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<object>} Response from API
 */
export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: phoneNumber,
        message: message
      }
    });

    if (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      console.error('❌ WhatsApp send failed:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ WhatsApp message sent successfully to', phoneNumber);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Order Confirmation message
 */
export async function sendOrderConfirmation(customerPhone, customerName, orderNumber, storeName, estimatedTime, totalAmount, storeSlug) {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: customerPhone,
        messageType: 'confirmation',
        customerName,
        orderNumber,
        storeName,
        estimatedTime,
        totalAmount,
        storeSlug
      }
    });

    if (error) {
      console.error('❌ Failed to send order confirmation:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('❌ Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Order Ready message
 */
export async function sendOrderReady(customerPhone, customerName, orderNumber, storeName, storeSlug) {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: customerPhone,
        messageType: 'ready',
        customerName,
        orderNumber,
        storeName,
        storeSlug
      }
    });

    if (error) {
      console.error('❌ Failed to send order ready message:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('❌ Error sending order ready message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Order Fetched (Thank you) message
 */
export async function sendOrderFetched(customerPhone, customerName, orderNumber, storeName, storeSlug) {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: customerPhone,
        messageType: 'fetched',
        customerName,
        orderNumber,
        storeName,
        storeSlug
      }
    });

    if (error) {
      console.error('❌ Failed to send order fetched message:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('❌ Error sending order fetched message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Custom message (for future use)
 */
export async function sendCustomMessage(customerPhone, customerName, storeName, customText, storeSlug) {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: customerPhone,
        messageType: 'custom',
        customerName,
        storeName,
        customText,
        storeSlug
      }
    });

    if (error) {
      console.error('❌ Failed to send custom message:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('❌ Error sending custom message:', error);
    return { success: false, error: error.message };
  }
}
