import { useState } from 'react';
import '../styles/Landing.css';

function Landing() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Thando M.",
      location: "Cape Town",
      text: "Mzansi Food Connect helped me discover amazing local restaurants I never knew existed!",
      rating: "⭐️⭐️⭐️⭐️⭐️"
    },
    {
      id: 2,
      name: "James K.",
      location: "Johannesburg", 
      text: "The recipes are authentic and easy to follow. My bobotie has never been better!",
      rating: "⭐️⭐️⭐️⭐️⭐️"
    },
    {
      id: 3,
      name: "Sarah B.",
      location: "Durban",
      text: "Finally, a platform that celebrates our diverse South African food culture!",
      rating: "⭐️⭐️⭐️⭐️⭐️"
    }
  ];

  const features = [
    {
      icon: "🍲",
      title: "Authentic Recipes",
      description: "Discover traditional South African recipes passed down through generations"
    },
    {
      icon: "🍴",
      title: "Local Restaurants",
      description: "Find hidden gems and popular spots serving authentic local cuisine"
    },
    {
      icon: "👨‍🍳",
      title: "Cooking Tips",
      description: "Learn professional techniques from experienced local chefs"
    },
    {
      icon: "🛒",
      title: "Food Markets",
      description: "Explore local food markets and fresh produce suppliers"
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Taste the True <span className="highlight">Flavour of Mzansi</span>
          </h1>
          <p className="hero-subtitle">
            Discover authentic South African cuisine, connect with local food lovers, 
            and experience the rich diversity of our food culture.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Explore Recipes</button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <strong>500+</strong>
              <span>Authentic Recipes</span>
            </div>
            <div className="stat">
              <strong>200+</strong>
              <span>Local Restaurants</span>
            </div>
            <div className="stat">
              <strong>10K+</strong>
              <span>Food Lovers</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="food-showcase">
            <div className="food-item bobotie">🍛</div>
            <div className="food-item pap">🍚</div>
            <div className="food-item bunny-chow">🥘</div>
            <div className="food-item melktert">🍮</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Mzansi Food Connect?</h2>
          <p className="section-subtitle">
            We bring the best of South African food culture right to your fingertips
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Community Says</h2>
          <div className="testimonials-container">
            <div className="testimonial-active">
              <div className="testimonial-content">
                <p>"{testimonials[activeTestimonial].text}"</p>
                <div className="testimonial-author">
                  <strong>{testimonials[activeTestimonial].name}</strong>
                  <span>{testimonials[activeTestimonial].location}</span>
                </div>
                <div className="testimonial-rating">
                  {testimonials[activeTestimonial].rating}
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
          <h2>Ready to Explore South African Cuisine?</h2>
          <p>Join thousands of food lovers discovering authentic local flavors</p>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-large">Create Account</button>
            <button className="btn btn-secondary btn-large">Learn More</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🌍 Mzansi Food Connect</h3>
              <p>Connecting South African Food Lovers</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Explore</h4>
                <a href="#recipes">Recipes</a>
                <a href="#restaurants">Restaurants</a>
                <a href="#markets">Markets</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#careers">Careers</a>
              </div>
              <div className="link-group">
                <h4>Legal</h4>
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
                <a href="#cookies">Cookies</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Mzansi Food Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;