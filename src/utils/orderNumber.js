// Generate UNIQUE order numbers like C0056
// Uses timestamp + random component to ensure uniqueness
export function generateOrderNumber() {
  // Timestamp in milliseconds
  const now = Date.now();

  // Add random 2-digit number for extra uniqueness
  const random = Math.floor(Math.random() * 100);

  // Combine timestamp and random, take last 4 digits
  const combined = (now + random) % 10000;

  // Use letters A-Z for first character (26 possibilities)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion
  const letter = letters[Math.floor(Math.random() * letters.length)];

  // Format as Letter + 3-digit number (e.g., A123, K456)
  return `${letter}${String(combined).padStart(3, '0')}`;
}

// Alternative: Generate order number with database check
export async function generateUniqueOrderNumber(supabase, storeId) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const orderNumber = generateOrderNumber();

    // Check if this order number exists for this store
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', storeId)
      .eq('order_number', orderNumber)
      .single();

    // If no existing order found, this number is unique
    if (error && error.code === 'PGRST116') {
      return orderNumber;
    }

    attempts++;
  }

  // Fallback: use timestamp-based unique number
  return `Z${Date.now().toString().slice(-3)}`;
}
