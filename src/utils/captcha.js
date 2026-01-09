/**
 * Google reCAPTCHA v3 Integration
 * Invisible CAPTCHA that runs in the background
 */

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

let recaptchaLoaded = false;
let recaptchaLoadPromise = null;

/**
 * Load reCAPTCHA script
 */
export function loadRecaptcha() {
  if (recaptchaLoaded) {
    return Promise.resolve();
  }

  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise;
  }

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.grecaptcha) {
      recaptchaLoaded = true;
      resolve();
      return;
    }

    // Add script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      recaptchaLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA'));
    };

    document.head.appendChild(script);
  });

  return recaptchaLoadPromise;
}

/**
 * Execute reCAPTCHA and get token
 * @param {string} action - Action name (e.g., 'signup', 'login', 'checkout')
 * @returns {Promise<string>} - reCAPTCHA token
 */
export async function executeRecaptcha(action = 'submit') {
  // If no site key configured, skip CAPTCHA (development mode)
  if (!import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    return 'dev_mode_no_captcha';
  }

  try {
    await loadRecaptcha();

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then(token => {
            resolve(token);
          })
          .catch(error => {
            reject(error);
          });
      });
    });
  } catch (error) {
    // CAPTCHA failed - allow form submission but log error
    console.error('reCAPTCHA error:', error);
    return null;
  }
}

/**
 * Verify reCAPTCHA token on server-side (call this from Edge Function)
 * This is just a helper - actual verification happens on server
 */
export async function verifyRecaptchaToken(token) {
  const secretKey = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;

  if (!secretKey || !token) {
    return { success: false, error: 'Missing token or secret key' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Initialize reCAPTCHA badge position
 */
export function initRecaptchaBadge() {
  loadRecaptcha().then(() => {
    // Badge appears automatically in bottom-right corner
  }).catch(() => {
    // Silently fail - CAPTCHA is optional
  });
}
