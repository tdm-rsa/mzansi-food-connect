import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portfolio.css';

function Portfolio() {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState('stemfactory');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = {
    stemfactory: {
      title: 'StemFactory',
      tagline: 'Empowering Future STEM Leaders',
      description: 'I am a founder of StemFactory, a program that I use to help Grade 12 Students to pass Maths and Physics. I believe that giving back is an important part of life. I was part of the Kutlwanong center for maths and science which helped me become very good in maths and science. With that said, I feel a desire to help matriculants myself because I know how stressful it is to navigate matric.',
      offerings: [
        { name: 'Maths and Physics', price: 'R500/month', description: 'Comprehensive tutoring in both subjects' },
        { name: 'Maths Only / Physics Only', price: 'R300/month', description: 'Focused single-subject tutoring' },
        { name: 'University Application', price: 'R150', description: 'Complete application assistance' },
        { name: 'NBT Application', price: 'R150', description: 'NBT registration and prep guidance' },
        { name: 'Bursary Application', price: 'R100', description: 'Bursary search and application support' }
      ],
      commitment: 'We take care of the heavy lifting and the only thing you get to focus on is just studying. We only take serious students who are willing to show up in sessions and do all tasks right. We help you understand content, we help you with question papers, we provide tailor-made personal tutoring specifically for your needs. We will be a shoulder to cry on when hard and uncertain times come because they are.'
    },
    webdev: {
      title: 'Web & App Development',
      tagline: 'Building Digital Solutions That Scale',
      description: 'I am a website builder with 2+ years of experience. I build tailor-made editable websites for clients. I have expertise in creating any type of website - ecommerce, booking websites, web apps, Android apps, and iOS apps. Hosting and all technical aspects are taken care of by myself.',
      offerings: [
        { name: 'Custom Websites', price: 'Quote-based', description: 'Fully customized websites with admin dashboard for easy content management' },
        { name: 'Ecommerce Platforms', price: 'Quote-based', description: 'Complete online stores with payment integration' },
        { name: 'Web Applications', price: 'Quote-based', description: 'Custom web apps built from scratch' },
        { name: 'Mobile Apps (Android/iOS)', price: 'Quote-based', description: 'Native mobile applications with Play Store/App Store deployment' },
        { name: 'Lifetime Support', price: 'Included', description: 'Bug fixes and maintenance for the lifetime of your application' }
      ],
      commitment: 'You get an admin dashboard where you can edit your website - change text, add photos, switch website templates - without any coding experience needed. Just tell me what you want to achieve and I will build it from scratch. I am also available to fix any bugs or problems that your application has for a lifetime.'
    }
  };

  const projects = [
    {
      name: 'MzansiFoodConnect',
      logo: '/mfc-logo.png',
      description: 'A comprehensive SaaS platform that allows fast food owners, shisanyamas, bakeries, and mobile kitchens to have a website of their own.',
      features: [
        'Multi-tenant food delivery platform',
        'Three-tier subscription model (Trial, Pro, Premium)',
        'Real-time order management',
        'WhatsApp integration for notifications',
        'QR code generation for stores',
        '5+ customizable store templates',
        'Advanced analytics dashboards',
        'Payment integration (Yoco, Paystack)',
        'Subdomain routing for each business'
      ],
      tech: 'React, Supabase, Vercel, WhatsApp API',
      link: 'https://www.mzansifoodconnect.app',
      type: 'Production SaaS Platform'
    },
    {
      name: 'UrbanSaas',
      logo: '/urbansaas-logo.png',
      description: 'Design, launch, and scale stunning storefronts in minutes. A SaaS platform that allows entrepreneurs to have an online presence to take orders from their customers.',
      features: [
        'Designer-grade storefront engine',
        'Real-time live preview across templates',
        'Multi-template experiences (Beauty Luxe, Tech Hub, Street Market, Jersey Pro)',
        'Automated WhatsApp payments',
        'Mobile-first checkout optimized for SA networks',
        'Multi-user collaboration with role-based access',
        'Local + global payment integration',
        'Advanced analytics with revenue visualization',
        '8 min average launch time'
      ],
      tech: 'React, Real-time sync, Payment APIs, Cloud hosting',
      highlights: [
        'Template syncing without rebuilding content',
        'Native WhatsApp flows with smart replies',
        'Enterprise-grade infrastructure with SSL',
        'Actionable analytics for cohort retention'
      ],
      pricing: {
        starter: { name: 'Starter', price: 'FREE/7-day trial', products: '15 products, 50 lifetime orders' },
        premium: { name: 'Premium', price: 'R300/month', products: 'Unlimited products & orders' }
      },
      type: 'Premium Commerce Infrastructure'
    }
  ];

  return (
    <div className="portfolio-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-image-wrapper">
            <img
              src="/nqubeko-profile.jpg"
              alt="Nqubeko Ngcece"
              className="hero-image"
            />
            <div className="hero-badge">
              <img src="/creator-badge.png" alt="Creator" className="badge-icon" />
            </div>
          </div>
          <div className="hero-text">
            <h1 className="hero-title">Nqubeko Ngcece</h1>
            <p className="hero-subtitle">4th Year UCT Machine Learning Student</p>
            <p className="hero-description">
              I am an ambitious young man coming from Umlazi Township. I have been in University for 3+ years now
              and I am the perfect person to help you navigate the environment.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">3+</span>
                <span className="stat-label">Years at UCT</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2+</span>
                <span className="stat-label">Years Building</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2</span>
                <span className="stat-label">SaaS Platforms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <h2 className="section-title">Services</h2>
        <div className="service-tabs">
          <button
            className={`service-tab ${activeService === 'stemfactory' ? 'active' : ''}`}
            onClick={() => setActiveService('stemfactory')}
          >
            <img src="/stemfactory-logo.png" alt="StemFactory" className="tab-icon" />
            StemFactory
          </button>
          <button
            className={`service-tab ${activeService === 'webdev' ? 'active' : ''}`}
            onClick={() => setActiveService('webdev')}
          >
            <span className="tab-icon-text">💻</span>
            Web & App Development
          </button>
        </div>

        <div className="service-content">
          <div className="service-header">
            <h3>{services[activeService].title}</h3>
            <p className="service-tagline">{services[activeService].tagline}</p>
          </div>

          <p className="service-description">{services[activeService].description}</p>

          <div className="offerings-grid">
            {services[activeService].offerings.map((offering, index) => (
              <div key={index} className="offering-card">
                <h4>{offering.name}</h4>
                <p className="offering-price">{offering.price}</p>
                <p className="offering-description">{offering.description}</p>
              </div>
            ))}
          </div>

          <div className="commitment-box">
            <h4>My Commitment</h4>
            <p>{services[activeService].commitment}</p>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="portfolio-section">
        <h2 className="section-title">My Work</h2>
        <p className="section-subtitle">Production-ready SaaS platforms serving African entrepreneurs</p>

        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              <div className="project-header">
                <img src={project.logo} alt={project.name} className="project-logo" />
                <span className="project-type">{project.type}</span>
              </div>

              <h3 className="project-name">{project.name}</h3>
              <p className="project-description">{project.description}</p>

              <div className="project-features">
                <h4>Key Features:</h4>
                <ul>
                  {project.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              {project.highlights && (
                <div className="project-highlights">
                  <h4>Highlights:</h4>
                  <ul>
                    {project.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {project.pricing && (
                <div className="project-pricing">
                  <h4>Pricing Model:</h4>
                  <div className="pricing-tiers">
                    <div className="pricing-tier">
                      <strong>{project.pricing.starter.name}</strong>
                      <span>{project.pricing.starter.price}</span>
                      <small>{project.pricing.starter.products}</small>
                    </div>
                    <div className="pricing-tier">
                      <strong>{project.pricing.premium.name}</strong>
                      <span>{project.pricing.premium.price}</span>
                      <small>{project.pricing.premium.products}</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="project-footer">
                <p className="project-tech"><strong>Tech Stack:</strong> {project.tech}</p>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    Visit Platform →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <h2 className="section-title">Let's Work Together</h2>
        <p className="contact-description">
          Whether you need tutoring, want to build a website, or have a project idea, I'm here to help.
        </p>
        <div className="contact-buttons">
          <a href="https://wa.me/27XXXXXXXXX" className="contact-btn whatsapp" target="_blank" rel="noopener noreferrer">
            WhatsApp Me
          </a>
          <a href="mailto:nqubeko@example.com" className="contact-btn email">
            Email Me
          </a>
        </div>

        <div className="social-links">
          <h3>Connect with me</h3>
          <div className="social-buttons">
            <a href="https://www.facebook.com/nqubeko.49550/" className="social-btn facebook" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">f</span>
              Facebook
            </a>
            <a href="https://www.instagram.com/nqubekobhutah/" className="social-btn instagram" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">📷</span>
              Instagram
            </a>
            <a href="https://www.linkedin.com/in/nqubeko-ngcece-3057b7265/?originalSubdomain=za" className="social-btn linkedin" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">in</span>
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="portfolio-footer">
        <p>&copy; 2026 Nqubeko Ngcece. Built with passion in Cape Town.</p>
        <button onClick={() => navigate('/')} className="back-link">
          ← Back to Platform
        </button>
      </footer>
    </div>
  );
}

export default Portfolio;
