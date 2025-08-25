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
    try {
      // First try to get existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // If error is not "no rows", log it but continue
        console.warn('Error fetching user profile:', fetchError)
        // Use detected timezone as fallback
        const detectedTimezone = detectTimezone()
        setUserTimezone(detectedTimezone)
        return detectedTimezone
      }

      if (profile) {
        setUserTimezone(profile.timezone || 'UTC')
        return profile.timezone
      }

      // Create profile if it doesn't exist
      const detectedTimezone = detectTimezone()
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({ 
          id: userId, 
          timezone: detectedTimezone 
        })
        .select('timezone')
        .single()

      if (insertError) {
        console.warn('Error creating user profile:', insertError)
        // Use detected timezone as fallback
        setUserTimezone(detectedTimezone)
        return detectedTimezone
      }

      setUserTimezone(newProfile?.timezone || detectedTimezone)
      return newProfile?.timezone || detectedTimezone
    } catch (error) {
      console.error('Error in ensureUserProfile:', error)
      // Always fall back to detected timezone
      const detectedTimezone = detectTimezone()
      setUserTimezone(detectedTimezone)
      return detectedTimezone
    }
  }

  useEffect(() => {
    // Prevent multiple simultaneous calls
    let mounted = true
    
    // Add a timeout fallback
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setUser(null)
        setLoading(false)
      }
    }, 10000)
    
    // Try to get session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        clearTimeout(timeoutId)
        
        if (error) {
          setUser(null)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await ensureUserProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        if (!mounted) return
        clearTimeout(timeoutId)
        setUser(null)
        setLoading(false)
      }
    }
    
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        setUser(session?.user ?? null)
        if (session?.user) {
          await ensureUserProfile(session.user.id)
        }
        setLoading(false)
      }
    )
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
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
    if (!error) {
      // Force a page refresh to clear all state
      window.location.href = '/'
    }
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