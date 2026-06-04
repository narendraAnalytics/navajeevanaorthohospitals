@AGENTS.md

# Frontend — Navajeevana Ortho Hospitals

Next.js 16 · React 19 · Tailwind 4 · Shadcn (`@base-ui/react`, style: `base-nova`)

## Routes

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — server component, imports client sections |
| `/patient` | `src/app/patient/page.tsx` | Patient portal — submit ticket + track status (client) |
| `/admin` | `src/app/admin/page.tsx` | Admin dashboard — HITL review queue (client) |

## Design system

All brand CSS lives in `src/app/globals.css` after the Shadcn/Tailwind 4 setup block.

Key CSS class naming:
- `.brand-page` — wrapper for landing page (sets fonts + ivory background)
- `.bwrap` — max-width container (1240px, `margin: 0 auto`) — do NOT use inside `.hero-content-wrap` or it will re-center the content
- `.bbtn` — brand button (variants: `.warm`, `.teal`, `.violet`, `.outline`, `.white`, `.whiteout`, `.lg`)
- `.panel` — section card (variants: `.mint`, `.peach`, `.blush`, `.green2`, `.warm2`)
- `.bsplit` — two-column section grid (0.62fr / 2fr)

Conflicting variable names resolved:
- `--bk-muted` = `#6E817D` (brand text muted — avoids Shadcn `--muted` which is a background color)
- `--brand-maxw` = `1240px` (avoids conflict with any Shadcn tokens)

Fonts loaded in `src/app/layout.tsx`:
- `--font-head` → Sora (headings)
- `--font-body` → Plus Jakarta Sans (body)

## Hero Section

`HeroSection.tsx` uses a full-width banner image layout (no carousel):

```
<header class="hero">
  <div class="hero-banner-bg" />       ← /assets/bannerimage.png, absolute cover
  <div class="hero-banner-overlay" />  ← ivory gradient L→R (text readability)
  <div class="hero-content-wrap">      ← flex, padding: 140px 26px 80px 60px
    <div class="hero-left">            ← max-width 560px, left-aligned
      trust-chip · h1 · spec-row · tline · hero-ctas · stat-cards
    </div>
  </div>
</header>
```

- `hero-content-wrap` must NOT wrap a `.bwrap` div — use direct padding for horizontal offset
- Animated stat counters use `AnimatedCounter` (easing counter with configurable delay)
- `h1` font: `clamp(30px, 3.2vw, 44px)` — keeps "Advanced Orthopedic" on one line

## Components

| File | Type | What it does |
|---|---|---|
| `src/components/Nav.tsx` | client | Glassmorphic floating nav, scroll shrink, section spy |
| `src/components/HeroSection.tsx` | client | Banner hero with animated stat counters |
| `src/components/TestimonialsSection.tsx` | client | Testimonial carousel (6500ms) + AI feature card |
| `src/components/Footer.tsx` | server | 4-column dark footer |

## API

`src/lib/api.ts` — typed `fetch` wrapper for all backend endpoints.  
Set `NEXT_PUBLIC_API_URL` in `.env.local`:
- Dev: `http://localhost:8000`
- Prod: `https://navajeevanaorthohospitals.onrender.com`

## Assets

`public/assets/` — bannerimage.png (hero background), hero1.png, hero2.png, hero3.png, logo.png  
Source reference: `samplecode/` — original vanilla HTML/CSS design. Do not import from it.

## Commands

```powershell
npm run dev     # localhost:3000
npm run build   # production build check
```
