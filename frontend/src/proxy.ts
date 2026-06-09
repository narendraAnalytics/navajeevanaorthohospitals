import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/intro',
  '/how-it-works',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth/sync',
  '/api/send-email',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl
  if (pathname === '/' && !searchParams.has('entered')) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/intro', req.url))
    }
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
