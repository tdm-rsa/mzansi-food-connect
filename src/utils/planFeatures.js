// Plan feature definitions and restrictions

export const PLAN_FEATURES = {
  trial: {
    name: 'Free Trial',
    maxProducts: 10,
    hasAnalytics: false,
    hasBasicAnalytics: false,
    hasAdvancedAnalytics: false,
    hasWhatsApp: true,
    hasCustomDomain: false,
    hasSubdomain: true,
    removeBranding: false,
    templates: ['Modern Food'], // Only 1 template
    support: 'email',
    canConfigurePayments: false, // Cannot add own Yoco keys - uses platform test keys
    isTestMode: true // All payments are test mode only
  },
  pro: {
    name: 'Pro',
    maxProducts: Infinity,
    hasAnalytics: true,
    hasBasicAnalytics: true,
    hasAdvancedAnalytics: false,
    hasWhatsApp: true,
    hasCustomDomain: false,
    hasSubdomain: true,
    removeBranding: true,
    templates: ['Modern Food', 'Traditional SA'], // 2 templates
    support: 'priority',
    canConfigurePayments: true, // Can add own Yoco keys for real payments
    isTestMode: false // Real payments enabled
  },
  premium: {
    name: 'Premium',
    maxProducts: Infinity,
    hasAnalytics: true,
    hasBasicAnalytics: true,
    hasAdvancedAnalytics: true,
    hasWhatsApp: true,
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
    support: 'dedicated',
    canConfigurePayments: true, // Can add own Yoco keys for real payments
    isTestMode: false // Real payments enabled
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
  if (now < expiresAt) {
    return true;
  }

  // GRACE PERIOD: 3 days after expiration with limited access
  const gracePeriodDays = 3;
  const gracePeriodEnd = new Date(expiresAt.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));

  // If within grace period, plan is still "active" but with warnings
  return now < gracePeriodEnd;
}

export function isInGracePeriod(storeInfo) {
  if (!storeInfo || !storeInfo.plan_expires_at) return false;

  const expiresAt = new Date(storeInfo.plan_expires_at);
  const now = new Date();

  // Grace period starts after expiration
  if (now < expiresAt) return false;

  // Grace period lasts 3 days
  const gracePeriodEnd = new Date(expiresAt.getTime() + (3 * 24 * 60 * 60 * 1000));

  return now < gracePeriodEnd;
}

export function getGracePeriodDaysLeft(storeInfo) {
  if (!isInGracePeriod(storeInfo)) return 0;

  const expiresAt = new Date(storeInfo.plan_expires_at);
  const gracePeriodEnd = new Date(expiresAt.getTime() + (3 * 24 * 60 * 60 * 1000));
  const now = new Date();

  const daysLeft = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
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
