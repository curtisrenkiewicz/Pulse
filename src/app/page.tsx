'use client'

import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/auth/AuthForm'
import { TimelineDashboard } from '@/components/dashboard/TimelineDashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return user ? <TimelineDashboard /> : <AuthForm />
}
