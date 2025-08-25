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
        console.log('User profile found with timezone:', profile.timezone)
        setUserTimezone(profile.timezone || 'UTC')
        return profile.timezone
      }

      // Create profile if it doesn't exist
      const detectedTimezone = detectTimezone()
      console.log('No profile found, creating with detected timezone:', detectedTimezone)
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
    let mounted = true
    
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Auth error:', error)
          setUser(null)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Don't await this - let it run in background
          ensureUserProfile(session.user.id).catch(err => 
            console.warn('Profile fetch failed:', err)
          )
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'user:', session?.user?.id)
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          ensureUserProfile(session.user.id).catch(err => 
            console.warn('Profile fetch failed:', err)
          )
        }
      }
    )
    
    return () => {
      mounted = false
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