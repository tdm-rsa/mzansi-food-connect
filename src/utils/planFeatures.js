// Plan feature definitions and restrictions

export const PLAN_FEATURES = {
  trial: {
    name: 'Free Trial',
    maxProducts: 30,
    hasAnalytics: false,
    hasBasicAnalytics: false,
    hasAdvancedAnalytics: false,
    hasWhatsApp: true, // Free WhatsApp web links
    hasCustomDomain: false,
    hasSubdomain: true,
    removeBranding: false,
    templates: ['Modern Food'], // Only 1 template
    support: 'email'
  },
  pro: {
    name: 'Pro',
    maxProducts: Infinity,
    hasAnalytics: true,
    hasBasicAnalytics: true,
    hasAdvancedAnalytics: false,
    hasWhatsApp: true, // Free WhatsApp web links
    hasCustomDomain: false,
    hasSubdomain: true,
    removeBranding: true,
    templates: ['Modern Food', 'Traditional SA'], // 2 templates - Fast & Mobile and new variants are Premium-only
    support: 'priority'
  },
  premium: {
    name: 'Premium',
    maxProducts: Infinity,
    hasAnalytics: true,
    hasBasicAnalytics: true,
    hasAdvancedAnalytics: true,
    hasWhatsApp: true, // Free WhatsApp web links
    hasCustomDomain: true,
    hasSubdomain: true,
    removeBranding: true,
    templates: [
      'Modern Food',
      'Traditional SA',
      'Fast & Mobile',
      'Ghost Kitchen Pro',
      'Late Night Fiesta'
    ], // 5 templates
    support: 'dedicated'
  }
};

export function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.trial;
}

export function canAccessFeature(plan, feature) {
  const features = getPlanFeatures(plan);
  return features[feature] === true;
}

export function getMaxProducts(plan) {
  const features = getPlanFeatures(plan);
  return features.maxProducts;
}

export function isPlanActive(storeInfo) {
  if (!storeInfo) return false;

  const plan = storeInfo.plan || 'trial';

  // ALL plans now check expiration (Pro/Premium must renew monthly)
  if (!storeInfo.plan_expires_at) {
    // No expiration set - legacy store or error
    return plan === 'trial'; // Only trial can have no expiration temporarily
  }

  const expiresAt = new Date(storeInfo.plan_expires_at);
  const now = new Date();

  // Plan is active if expiration date is in the future
  return now < expiresAt;
}

export function getDaysRemaining(storeInfo) {
  if (!storeInfo || !storeInfo.plan_expires_at) return null;

  const expiresAt = new Date(storeInfo.plan_expires_at);
  const now = new Date();
  const diffMs = expiresAt - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

export const PLAN_PRICING = {
  trial: { price: 0, period: '7 days' },
  pro: { price: 135, period: 'month' },
  premium: { price: 185, period: 'month' }
};
