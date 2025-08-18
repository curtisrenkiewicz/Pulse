'use client'

import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/auth/AuthForm'
import { TimelineRedesign } from '@/components/dashboard/TimelineRedesign'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen">
      {user ? <TimelineRedesign /> : <AuthForm />}
    </div>
  )
}
