# 👑 Admin Dashboard Documentation

## Access Information

**Admin Login Page**: `https://www.mzansifoodconnect.app/admin`

**Credentials**:
- Username: `Bhutah`
- PIN: `271104`

## How to Access

1. Go to the landing page: `https://www.mzansifoodconnect.app`
2. Look for the gold crown icon (👑) next to the Login button in the navigation
3. Click the crown icon to go to admin login
4. Enter username and PIN
5. Access granted to admin dashboard!

## Dashboard Features

### 📊 Platform Statistics

**Total Clients**
- Shows total number of registered stores
- All-time count

**Active Clients**
- Clients with active paid subscriptions
- Excludes expired and trial accounts

**Inactive Clients**
- Expired subscriptions or trial accounts
- Potential upsell opportunities

**Monthly Revenue**
- Revenue from new signups this month
- Pro: R3/month
- Premium: R4/month

**Total Revenue**
- All active subscriptions combined
- Real-time calculation

### 📈 Clients by Plan

**Trial Plan (FREE)**
- Number of trial clients
- Percentage of total
- No revenue

**Pro Plan (R3/month)**
- Number of Pro clients
- Percentage of total
- Monthly revenue from Pro

**Premium Plan (R4/month)**
- Number of Premium clients
- Percentage of total
- Monthly revenue from Premium

### 📋 Recent Signups

**Last 30 Days Table**
- Date of signup
- Store name
- Plan selected
- Email address

Helps you track:
- Growth trends
- Popular plans
- New customers

### 🔄 Features

**Refresh Data Button**
- Click to reload latest statistics
- Updates all numbers in real-time

**Logout Button**
- Secure logout from admin session
- Returns to homepage

## Design

Beautiful gradient design with:
- Purple to violet gradient background
- Clean white cards with shadows
- Smooth animations on hover
- Color-coded statistics
- Responsive on all devices

## Security

- Session-based authentication
- No API access without login
- Credentials stored in sessionStorage
- Auto-redirect if not logged in
- Logout clears all session data

## Notes for Testing Prices

Current prices are set for testing:
- Pro: R3/month (normally R25)
- Premium: R4/month (normally R50)

Revenue calculations use these test prices. Update the prices in:
- `src/components/AdminDashboard.jsx` lines 47-48
- When you change to production pricing

## Technical Details

**Files**:
- `src/AdminLogin.jsx` - Login page
- `src/AdminDashboardPage.jsx` - Dashboard wrapper
- `src/components/AdminDashboard.jsx` - Main dashboard
- `src/components/AdminDashboard.css` - Styles
- `src/main.jsx` - Routes added

**Routes**:
- `/admin` - Login page
- `/admin-dashboard` - Dashboard (requires auth)

**Data Source**:
- Queries `tenants` table from Supabase
- Calculates stats in real-time
- No caching (always fresh data)

## Future Enhancements

Potential additions:
- Charts/graphs for visual analytics
- Export data to CSV
- Client search/filter
- Email marketing integration
- Revenue forecasting
- Plan upgrade tracking
- Churn rate analytics
- Geographic distribution
