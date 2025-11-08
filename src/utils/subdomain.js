// Subdomain detection and routing utilities

/**
 * Extract subdomain from current hostname
 * @returns {string|null} - Subdomain or null if none/invalid
 *
 * Examples:
 * - joeskfc.mzansifoodconnect.com → "joeskfc"
 * - www.mzansifoodconnect.com → null (www is ignored)
 * - mzansifoodconnect.com → null (no subdomain)
 * - localhost → null (development)
 * - yourapp.vercel.app → null (main domain)
 * - joeskfc.yourapp.vercel.app → "joeskfc"
 */
export function getSubdomain() {
  const hostname = window.location.hostname;

  // Development/localhost - no subdomains
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // Split hostname into parts
  const parts = hostname.split('.');

  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  // e.g., joeskfc.mzansifoodconnect.com
  if (parts.length < 3) {
    return null;
  }

  // Get potential subdomain (first part)
  const subdomain = parts[0];

  // Ignore common prefixes
  const ignoredSubdomains = ['www', 'www1', 'www2', 'app', 'admin'];
  if (ignoredSubdomains.includes(subdomain.toLowerCase())) {
    return null;
  }

  // Verify it's alphanumeric with dashes (valid store slug)
  // Allow: letters, numbers, and dashes
  if (!/^[a-z0-9-]+$/i.test(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Check if we're on a customer subdomain
 * @returns {boolean}
 */
export function isSubdomainMode() {
  return getSubdomain() !== null;
}

/**
 * Get the base domain (without subdomain)
 * @returns {string}
 *
 * Examples:
 * - joeskfc.mzansifoodconnect.com → "mzansifoodconnect.com"
 * - localhost → "localhost"
 * - joeskfc.yourapp.vercel.app → "yourapp.vercel.app"
 */
export function getBaseDomain() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return hostname;
  }

  const parts = hostname.split('.');

  // If no subdomain, return as-is
  if (parts.length < 3) {
    return hostname;
  }

  // Return everything except first part (subdomain)
  return parts.slice(1).join('.');
}

/**
 * Build URL for a store (subdomain or path-based)
 * @param {string} slug - Store slug
 * @param {boolean} useSubdomain - Force subdomain mode (default: auto-detect)
 * @returns {string} - Full URL
 */
export function buildStoreUrl(slug, useSubdomain = true) {
  const protocol = window.location.protocol; // http: or https:
  const baseDomain = getBaseDomain();

  if (useSubdomain && baseDomain !== 'localhost') {
    // Subdomain mode: joeskfc.mzansifoodconnect.com
    return `${protocol}//${slug}.${baseDomain}`;
  } else {
    // Path-based mode: mzansifoodconnect.com/store/joeskfc
    return `${protocol}//${baseDomain}/store/${slug}`;
  }
}
