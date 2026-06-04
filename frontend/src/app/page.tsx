import Nav from '@/components/Nav'
import HeroSection from '@/components/HeroSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'

const doctors = [
  { n: 'Dr. Ravi Kumar', r: 'Senior Orthopedic Surgeon', m: '20+ Years Experience · Knee & Hip Specialist', c: 'bg-gi-teal', tag: 'Top Rated' },
  { n: 'Dr. Priya Nair', r: 'Spine Surgeon', m: '15+ Years Experience · Spine Specialist', c: 'bg-gi-coral', tag: 'Spine' },
  { n: 'Dr. Suresh Babu', r: 'Sports Medicine Expert', m: '12+ Years Experience · Sports Injury Specialist', c: 'bg-gi-warm', tag: 'Sports' },
  { n: 'Dr. Anitha Reddy', r: 'Joint Replacement Surgeon', m: '18+ Years Experience · Joint Replacement Expert', c: 'bg-gi-violet', tag: 'Joints' },
  { n: 'Dr. Venkatesh', r: 'Trauma & Fracture Specialist', m: '14+ Years Experience · Trauma Care Expert', c: 'bg-gi-teal', tag: 'Trauma' },
]

const specialties = [
  { label: 'Knee Replacement',      sub: 'Robotic precision',   g: 'bg-gi-teal',   bg: 'bg-sc-lime' },
  { label: 'Hip Replacement',       sub: 'Minimally invasive',  g: 'bg-gi-warm',   bg: 'bg-sc-peach' },
  { label: 'Spine Surgery',         sub: 'Advanced techniques', g: 'bg-gi-warm',   bg: 'bg-sc-salmon' },
  { label: 'Sports Medicine',       sub: 'Return to play',      g: 'bg-gi-teal',   bg: 'bg-sc-mint' },
  { label: 'Trauma Care',           sub: '24/7 emergency',      g: 'bg-gi-violet', bg: 'bg-sc-lavender' },
  { label: 'Physiotherapy & Rehab', sub: 'Faster recovery',     g: 'bg-gi-teal',   bg: 'bg-sc-teal-lt' },
]

const specIconPaths = [
  /* Knee Replacement */ 'M8 3v5m0 0a4 4 0 008 0m-8 0H5m11 0h3M8 21v-5m0 0a4 4 0 008 0m-8 0H5m11 0h3',
  /* Hip Replacement  */ 'M12 4a2 2 0 100-4 2 2 0 000 4zm-2 3c-2 0-3 1-3 3l1 10h8l1-10c0-2-1-3-3-3h-4z',
  /* Spine Surgery    */ 'M12 3v18M9 6h6M9 10h6M9 14h6M9 18h6',
  /* Sports Medicine  */ 'M13 2L4 14h8l-1 8 9-12h-8z',
  /* Trauma Care      */ 'M12 6v12M6 12h12',
  /* Physio & Rehab   */ 'M12 4a2 2 0 100-4 2 2 0 000 4zm-5 17l4-9 3 4 4-9',
]

const whyItems = [
  { icon: 'shield', g: 'bg-gi-teal',   title: 'Advanced Orthopedic Care',    desc: 'State-of-the-art technology for accurate diagnosis and effective treatment.' },
  { icon: 'ai',    g: 'bg-gi-coral',   title: 'AI-Assisted Patient Support',  desc: '24/7 AI support for instant answers and quick assistance.' },
  { icon: 'team',  g: 'bg-gi-warm',    title: 'Expert Surgeons',              desc: 'Highly experienced specialists with a proven track record.' },
  { icon: 'building', g: 'bg-gi-violet', title: 'World-Class Facilities',     desc: 'Modern infrastructure with advanced operation theatres.' },
]

const journey = [
  { g: 'bg-gi-warm',   label: 'Book Appointment',   sub: 'Online or call' },
  { g: 'bg-gi-coral',  label: 'Doctor Consultation', sub: 'Expert assessment' },
  { g: 'bg-gi-teal',   label: 'Diagnostic Tests',    sub: 'Precise imaging' },
  { g: 'bg-gi-violet', label: 'Treatment Plan',       sub: 'Personalised path' },
  { g: 'bg-gi-warm',   label: 'Recovery & Rehab',     sub: 'Back to life' },
]

export default function LandingPage() {
  return (
    <div className="brand-page">
      {/* Background orbs */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb a" /><div className="orb b" /><div className="orb c" />
      </div>

      <RevealObserver />
      <Nav />
      <HeroSection />

      <main>
        {/* ── Specialties ── */}
        <section className="bsection" id="specialties" data-screen-label="Specialties">
          <div className="bwrap">
            <div className="panel mint bsplit">
              <div className="sec-head">
                <div className="eyebrow te-grn">Our Specialties</div>
                <h2>Our <span className="te-grn">Specialties</span></h2>
                <p>Comprehensive orthopedic care tailored to your needs.</p>
              </div>
              <div className="spec-grid">
                {specialties.map(({ label, sub, g, bg }, i) => (
                  <div key={label} className={`spec-card reveal d${i + 1} ${bg}`}>
                    <div className={`si ${g}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d={specIconPaths[i]} />
                      </svg>
                    </div>
                    <h4>{label}</h4>
                    <div className="sl">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Doctors ── */}
        <section className="bsection" id="doctors" data-screen-label="Doctors">
          <div className="bwrap">
            <div className="panel peach bsplit">
              <div className="sec-head">
                <div className="eyebrow te-warm">Our Team</div>
                <h2>Meet Our<br /><span className="te-warm">Specialists</span></h2>
                <p>Experienced orthopedic surgeons committed to your recovery.</p>
                <button className="bbtn warm mt-18">
                  View All Doctors
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="doc-grid">
                {doctors.map(({ n, r, m, c, tag }, i) => (
                  <div key={n} className={`doc-card reveal d${i + 1}`}>
                    <div className="doc-photo">
                      <span className={`ribbon ${c}`}>{tag}</span>
                      <div className="ph">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <circle cx={12} cy={9} r={4} />
                          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="doc-body">
                      <h4>{n}</h4>
                      <div className="role">{r}</div>
                      <div className="meta">{m}</div>
                      <div className={`uline ${c}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Choose ── */}
        <section className="bsection" id="why" data-screen-label="Why Choose">
          <div className="bwrap">
            <div className="panel blush bsplit">
              <div className="sec-head">
                <div className="eyebrow te-blush">Why Navajeevana</div>
                <h2>Why Choose <span className="te-blush">Navajeevana?</span></h2>
                <p>Advanced technology, expert care and a patient-first approach.</p>
              </div>
              <div className="bento-grid">
                {whyItems.map(({ g, title, desc }, i) => (
                  <div key={title} className={`bento-cell reveal d${i + 1}`}>
                    <div className={`bi ${g}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 3l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V7z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Treatment Journey ── */}
        <section className="bsection" id="treatments" data-screen-label="Treatment Journey">
          <div className="bwrap">
            <div className="panel green2 bsplit">
              <div className="sec-head">
                <div className="eyebrow te-grn">The Process</div>
                <h2>Your Treatment<br /><span className="te-grn">Journey</span></h2>
                <p>From consultation to recovery, we&apos;re with you every step.</p>
              </div>
              <div className="journey">
                {journey.map(({ g, label, sub }, i) => (
                  <div key={label} className="d-contents">
                    <div className={`jstep reveal d${i + 1}`}>
                      <div className={`jc ${g}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x={3} y={4} width={18} height={17} rx={3} />
                          <path d="M3 9h18M8 2v4m8-4v4" />
                        </svg>
                      </div>
                      <h4>{label}</h4>
                      <div className="jn">{sub}</div>
                    </div>
                    {i < journey.length - 1 && (
                      <div className="jarrow">
                        <svg viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M1 9h22m-6-6l6 6-6 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials + AI ── */}
        <TestimonialsSection />

        {/* ── CTA Banner ── */}
        <div className="cta-banner bwrap" id="contact" data-screen-label="CTA">
          <div className="cta-inner">
            <div className="ct">
              <div className="ct-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x={3} y={4} width={18} height={17} rx={3} />
                  <path d="M3 9h18M8 2v4m8-4v4" />
                </svg>
              </div>
              <div>
                <h3>Ready to Take the First Step Towards a Pain-Free Life?</h3>
                <p>Book your appointment with our experts today.</p>
              </div>
            </div>
            <div className="cta-acts">
              <button className="bbtn white lg">Book Appointment</button>
              <button className="bbtn whiteout lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
                </svg>
                Call Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
