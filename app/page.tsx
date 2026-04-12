import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-label">
                <span className="dot"></span>
                India's #1 Construction Marketplace
              </div>
              <h1>Build Your Dream <br />With <span className="highlight">Verified Experts</span></h1>
              <p className="hero-description">
                Connect with top-rated Civil Engineers, Architects, Interior Designers, and Contractors. 
                Post your building project and receive proposals from verified professionals.
              </p>
              <div className="hero-buttons">
                <Link href="/auth/register" className="btn btn-primary btn-lg">Start Building →</Link>
                <Link href="/engineers" className="btn btn-secondary btn-lg">Find Engineers</Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="number">500+</div>
                  <div className="label">Verified Engineers</div>
                </div>
                <div className="hero-stat">
                  <div className="number">1,200+</div>
                  <div className="label">Projects Completed</div>
                </div>
                <div className="hero-stat">
                  <div className="number">4.9</div>
                  <div className="label">Average Rating</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrapper">
                <img src="/img/hero_visual.png" alt="Modern Construction & Engineering" className="hero-image" />
                <div className="image-overlay-card">
                  <span className="badge badge-gold">✓ Premium Professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-heading">
            <div className="label">Why PLAN 2 BUILD</div>
            <h2>Everything You Need to Build</h2>
            <p>From finding the right professional to managing your project — we've got you covered.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏗️</div>
              <h3>Verified Professionals</h3>
              <p>Every engineer is background-verified with authenticated certificates and portfolio verification.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Post & Get Proposals</h3>
              <p>Post your building requirements and receive competitive proposals from qualified engineers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Real-Time Chat</h3>
              <p>Communicate directly with engineers through our real-time messaging system with file sharing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Ratings & Reviews</h3>
              <p>Make informed decisions with authentic ratings and reviews from verified customers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>Razorpay-powered secure transactions with payment verification and subscription management.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Location-Based Search</h3>
              <p>Find professionals near your project location with advanced filtering and search capabilities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <div className="label">How It Works</div>
            <h2>Simple 4-Step Process</h2>
            <p>Get your construction project started in minutes.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Register as a Customer or Engineer with your email and basic details.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Post Your Project</h3>
              <p>Describe your building requirements, budget, timeline, and upload plans.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Receive Proposals</h3>
              <p>Get proposals from verified engineers with pricing and timeline estimates.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Start Building</h3>
              <p>Choose the best engineer, finalize details, and begin your project.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div className="label">Professional Categories</div>
            <h2>Find The Right Expert</h2>
            <p>Browse professionals across all construction disciplines.</p>
          </div>
          <div className="categories-grid">
            <Link href="/engineers?category=Civil Engineer" className="category-card">
              <div className="category-icon">🏛️</div>
              <div className="category-info">
                <h3>Civil Engineers</h3>
                <p>Structural design & construction</p>
              </div>
            </Link>
            <Link href="/engineers?category=Architect" className="category-card">
              <div className="category-icon">📐</div>
              <div className="category-info">
                <h3>Architects</h3>
                <p>Building design & planning</p>
              </div>
            </Link>
            <Link href="/engineers?category=Electrical Engineer" className="category-card">
              <div className="category-icon">⚡</div>
              <div className="category-info">
                <h3>Electrical Engineers</h3>
                <p>Electrical systems & wiring</p>
              </div>
            </Link>
            <Link href="/engineers?category=Interior Designer" className="category-card">
              <div className="category-icon">🎨</div>
              <div className="category-info">
                <h3>Interior Designers</h3>
                <p>Interior spaces & decor</p>
              </div>
            </Link>
            <Link href="/engineers?category=Exterior Designer" className="category-card">
              <div className="category-icon">🏡</div>
              <div className="category-info">
                <h3>Exterior Designers</h3>
                <p>Landscaping & facades</p>
              </div>
            </Link>
            <Link href="/engineers?category=Contractor" className="category-card">
              <div className="category-icon">🔨</div>
              <div className="category-info">
                <h3>Contractors</h3>
                <p>Full construction management</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <div className="label">Testimonials</div>
            <h2>What Our Users Say</h2>
            <p>Hear from customers and professionals who've built success with us.</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-text">
                "PLAN 2 BUILD helped me find the perfect architect for my dream villa in Pune. The platform made it incredibly easy to compare proposals and communicate directly."
              </div>
              <div className="testimonial-author">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#d4a843,#b8922f)', color: '#0a1628' }}>R</div>
                <div>
                  <h4>Rajesh Patel</h4>
                  <p>Homeowner, Pune</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-text">
                "As a civil engineer, PLAN 2 BUILD has been a game-changer for my practice. The premium subscription pays for itself with the quality of leads I receive every month."
              </div>
              <div className="testimonial-author">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#2563eb,#1e3a5f)', color: '#fff' }}>S</div>
                <div>
                  <h4>Er. Suresh Kumar</h4>
                  <p>Civil Engineer, Delhi</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-text">
                "The real-time messaging and proposal system made the entire process seamless. Found an amazing contractor who delivered our office building on time and within budget."
              </div>
              <div className="testimonial-author">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>A</div>
                <div>
                  <h4>Anita Deshmukh</h4>
                  <p>Business Owner, Mumbai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="cta-section">
            <h2>Ready to Start Building?</h2>
            <p>Join thousands of customers and engineers who trust PLAN 2 BUILD for their construction needs.</p>
            <div className="cta-buttons">
              <Link href="/auth/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
              <Link href="/subscription" className="btn btn-secondary btn-lg">View Plans</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
