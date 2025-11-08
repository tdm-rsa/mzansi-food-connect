// Plan feature definitions and restrictions

export const PLAN_FEATURES = {
  trial: {
    name: 'Free Trial',
    maxProducts: 30,
    hasAnalytics: false,
    hasBasicAnalytics: false,
    hasAdvancedAnalytics: false,
    hasWhatsAppAPI: false,
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
    hasWhatsAppAPI: true,
    hasCustomDomain: false,
    hasSubdomain: true,
    removeBranding: true,
    templates: ['Modern Food', 'Traditional SA', 'Fast & Mobile'], // 3 templates
    support: 'priority'
  },
  premium: {
    name: 'Premium',
    maxProducts: Infinity,
    hasAnalytics: true,
    hasBasicAnalytics: true,
    hasAdvancedAnalytics: true,
    hasWhatsAppAPI: true,
    hasCustomDomain: true,
    hasSubdomain: true,
    removeBranding: true,
    templates: ['Modern Food', 'Traditional SA', 'Fast & Mobile'], // 3 templates (same as Pro)
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

  // Paid plans are always active (unless expired - add payment check later)
  if (plan === 'pro' || plan === 'premium') {
    return true;
  }

  // Trial: check expiration
  if (plan === 'trial') {
    if (!storeInfo.plan_expires_at) return true; // No expiration set yet

    const expiresAt = new Date(storeInfo.plan_expires_at);
    const now = new Date();
    return now < expiresAt;
  }

  return false;
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
  pro: { price: 150, period: 'month' },
  premium: { price: 300, period: 'month' }
};
