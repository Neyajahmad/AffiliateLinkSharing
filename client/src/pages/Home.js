import { Link } from 'react-router-dom';
import { Accordion } from 'react-bootstrap';
import { CountUp, Reveal } from '../components/ui';

const HIGHLIGHTS = [
  { icon: 'bi-geo-alt', label: 'City & country tracking' },
  { icon: 'bi-phone', label: 'Device & browser insights' },
  { icon: 'bi-calendar-range', label: 'Date-range analytics' },
  { icon: 'bi-people', label: 'Team roles & permissions' },
  { icon: 'bi-google', label: 'Google sign-in' },
  { icon: 'bi-shield-check', label: 'Secure Razorpay billing' },
  { icon: 'bi-image', label: 'Link thumbnails' },
  { icon: 'bi-download', label: 'CSV export' },
];

const FEATURES = [
  {
    icon: 'bi-bar-chart-line',
    title: 'Click analytics that actually help',
    text: 'See where every click comes from: city, country, device, browser and network. Filter by date and spot the campaigns that convert.',
    wide: true,
  },
  {
    icon: 'bi-link-45deg',
    title: 'Trackable links in seconds',
    text: 'Paste any affiliate URL and get a tracking link you can share on your blog, socials, videos or ads.',
  },
  {
    icon: 'bi-tags',
    title: 'Campaigns & categories',
    text: 'Organise links by campaign and category, then search and sort them instantly.',
  },
  {
    icon: 'bi-people',
    title: 'Built for teams',
    text: 'Invite teammates as viewers or developers so they see the numbers without editing your links.',
  },
  {
    icon: 'bi-wallet2',
    title: 'Pay the way you grow',
    text: 'Start with small credit packs, or unlock unlimited links with a monthly or yearly plan.',
  },
];

const DEMO_BARS = [
  { label: 'Mumbai', value: 92 },
  { label: 'Delhi', value: 74 },
  { label: 'Bengaluru', value: 61 },
  { label: 'Hyderabad', value: 43 },
];

const STEPS = [
  { title: 'Paste your link', text: 'Add your affiliate URL with a campaign title and a category.' },
  { title: 'Share it anywhere', text: 'Copy your tracking link and post it on any platform you like.' },
  { title: 'Watch the clicks', text: 'Open analytics to see who clicked, from where and on what device.' },
];

const PLANS = [
  {
    name: 'Credit packs',
    price: '₹10',
    period: 'for 10 credits',
    desc: 'Pay as you go. One credit creates one link.',
    features: ['Packs of 10, 20, 50 or 100 credits', 'Credits never expire', 'Full click analytics', 'Team roles included'],
    cta: 'Start with credits',
  },
  {
    name: 'Unlimited yearly',
    price: '₹1990',
    period: '/ year',
    desc: 'Best value for regular creators: two months free.',
    features: ['Unlimited links', 'Full click analytics', 'Team roles included', 'Cancel anytime'],
    cta: 'Go unlimited',
    featured: true,
  },
  {
    name: 'Unlimited monthly',
    price: '₹199',
    period: '/ month',
    desc: 'Unlimited links with flexible monthly billing.',
    features: ['Unlimited links', 'Full click analytics', 'Team roles included', 'Cancel anytime'],
    cta: 'Choose monthly',
  },
];

const FAQS = [
  {
    q: 'How do credits work?',
    a: 'Each new link you create uses one credit. Credits come in packs of 10, 20, 50 or 100 and never expire. On an unlimited plan you can create as many links as you like without credits.',
  },
  {
    q: 'What do you track for each click?',
    a: 'For every click we record the time, city, region and country, device type, browser, network provider and referrer. You can filter by date range and export the full click log.',
  },
  {
    q: 'Can my team see the analytics?',
    a: 'Yes. Invite teammates as Viewers or Developers. They can see your links and analytics, while only you can create, edit or delete links.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel an unlimited plan anytime from the Billing page. Payments are processed securely by Razorpay.',
  },
  {
    q: 'Can I sign up with Google?',
    a: 'Yes. Create an account with your email and a password, or continue with your Google account in one click.',
  },
];

const MOCK_BARS = [34, 48, 41, 57, 52, 66, 60, 74, 68, 83, 79, 100];

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="mock-window">
        <div className="mock-bar">
          <span /><span /><span />
          <div className="mock-url">Affiliate++ · Dashboard</div>
        </div>
        <div className="mock-body">
          <div className="mock-stats">
            <div className="mock-stat">
              <small>Clicks</small>
              <strong><CountUp value={12480} /></strong><em>+24%</em>
            </div>
            <div className="mock-stat">
              <small>Links</small>
              <strong><CountUp value={36} /></strong>
            </div>
            <div className="mock-stat">
              <small>Mobile</small>
              <strong><CountUp value={68} suffix="%" /></strong>
            </div>
          </div>
          <div className="mock-chart">
            {MOCK_BARS.map((height, index) => (
              <span
                key={index}
                className={index === MOCK_BARS.length - 1 ? 'hl' : ''}
                style={{ height: `${height}%`, '--i': index }}
              />
            ))}
          </div>
          <div className="mock-row">
            <span className="dot"><i className="bi bi-headphones" /></span>
            <span className="grow"><b>Wireless headphones</b><em>Electronics</em></span>
            <strong>4,210</strong>
          </div>
          <div className="mock-row">
            <span className="dot"><i className="bi bi-bag" /></span>
            <span className="grow"><b>Festive sale picks</b><em>Fashion</em></span>
            <strong>2,975</strong>
          </div>
        </div>
      </div>

      <div className="float-card float-card-a">
        <span className="live-dot" />
        <div>
          <b>New click · Mumbai, IN</b>
          <small>Chrome on mobile · just now</small>
        </div>
      </div>
      <div className="float-card float-card-b">
        <span className="float-icon"><i className="bi bi-graph-up-arrow" /></span>
        <div>
          <b>+38% clicks</b>
          <small>vs. last week</small>
        </div>
      </div>
    </div>
  );
}

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero dark-stage">
        <div className="stage-grid" />
        <div className="glow glow-violet" />
        <div className="glow glow-teal" />
        <div className="glow glow-pink" />
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 hero-copy">
              <Reveal>
                <span className="hero-eyebrow">
                  <span className="live-dot" />
                  <span><strong>Real-time</strong> click analytics for every link</span>
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="hero-title">
                  Turn every link into{' '}
                  <span className="gradient-text-dark">measurable revenue</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="hero-lead">
                  Affiliate++ turns your affiliate URLs into trackable links and shows you exactly
                  where your clicks come from, so you can double down on what works.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="hero-actions">
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Start for free <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>
                  <Link to="/#features" className="btn btn-ghost-light btn-lg">
                    See how it works
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <ul className="hero-points">
                  <li><i className="bi bi-check-circle-fill" aria-hidden="true" /> Free to sign up</li>
                  <li><i className="bi bi-check-circle-fill" aria-hidden="true" /> Google sign-in</li>
                  <li><i className="bi bi-check-circle-fill" aria-hidden="true" /> Cancel anytime</li>
                </ul>
              </Reveal>
            </div>
            <div className="col-lg-6">
              <Reveal delay={200}>
                <HeroVisual />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights marquee */}
      <div className="marquee-band" aria-label="Highlights">
        <div className="marquee-mask">
        <div className="marquee-track">
          {[...HIGHLIGHTS, ...HIGHLIGHTS].map((item, index) => (
            <span className="marquee-item" key={index} aria-hidden={index >= HIGHLIGHTS.length}>
              <i className={`bi ${item.icon}`} aria-hidden="true" /> {item.label}
            </span>
          ))}
        </div>
        </div>
      </div>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <Reveal className="section-head">
            <span className="section-eyebrow"><i className="bi bi-stars" aria-hidden="true" /> Features</span>
            <h2 className="section-title">Everything you need to grow your affiliate income</h2>
            <p className="section-lead">One clean dashboard to create, share and measure every link you promote.</p>
          </Reveal>
          <div className="bento">
            {FEATURES.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={index * 80}
                className={`bento-card ${feature.wide ? 'span-2' : ''}`}
              >
                <span className="feature-icon" aria-hidden="true"><i className={`bi ${feature.icon}`} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                {feature.wide && (
                  <div className="bento-visual" aria-hidden="true">
                    {DEMO_BARS.map((bar, barIndex) => (
                      <div className="bar-row" key={bar.label}>
                        <span>{bar.label}</span>
                        <span className="bar-track">
                          <span className="bar-fill d-block" style={{ width: `${bar.value}%`, '--i': barIndex }} />
                        </span>
                        <strong>{bar.value * 12}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section-white" id="how-it-works">
        <div className="container">
          <Reveal className="section-head">
            <span className="section-eyebrow"><i className="bi bi-lightning-charge" aria-hidden="true" /> How it works</span>
            <h2 className="section-title">Up and running in three simple steps</h2>
            <p className="section-lead">No setup, no code. Create your account and share your first link in minutes.</p>
          </Reveal>
          <div className="steps">
            {STEPS.map((step, index) => (
              <Reveal className="step" key={step.title} delay={index * 120}>
                <span className="step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <div className="container">
          <Reveal className="section-head">
            <span className="section-eyebrow"><i className="bi bi-tag" aria-hidden="true" /> Pricing</span>
            <h2 className="section-title">Simple pricing that scales with you</h2>
            <p className="section-lead">Start small with credits or go unlimited. All prices in INR.</p>
          </Reveal>
          <div className="row g-4 justify-content-center align-items-stretch">
            {PLANS.map((plan, index) => (
              <div className="col-md-6 col-lg-4" key={plan.name}>
                <Reveal delay={index * 100} className="h-100">
                  <div className={`surface plan-card ${plan.featured ? 'is-featured' : ''}`}>
                    {plan.featured && <span className="plan-badge">Most popular</span>}
                    <p className="plan-name">{plan.name}</p>
                    <div>
                      <span className="plan-price">{plan.price}</span>{' '}
                      <span className="plan-period">{plan.period}</span>
                    </div>
                    <p className="plan-desc">{plan.desc}</p>
                    <ul className="plan-features">
                      {plan.features.map((item) => (
                        <li key={item}><i className="bi bi-check-circle-fill" aria-hidden="true" /> {item}</li>
                      ))}
                    </ul>
                    <Link to="/register" className={`btn w-100 ${plan.featured ? 'btn-primary' : 'btn-outline-primary'}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-white" id="faq">
        <div className="container">
          <Reveal className="section-head">
            <span className="section-eyebrow"><i className="bi bi-question-circle" aria-hidden="true" /> FAQ</span>
            <h2 className="section-title">Questions, answered</h2>
          </Reveal>
          <Reveal className="faq">
            <Accordion defaultActiveKey="0">
              {FAQS.map((item, index) => (
                <Accordion.Item eventKey={String(index)} key={item.q}>
                  <Accordion.Header>{item.q}</Accordion.Header>
                  <Accordion.Body>{item.a}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section pt-0 section-white">
        <div className="container">
          <Reveal className="cta-band">
            <div className="stage-grid" />
            <div className="glow glow-violet" />
            <div className="glow glow-teal" />
            <h2>Ready to see where your clicks come from?</h2>
            <p>Create your free account and share your first trackable link today.</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link to="/register" className="btn btn-white btn-lg">
                Create free account <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-ghost-light btn-lg">Log in</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export default Home;
