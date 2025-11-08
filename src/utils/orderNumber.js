// Generate simple order numbers like C0056
export function generateOrderNumber() {
  // Get current timestamp
  const now = Date.now();

  // Get last 4 digits for uniqueness
  const orderNum = now % 10000;

  // Format as C + 4-digit number (padded with zeros)
  return `C${String(orderNum).padStart(4, '0')}`;
}
