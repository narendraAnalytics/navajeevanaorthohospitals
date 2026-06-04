import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await getOrCreateUser()
  } catch { /* unauthenticated — skip */ }
  return NextResponse.redirect(new URL('/', req.url))
}
