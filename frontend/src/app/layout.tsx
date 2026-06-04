import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Sora, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const LOGO_URL =
  'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png'

export const metadata: Metadata = {
  title: 'Navajeevana Ortho Hospitals — Advanced Orthopedic Care',
  description:
    'World-class orthopedic care in Bhimavaram, Andhra Pradesh. Joint replacement, spine surgery, sports medicine, physiotherapy & more.',
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={
        {
          '--font-head': 'var(--font-sora)',
          '--font-body': 'var(--font-jakarta)',
        } as React.CSSProperties
      }
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
