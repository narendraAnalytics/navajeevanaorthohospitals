@AGENTS.md


## Skills (always load before working in these areas)

```
Frontend / UI work:     C:\Users\ES\.claude\skills\nextstack.skill

# Frontend — Navajeevana Ortho Hospitals

Next.js 16 · React 19 · Tailwind 4 · Shadcn (`@base-ui/react`, style: `base-nova`)

## Routes

| Route | File | Status | Notes |
|---|---|---|---|
| `/intro` | `src/app/intro/page.tsx` | ✅ | Site-wide cinematic intro — signed-out only; loops video; `router.push('/?entered=1')` on enter |
| `/` | `src/app/page.tsx` | ✅ | Landing page — server component, imports client sections |
| `/specialties/[slug]` | `src/app/specialties/[slug]/page.tsx` | ✅ | Dynamic specialty pages; 6 slugs; no navbar; content from `src/lib/specialties-data.ts` |
| `/patient/intro` | `src/app/patient/intro/page.tsx` | ✅ | Entry animation → `/patient` |
| `/patient` | `src/app/patient/page.tsx` | ✅ | Care Hub — submit ticket + track (client) |
| `/patient/submit-transition/[ticket_id]` | `src/app/patient/submit-transition/[ticket_id]/page.tsx` | ✅ | AI handoff animation |
| `/patient/processing/[ticket_id]` | `src/app/patient/processing/[ticket_id]/page.tsx` | ✅ | Live pipeline view |
| `/admin/login` | `src/app/admin/login/page.tsx` | ✅ | SessionStorage auth |
| `/admin` | `src/app/admin/page.tsx` | ✅ | Admin home |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | ✅ | HITL review + Overview |
| `/doctors` | `src/app/doctors/page.tsx` | ✅ | Doctor cards grid + booking modal (static data + live slot/book API) |
| `/patient/book` | `src/app/patient/book/page.tsx` | ✅ | Redirect to `/doctors` |
| `/patient/book/confirm/[id]` | `src/app/patient/book/confirm/[id]/page.tsx` | ✅ | Polls booking result; confirmed / error states |
| `/patient/appointments` | `src/app/patient/appointments/page.tsx` | ✅ | Standalone appointments list with cancel |

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

`HeroSection.tsx` uses a 4-slide crossfade carousel with Ken Burns effect:

```
<header class="hero">
  <div class="hero-carousel">           ← 3 slides, Cloudinary URLs, absolute cover
    <div class="hero-slide [active]">   ← opacity transition 1.2s; active img runs kenburns
      <img src="cloudinary-url" />
    </div>
    ...
  </div>
  <div class="hero-dot-nav">            ← dot indicators, bottom-right, z-index:2
  <div class="hero-banner-overlay" />   ← ivory gradient L→R (text readability), z-index:1
  <div class="hero-content-wrap">       ← flex, z-index:3, padding: 140px 26px 80px 60px
    <div class="hero-left">             ← max-width 560px, left-aligned
      trust-chip · h1 · spec-row · tline · hero-ctas · stat-cards
    </div>
  </div>
</header>
```

- Slides auto-advance every 5500ms; pauses on hover
- Images hosted on Cloudinary (URLs in `images.txt` at project root)
- `hero-content-wrap` must NOT wrap a `.bwrap` div — use direct padding for horizontal offset
- Animated stat counters use `AnimatedCounter` (easing counter with configurable delay)
- `h1` font: `clamp(30px, 3.2vw, 44px)` — keeps "Advanced Orthopedic" on one line

## Components

| File | Type | What it does |
|---|---|---|
| `src/components/Nav.tsx` | client | Glassmorphic floating nav, scroll shrink, section spy |
| `src/components/HeroSection.tsx` | client | 4-slide Cloudinary carousel (Ken Burns + crossfade) + animated stat counters |
| `src/components/RevealObserver.tsx` | client | IntersectionObserver — adds `.in` to `.reveal` elements; render once per page |
| `src/components/TestimonialsSection.tsx` | client | Testimonial carousel (6500ms) + AI feature card |
| `src/components/Footer.tsx` | server | 4-column dark footer |

## Key files

| File | Purpose |
|---|---|
| `src/proxy.ts` | Clerk middleware — MUST be named `proxy.ts`. Redirects `/` → `/intro` only when `!entered` AND `!userId`. `/admin(.*)` and `/api/send-email` excluded. |
| `src/lib/api.ts` | Typed fetch wrapper for all backend endpoints. `sendEmail()` posts to `/api/send-email` (Next.js route), not backend directly. |
| `src/lib/auth.ts` | `getOrCreateUser()` — lazy Clerk→Neon sync for `frontend_users` |
| `src/lib/specialties-data.ts` | All 6 specialty page content (slugs, sections, FAQs). Add new specialties here. `getSpecialty(slug)` used by the dynamic route. |
| `src/components/CtaBannerButtons.tsx` | Auth-aware CTA buttons — signed-in → `/doctors`, signed-out → Clerk modal with `forceRedirectUrl="/doctors"`. |
| `src/components/PageReveal.tsx` | Dark overlay that fades out on mount. Add as first child of `.brand-page` on pages reached via intro navigation. |

## API

`src/lib/api.ts` — typed `fetch` wrapper for all backend endpoints.  
Set `NEXT_PUBLIC_API_URL` in `.env.local`:
- Dev: `http://localhost:8000`
- Prod: `https://navajeevanaorthohospitals.onrender.com`

Appointment API functions: `getDoctors`, `getAvailableSlots`, `bookAppointment`, `getAppointmentById`, `getAppointmentsByEmail`, `getAllAppointments`, `cancelAppointment`, `updateAppointmentAdminStatus`.

## Auth

- Middleware: `src/proxy.ts` (not `middleware.ts` — project convention)
- Use `<Show when="signed-in">` / `<Show when="signed-out">` — not deprecated `<SignedIn>` / `<SignedOut>`
- Patient email: auto-filled from `useUser()` and locked (`readOnly`) — never let patients change it
- Admin portal: sessionStorage-based, not Clerk. Username `ADMINNAVAJEEVANA` / password `admin@123`

## Assets

All production images (banner slides + logo) are hosted on Cloudinary. URLs are recorded in `images.txt` at the project root. `next.config.ts` whitelists `res.cloudinary.com` in `images.remotePatterns` — required for Next.js `<Image>` with these URLs.

`public/assets/` may still contain legacy local images — do not reference them in new code.  
Source reference: `samplecode/` — original vanilla HTML/CSS design. Do not import from it.

## Commands

```powershell
npm run dev     # localhost:3000
npm run build   # production build check
```
