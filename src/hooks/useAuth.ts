'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  timezone: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [loading, setLoading] = useState(true)

  // Detect browser timezone
  const detectTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }

  // Get or create user profile with timezone
  const ensureUserProfile = async (userId: string) => {
    // First try to get existing profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', userId)
      .single()

    if (profile) {
      setUserTimezone(profile.timezone || 'UTC')
      return profile.timezone
    }

    // Create profile if it doesn't exist
    const detectedTimezone = detectTimezone()
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .insert({ 
        id: userId, 
        timezone: detectedTimezone 
      })
      .select('timezone')
      .single()

    setUserTimezone(newProfile?.timezone || detectedTimezone)
    return newProfile?.timezone || detectedTimezone
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await ensureUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await ensureUserProfile(session.user.id)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateTimezone = async (newTimezone: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ timezone: newTimezone })
      .eq('id', user.id)
    
    if (!error) {
      setUserTimezone(newTimezone)
    }
    
    return { error }
  }

  return {
    user,
    userTimezone,
    loading,
    signUp,
    signIn,
    signOut,
    updateTimezone,
    detectTimezone,
  }
}