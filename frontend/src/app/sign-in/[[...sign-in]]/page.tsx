import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory)' }}>
      <SignIn forceRedirectUrl="/api/auth/sync" />
    </div>
  )
}
