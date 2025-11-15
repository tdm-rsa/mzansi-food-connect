// Domain registration and management utilities
// Uses Domains.co.za API for .co.za domain registration
// Uses Cloudflare API for DNS configuration

// Always use /api/domains/proxy (Vite in dev, Vercel serverless in production)
const DOMAINS_API_URL = "/api/domains/proxy";
const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

/**
 * Authenticate with Domains.co.za API and get JWT token
 * @returns {Promise<string>} JWT token
 */
async function authenticateDomains() {
  const username = import.meta.env.VITE_DOMAINS_USERNAME;
  const password = import.meta.env.VITE_DOMAINS_API_KEY;

  console.log("Authenticating with Domains.co.za:", { username, hasPassword: !!password });

  if (!username || !password) {
    throw new Error("Domain API credentials not configured");
  }

  const response = await fetch(`${DOMAINS_API_URL}?path=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  console.log("Auth response:", data);

  if (data.intReturnCode !== 1) {
    throw new Error(data.strMessage || "Authentication failed");
  }

  return data.token;
}

/**
 * Check if domain is available for registration
 * @param {string} domainName - Full domain name (e.g., "mykfcsoweto.co.za")
 * @returns {Promise<{available: boolean, price: number}>}
 */
export async function checkDomainAvailability(domainName) {
  try {
    // Split domain: "myteststore.co.za" -> sld="myteststore", tld="co.za"
    const parts = domainName.split(".");
    const sld = parts[0];
    const tld = parts.slice(1).join("."); // "co.za"

    console.log("Checking domain:", { domainName, sld, tld });

    const token = await authenticateDomains();
    console.log("Got JWT token");

    const response = await fetch(
      `${DOMAINS_API_URL}?path=domain/check&sld=${encodeURIComponent(sld)}&tld=${encodeURIComponent(tld)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Domain check response:", data);

    return {
      available: data.isAvailable === true,
      price: 79, // R79/year for .co.za domains
      message: data.isAvailable ? "Domain available!" : "Domain already taken",
    };
  } catch (error) {
    console.error("Domain availability check failed:", error);
    throw error;
  }
}

/**
 * Register/purchase a domain
 * @param {string} domainName - Full domain name (e.g., "mykfcsoweto.co.za")
 * @param {object} customerInfo - Customer contact information
 * @returns {Promise<{success: boolean, domain: string}>}
 */
export async function registerDomain(domainName, customerInfo) {
  try {
    // Split domain: "myteststore.co.za" -> sld="myteststore", tld="co.za"
    const parts = domainName.split(".");
    const sld = parts[0];
    const tld = parts.slice(1).join("."); // "co.za"

    console.log("Registering domain:", { domainName, sld, tld });

    const token = await authenticateDomains();

    const registrationData = {
      sld,
      tld,
      period: 1, // 1 year
      // Nameservers will be configured via Cloudflare
      ns1: "ns1.cloudflare.com",
      ns2: "ns2.cloudflare.com",
      // Contact information
      registrant_name: customerInfo.name || customerInfo.storeName,
      registrant_email: customerInfo.email,
      registrant_country: "ZA",
      registrant_province: customerInfo.province || "Gauteng",
      registrant_contact_number: customerInfo.phone,
      registrant_address: customerInfo.address || "N/A",
      registrant_postal_code: customerInfo.postalCode || "0001",
      registrant_city: customerInfo.city || "Johannesburg",
    };

    const response = await fetch(`${DOMAINS_API_URL}?path=domain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(registrationData),
    });

    const data = await response.json();

    if (data.intReturnCode === 1 || data.intReturnCode === 2) {
      return {
        success: true,
        domain: domainName,
        message: "Domain registered successfully!",
        status: data.intReturnCode === 1 ? "active" : "pending",
      };
    } else if (data.intReturnCode === 19) {
      throw new Error("Insufficient credits in domain reseller account");
    } else {
      throw new Error(data.strMessage || "Domain registration failed");
    }
  } catch (error) {
    console.error("Domain registration failed:", error);
    throw error;
  }
}

/**
 * Configure Cloudflare DNS for the domain
 * @param {string} domainName - Full domain name
 * @param {string} targetUrl - The customer's store URL (e.g., "mykfcsoweto.mzansifoodconnect.co.za")
 * @returns {Promise<{success: boolean}>}
 */
export async function configureCloudflareDNS(domainName, targetUrl) {
  try {
    const cloudflareToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
    const cloudflareZoneId = import.meta.env.VITE_CLOUDFLARE_ZONE_ID;

    if (!cloudflareToken || !cloudflareZoneId) {
      throw new Error("Cloudflare credentials not configured");
    }

    // Create CNAME record pointing to customer's subdomain
    const dnsRecord = {
      type: "CNAME",
      name: "@", // Root domain
      content: targetUrl,
      ttl: 1, // Auto
      proxied: true, // Use Cloudflare proxy for SSL
    };

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${cloudflareZoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudflareToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dnsRecord),
      }
    );

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        message: "DNS configured successfully!",
      };
    } else {
      throw new Error(data.errors?.[0]?.message || "DNS configuration failed");
    }
  } catch (error) {
    console.error("Cloudflare DNS configuration failed:", error);
    throw error;
  }
}

/**
 * Complete domain claim flow
 * 1. Check availability
 * 2. Register domain
 * 3. Configure DNS
 * 4. Save to database
 *
 * @param {string} domainName - Desired domain name
 * @param {object} customerInfo - Customer information
 * @param {object} supabase - Supabase client
 * @returns {Promise<{success: boolean, domain: string, status: string}>}
 */
export async function claimDomain(domainName, customerInfo, supabase) {
  try {
    // Step 1: Check availability
    const availability = await checkDomainAvailability(domainName);

    if (!availability.available) {
      throw new Error("Domain is not available");
    }

    // Step 2: Register domain
    const registration = await registerDomain(domainName, customerInfo);

    if (!registration.success) {
      throw new Error("Domain registration failed");
    }

    // Step 3: Configure DNS (pointing to customer's store subdomain)
    const storeSlug = customerInfo.storeSlug;
    const targetUrl = `${storeSlug}.mzansifoodconnect.co.za`; // Adjust to your domain

    await configureCloudflareDNS(domainName, targetUrl);

    // Step 4: Save to database
    const { error: dbError } = await supabase
      .from("tenants")
      .update({
        custom_domain: domainName,
        domain_status: registration.status,
        domain_registered_at: new Date().toISOString(),
      })
      .eq("id", customerInfo.storeId);

    if (dbError) {
      console.error("Database update failed:", dbError);
      throw new Error("Failed to save domain to database");
    }

    return {
      success: true,
      domain: domainName,
      status: registration.status,
      message: `Domain ${domainName} claimed successfully! It will be live within 24 hours.`,
    };
  } catch (error) {
    console.error("Domain claim flow failed:", error);
    throw error;
  }
}
