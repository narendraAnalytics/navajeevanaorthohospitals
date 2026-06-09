import { notFound } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { specialties, getSpecialty } from '@/lib/specialties-data'

export function generateStaticParams() {
  return specialties.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getSpecialty(slug)
  if (!s) return {}
  return { title: `${s.label} | Navajeevana Ortho Hospitals` }
}

export default async function SpecialtyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getSpecialty(slug)
  if (!s) notFound()

  return (
    <div className="brand-page">
      <style>{`
        .sp-hero {
          background: ${s.heroGradient};
          padding: 60px 24px 60px;
          position: relative;
        }
        .sp-hero-inner { max-width: 860px; margin: 0 auto; }
        .sp-breadcrumb {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: rgba(0,0,0,.45);
          text-decoration: none; margin-bottom: 28px;
          transition: color .2s;
        }
        .sp-breadcrumb:hover { color: rgba(0,0,0,.7); }
        .sp-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: .22em;
          text-transform: uppercase; color: ${s.accentColor};
          margin-bottom: 12px;
        }
        .sp-hero h1 {
          font-family: var(--font-head, "Sora", system-ui);
          font-size: clamp(34px, 5vw, 58px); font-weight: 900;
          color: #1a2e28; line-height: 1.05; margin-bottom: 14px;
        }
        .sp-hero p {
          font-size: 17px; color: rgba(0,0,0,.55); max-width: 580px;
        }

        .sp-main { max-width: 860px; margin: 0 auto; padding: 56px 24px 80px; }

        .sp-section { margin-bottom: 48px; }
        .sp-section-title {
          font-family: var(--font-head, "Sora", system-ui);
          font-size: 22px; font-weight: 800; color: #1a2e28;
          margin-bottom: 18px; padding-bottom: 10px;
          border-bottom: 2px solid ${s.accentColor}22;
        }
        .sp-section-title span { color: ${s.accentColor}; }

        .sp-intro-card {
          background: #fff; border-radius: 20px; padding: 28px 32px;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 8px 32px -12px rgba(0,0,0,.1);
          font-size: 16px; line-height: 1.75; color: #3a4a45;
        }

        .sp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .sp-list li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 15px; color: #3a4a45; line-height: 1.5;
        }
        .sp-list li::before {
          content: "✓"; flex-shrink: 0; width: 22px; height: 22px;
          background: ${s.accentColor}18; color: ${s.accentColor};
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 700;
          margin-top: 1px;
        }

        .sp-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .sp-pill {
          padding: 7px 16px; border-radius: 50px;
          background: ${s.accentColor}14; color: ${s.accentColor};
          font-size: 13px; font-weight: 600; border: 1px solid ${s.accentColor}30;
        }

        .sp-types { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .sp-types { grid-template-columns: 1fr; } }
        .sp-type-card {
          background: #fff; border-radius: 16px; padding: 22px 24px;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 4px 20px -8px rgba(0,0,0,.08);
        }
        .sp-type-card h4 {
          font-family: var(--font-head, "Sora", system-ui);
          font-size: 15px; font-weight: 700; color: ${s.accentColor};
          margin-bottom: 8px;
        }
        .sp-type-card p { font-size: 14px; color: #5a6a65; line-height: 1.6; }

        .sp-steps { display: flex; flex-direction: column; gap: 12px; }
        .sp-step {
          display: flex; align-items: flex-start; gap: 14px;
          background: #fff; border-radius: 14px; padding: 16px 20px;
          border: 1px solid rgba(0,0,0,.06);
        }
        .sp-step-num {
          flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%;
          background: ${s.accentColor}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
        }
        .sp-step p { font-size: 14.5px; color: #3a4a45; line-height: 1.55; margin: 0; padding-top: 4px; }

        .sp-faq { display: flex; flex-direction: column; gap: 10px; }
        .sp-faq details {
          background: #fff; border-radius: 14px;
          border: 1px solid rgba(0,0,0,.07);
          overflow: hidden;
        }
        .sp-faq summary {
          padding: 18px 22px; font-size: 15px; font-weight: 600;
          color: #1a2e28; cursor: pointer; list-style: none;
          display: flex; justify-content: space-between; align-items: center;
        }
        .sp-faq summary::-webkit-details-marker { display: none; }
        .sp-faq summary::after {
          content: "+"; font-size: 20px; font-weight: 400;
          color: ${s.accentColor}; flex-shrink: 0; margin-left: 12px;
        }
        .sp-faq details[open] summary::after { content: "−"; }
        .sp-faq-body { padding: 0 22px 18px; font-size: 14.5px; color: #5a6a65; line-height: 1.65; }

        .sp-cta {
          background: ${s.heroGradient}; border-radius: 24px;
          padding: 44px 40px; text-align: center;
          box-shadow: 0 20px 60px -20px rgba(0,0,0,.15);
        }
        .sp-cta h3 {
          font-family: var(--font-head, "Sora", system-ui);
          font-size: 26px; font-weight: 800; color: #1a2e28; margin-bottom: 10px;
        }
        .sp-cta p { font-size: 15px; color: rgba(0,0,0,.5); margin-bottom: 28px; }
        .sp-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .sp-btn-primary {
          padding: 13px 32px; border-radius: 50px;
          background: ${s.accentColor}; color: #fff;
          font-family: var(--font-head, "Sora", system-ui);
          font-size: 14px; font-weight: 700; text-decoration: none;
          box-shadow: 0 8px 24px -6px ${s.accentColor}88;
          transition: transform .2s, box-shadow .2s;
          display: inline-block;
        }
        .sp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -4px ${s.accentColor}88; }
        .sp-btn-secondary {
          padding: 13px 32px; border-radius: 50px;
          background: rgba(255,255,255,.7); color: #1a2e28;
          font-family: var(--font-head, "Sora", system-ui);
          font-size: 14px; font-weight: 600; text-decoration: none;
          border: 1px solid rgba(0,0,0,.12);
          transition: background .2s;
          display: inline-block;
        }
        .sp-btn-secondary:hover { background: rgba(255,255,255,.95); }

        .sp-panel {
          background: linear-gradient(140deg,#EEFBF5,#F3FBFF);
          border-radius: 20px; padding: 28px 32px;
          border: 1px solid rgba(255,255,255,.7);
        }
      `}</style>

      {/* Hero */}
      <header className="sp-hero">
        <div className="sp-hero-inner">
          <Link href="/" className="sp-breadcrumb">
            ← Home
          </Link>
          <div className="sp-eyebrow">Navajeevana Ortho Hospitals</div>
          <h1>{s.label}</h1>
          <p>{s.tagline}</p>
        </div>
      </header>

      <main className="sp-main">

        {/* Intro */}
        <section className="sp-section">
          <div className="sp-intro-card">{s.intro}</div>
        </section>

        {/* When Recommended */}
        <section className="sp-section">
          <div className="sp-panel">
            <h2 className="sp-section-title">When Is <span>{s.label}</span> Recommended?</h2>
            <ul className="sp-list">
              {s.whenRecommended.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        {/* Conditions Treated */}
        <section className="sp-section">
          <h2 className="sp-section-title">Conditions <span>Treated</span></h2>
          <div className="sp-pills">
            {s.conditionsTreated.map(c => <span key={c} className="sp-pill">{c}</span>)}
          </div>
        </section>

        {/* Types */}
        {s.types.length > 0 && (
          <section className="sp-section">
            <h2 className="sp-section-title">Types of <span>{s.label}</span></h2>
            <div className="sp-types">
              {s.types.map(t => (
                <div key={t.title} className="sp-type-card">
                  <h4>{t.title}</h4>
                  <p>{t.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="sp-section">
          <h2 className="sp-section-title">Key <span>Benefits</span></h2>
          <ul className="sp-list">
            {s.benefits.map(b => <li key={b}>{b}</li>)}
          </ul>
        </section>

        {/* Recovery */}
        <section className="sp-section">
          <h2 className="sp-section-title">Recovery <span>Journey</span></h2>
          <div className="sp-steps">
            {s.recovery.map((step, i) => (
              <div key={i} className="sp-step">
                <div className="sp-step-num">{i + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Risks */}
        <section className="sp-section">
          <h2 className="sp-section-title">Possible <span>Risks</span></h2>
          <ul className="sp-list">
            {s.risks.map(r => <li key={r}>{r}</li>)}
          </ul>
        </section>

        {/* FAQs */}
        <section className="sp-section">
          <h2 className="sp-section-title">Frequently Asked <span>Questions</span></h2>
          <div className="sp-faq">
            {s.faqs.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div className="sp-faq-body">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="sp-cta">
          <h3>Ready to Take the First Step?</h3>
          <p>Our orthopedic specialists are here to help. Book a consultation today.</p>
          <div className="sp-cta-btns">
            <Link href="/doctors" className="sp-btn-primary">Book a Consultation</Link>
            <Link href="/" className="sp-btn-secondary">← Back to Home</Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
