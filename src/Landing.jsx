import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './Landing.css';
import logo from './images/logo.png';

function Landing() {
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in, redirect to app
        navigate('/app');
      }
    });
  }, [navigate]);
  const features = [
    {
      icon: "🏪",
      title: "Your Own Online Store",
      description: "Get a professional storefront with your branding in minutes. No coding needed."
    },
    {
      icon: "🛒",
      title: "Customers Order Online",
      description: "Your customers browse your menu and place orders directly from your website 24/7."
    },
    {
      icon: "💬",
      title: "Customers Send Messages",
      description: "Customers can ask questions about products right on your website. You get notifications in your dashboard."
    },
    {
      icon: "🔔",
      title: "Customer Pickup Notifications",
      description: "Customers get notified when their order is ready. They just come and fetch - no waiting!"
    },
    {
      icon: "📱",
      title: "WhatsApp Integration",
      description: "Automatic order notifications sent directly to your customers' WhatsApp, they get notified instantly. Stay connected with customers."
    },
    {
      icon: "💳",
      title: "Secure Online Payments",
      description: "Accept payments instantly with Paystack integration. Get paid faster."
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description: "Track your sales, best sellers, and customer behavior with live dashboards.Track Your business Growth with live charts and reports."
    },
    {
      icon: "🎨",
      title: "Store Designer",
      description: "Customize your store colors, layout, and branding to match your business. Create a QR code for customers to scan and pay online."
    },
    {
      icon: "📋",
      title: "Menu Management",
      description: "Add, edit, and manage your menu items with photos and descriptions."
    },
    {
      icon: "🌐",
      title: "Multiple Templates",
      description: "Choose from a variety of designs for your store."
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sipho's Braai Spot",
      location: "Soweto, Johannesburg",
      text: "Since going online with Mzansi Food Connect, my orders doubled! Customers love ordering ahead.",
      business: "Shisanyama"
    },
    {
      id: 2,
      name: "Mama's Kitchen",
      location: "Khayelitsha, Cape Town",
      text: "The WhatsApp notifications are perfect. I get orders while cooking and customers pay online.",
      business: "Home Bakery"
    },
    {
      id: 3,
      name: "Thabo's Fast Foods",
      location: "Durban Central",
      text: "My customers love the online menu. They can see prices and photos before ordering.",
      business: "Takeaway Restaurant"
    }
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const pricingPlans = [
    {
      name: "Free Trial",
      subtitle: "7 Days Free",
      price: "R0",
      period: "for 7 days",
      description: "Try it free with your own subdomain (e.g., yourstore.mzansifoodconnect.co.za)",
      features: [
        "Your own subdomain",
        "Unlimited menu items",
        "Order management",
        "WhatsApp notifications",
        "Store designer",
        "Customers order online",
        "Customers send messages",
        "Customer pickup notifications"
      ],
      cta: "Start 7-Day Trial",
      highlight: false
    },
    {
      name: "Pro",
      subtitle: "Subdomain",
      price: "R150",
      period: "per month",
      description: "Keep your subdomain and unlock all features",
      features: [
        "Everything in Free Trial",
        "Up to 3 website templates",
        "Unlimited menu items",
        "Basic analytics",
        "Live Queue View for Customers on the website",
        "Remove branding",
        "Customers order online",
        "Customers send messages on the website",
        "A dashbord to manage orders, menu , Store design and more"
      
      ],
      cta: "Upgrade to Pro",
      highlight: true
    },
    {
      name: "Premium",
      subtitle: "Custom Domain",
      price: "R300",
      period: "per month",
      description: "Bring your own domain (e.g., www.yourstore.co.za)",
      features: [
        "Everything in Pro",
        "Custom domain support",
        "3 Professional templates",
        "Advanced Analytics , charts and reports",
        "API access e.g Automated WhatsApp messaging",
        "Unlimited Menu Items",
        "First priority support",
        "Full branding control"
      ],
      cta: "Upgrade to Premium",
      highlight: false
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src={logo} alt="Mzansi Food Connect" />
            <span>Mzansi Food Connect</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Success Stories</a>
            <a href="/app" className="btn-login">Login</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Do you have a <span className="highlight">Shisanyama</span>, a <span className="highlight">Restaurant</span>, a <span className="highlight">Mobile Kitchen</span> an <span className="highlight">Eatery</span> or a <span className="highlight">Bakery</span>?<br />
            <br />
            Take Your <span className="highlight">Food Business Online</span>
          </h1>
          <p className="hero-subtitle">
            Sell online, accept payments, and grow your customer base.
            Perfect for fast foods, eateries, shisanyamas, restaurants, and bakeries across South Africa.
          </p>
          <div className="hero-buttons">
            <a href="/app" className="btn btn-primary">Start Free Today</a>
            <a href="#features" className="btn btn-secondary">See Features</a>
          </div>
          <div className="hero-trust">
            <p>✅ No credit card required • ✅ Setup in 5 minutes • ✅ Free forever plan</p>
          </div>
        </div>
        <div className="hero-visual">
          <div className="food-showcase">
            <div className="showcase-item">🍗 Mobile Kitchen </div>
            <div className="showcase-item">🥩 Shisanyama</div>
            <div className="showcase-item">🍞 Bakery</div>
            <div className="showcase-item">🍛 Eatery </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">Why Your Business Needs an Online Presence</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📈</div>
              <h3>Reach More Customers</h3>
              <p>Expand beyond walk-ins. Your customers can find and order from you anytime, anywhere.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Increase Sales</h3>
              <p>Accept online orders 24/7. More orders mean more revenue for your business.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⭐</div>
              <h3>Build Trust & Brand</h3>
              <p>A professional online store builds credibility and strengthens your brand identity.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📲</div>
              <h3>Compete with Big Brands</h3>
              <p>Level the playing field. Look as professional as the big chains at a fraction of the cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Everything You Need to Sell Online</h2>
          <p className="section-subtitle">
            Powerful features built specifically for food businesses
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Start free, upgrade as you grow</p>
          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.highlight ? 'highlight' : ''}`}>
                {plan.highlight && <div className="popular-badge">Most Popular</div>}
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                  <div className="plan-price">
                    <span className="price">{plan.price}</span>
                    <span className="period">/{plan.period}</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="/app" className={`plan-cta ${plan.highlight ? 'primary' : 'secondary'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <h2 className="section-title">Success Stories from Real Businesses</h2>
          <p className="section-subtitle">See how food businesses are growing with Mzansi Food Connect</p>
          <div className="testimonials-container">
            <div className="testimonial-active">
              <div className="testimonial-content">
                <div className="quote-icon">"</div>
                <p className="testimonial-text">{testimonials[activeTestimonial].text}</p>
                <div className="testimonial-author">
                  <div>
                    <strong>{testimonials[activeTestimonial].name}</strong>
                    <span className="business-type">{testimonials[activeTestimonial].business}</span>
                  </div>
                  <span className="location">📍 {testimonials[activeTestimonial].location}</span>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Take Your Business Online?</h2>
          <p>Join South African food businesses growing their sales with Mzansi Food Connect</p>
          <div className="cta-buttons">
            <a href="/" className="btn btn-primary btn-large">Start Free - No Credit Card</a>
          </div>
          <p className="cta-subtext">Setup takes 5 minutes • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src={logo} alt="Mzansi Food Connect" className="footer-logo" />
              <h3>Mzansi Food Connect</h3>
              <p>Empowering South African Food Businesses</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="/">Dashboard</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#about">About Us</a>
                <a href="#contact">Contact</a>
                <a href="#support">Support</a>
              </div>
              <div className="link-group">
                <h4>Legal</h4>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Mzansi Food Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;