// Email templates for subscription reminders

export function getExpiryReminderEmail(daysRemaining, planName, planPrice, storeName, renewalUrl) {
  if (daysRemaining === 7) {
    return {
      subject: `Your ${planName} plan renews in 7 days - ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Renewal Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi there,</h2>
              <p>This is a friendly reminder that your <strong>${planName} plan</strong> for <strong>${storeName}</strong> will renew in <strong>7 days</strong>.</p>

              <p><strong>Renewal Details:</strong></p>
              <ul>
                <li>Plan: ${planName}</li>
                <li>Price: R${planPrice}/month</li>
                <li>Renews: In 7 days</li>
              </ul>

              <p>Your plan will automatically continue. Make sure your payment method is up to date to avoid any interruption.</p>

              <a href="${renewalUrl}" class="btn">Manage Subscription →</a>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                💡 <strong>Why renew?</strong> Keep your online store running, continue receiving orders, and maintain access to analytics and customer messages.
              </p>
            </div>
            <div class="footer">
              <p>Mzansi Food Connect | Empowering SA Food Businesses</p>
              <p>Questions? Reply to this email or visit mzansifoodconnect.app</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  if (daysRemaining === 3) {
    return {
      subject: `⚠️ ${planName} plan expires in 3 days - Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff3e0; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #ff9800; }
            .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .warning { background: #fff; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Urgent: Plan Expires Soon</h1>
            </div>
            <div class="content">
              <h2>Action Required</h2>
              <p>Your <strong>${planName} plan</strong> for <strong>${storeName}</strong> expires in just <strong>3 days</strong>!</p>

              <div class="warning">
                <p style="margin: 0;"><strong>⏰ What happens if you don't renew:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Your online store will stop accepting orders</li>
                  <li>Customers won't be able to view your menu</li>
                  <li>You'll lose access to analytics and messages</li>
                  <li>Your store customizations will be hidden</li>
                </ul>
              </div>

              <p><strong>Renew now to avoid interruption:</strong></p>
              <ul>
                <li>Plan: ${planName}</li>
                <li>Price: R${planPrice}/month</li>
                <li><strong>Expires in: 3 days</strong></li>
              </ul>

              <a href="${renewalUrl}" class="btn">Renew Now (R${planPrice}) →</a>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Renewing takes less than 2 minutes. Don't let your customers down!
              </p>
            </div>
            <div class="footer">
              <p>Mzansi Food Connect</p>
              <p>Need help? Reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Day 0 - Expired
  return {
    subject: `❌ Your ${planName} plan has expired - Renew to restore access`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffebee; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #d32f2f; }
          .btn { display: inline-block; background: #d32f2f; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; font-size: 16px; }
          .error-box { background: #fff; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Plan Expired</h1>
          </div>
          <div class="content">
            <h2>Your ${planName} plan has expired</h2>
            <p>Your <strong>${storeName}</strong> store is currently offline because your subscription expired.</p>

            <div class="error-box">
              <p style="margin: 0;"><strong>🚫 Your store is currently:</strong></p>
              <ul style="margin: 10px 0;">
                <li>Not accepting new orders</li>
                <li>Hidden from customers</li>
                <li>Dashboard access blocked</li>
              </ul>
            </div>

            <p><strong>Renew now to restore access:</strong></p>
            <p style="font-size: 18px; margin: 20px 0;">
              <strong>R${planPrice}/month</strong> - Full ${planName} features
            </p>

            <a href="${renewalUrl}" class="btn">Renew Now & Restore Access →</a>

            <p style="margin-top: 30px; background: #fff; padding: 15px; border-radius: 6px;">
              💡 <strong>Your data is safe!</strong> All your products, orders, and settings are preserved. Renew anytime to pick up where you left off.
            </p>
          </div>
          <div class="footer">
            <p>Mzansi Food Connect</p>
            <p>Questions? Reply to this email for support</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

export function getGracePeriodEmail(daysInGrace, planName, storeName, renewalUrl) {
  return {
    subject: `⏰ Final Warning: ${planName} access ends in ${3 - daysInGrace} days`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e65100 0%, #d84315 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffe0b2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #e65100; }
          .btn { display: inline-block; background: #e65100; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .countdown { background: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Grace Period Active</h1>
          </div>
          <div class="content">
            <h2>Your ${planName} plan expired</h2>
            <p>We're giving you <strong>3 days</strong> to renew before your <strong>${storeName}</strong> store is fully disabled.</p>

            <div class="countdown">
              <h3 style="margin: 0; color: #e65100; font-size: 32px;">${3 - daysInGrace}</h3>
              <p style="margin: 5px 0 0 0;">Days remaining until full shutdown</p>
            </div>

            <p><strong>Current Restrictions:</strong></p>
            <ul>
              <li>⚠️ Warning banner on your dashboard</li>
              <li>📊 Limited access to some features</li>
              <li>⏰ ${3 - daysInGrace} days until complete lockout</li>
            </ul>

            <p><strong>What happens after grace period:</strong></p>
            <ul>
              <li>❌ Complete dashboard access blocked</li>
              <li>❌ Store hidden from customers</li>
              <li>❌ No new orders accepted</li>
            </ul>

            <a href="${renewalUrl}" class="btn">Renew Now to Avoid Shutdown →</a>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Don't wait! Renew now to keep your business running smoothly.
            </p>
          </div>
          <div class="footer">
            <p>Mzansi Food Connect</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}
