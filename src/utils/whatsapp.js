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
      
      return { success: false, error: error.message };
    }

    if (!data.success) {
      
      return { success: false, error: data.error };
    }

    return { success: true, data };

  } catch (error) {
    
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
      
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    
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
      
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    
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
      
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    
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

      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {

    return { success: false, error: error.message };
  }
}

/**
 * Send Vendor Notification for new order
 */
export async function sendVendorNotification(vendorPhone, customerName, orderNumber, storeName, totalAmount) {
  try {
    const message = `🔔 *New Order Alert!*\n\nYou have a new order from *${customerName}*\n\n📦 Order: #${orderNumber}\n💰 Total: R${totalAmount}\n\n👉 Go check your dashboard to confirm and prepare the order!\n\n- ${storeName}`;

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: vendorPhone,
        message: message
      }
    });

    if (error) {
      console.error('Failed to send vendor notification:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error sending vendor notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp Group Invite to customer
 */
export async function sendGroupInvite(customerPhone, customerName, groupUrl, storeName) {
  try {
    const message = `Hi ${customerName}! 👋\n\nThank you for ordering from *${storeName}*!\n\nJoin our WhatsApp group to get:\n✅ Exclusive deals\n✅ New menu updates\n✅ Special promotions\n\n👉 Click here to join: ${groupUrl}\n\nSee you there! 🎉`;

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: customerPhone,
        message: message
      }
    });

    if (error) {
      console.error('Failed to send group invite:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error sending group invite:', error);
    return { success: false, error: error.message };
  }
}
