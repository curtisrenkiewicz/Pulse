'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PulseyAvatar } from '@/components/icons/PulseIcons'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setMessage(error.message)
      } else if (isSignUp) {
        setMessage('Check your email to confirm your account!')
      } else {
        setMessage('Successfully signed in! Redirecting...')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    }

    setLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-6">
            <PulseyAvatar className="w-14 h-14 text-black" />
            <div className="flex flex-col items-center gap-0.5">
              <h1 className="text-lg font-semibold">Welcome to Pulse</h1>
              <div className="text-center text-md text-muted-foreground">
                {isSignUp ? "Already have an account? " : "First time here? "}
                <a 
                  href="#" 
                  className="underline underline-offset-4"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsSignUp(!isSignUp)
                  }}
                >
                  {isSignUp ? 'Sign in' : 'Sign up for free'}
                </a>
              </div>
            </div>
          </div>
          
          {message && (
            <div className={cn(
              "text-sm px-3 py-2 rounded-md text-center",
              message.includes('error') || message.includes('Invalid') || message.includes('occurred')
                ? 'text-red-600 bg-red-50' 
                : 'text-green-600 bg-green-50'
            )}>
              {message}
            </div>
          )}
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Sign Up' : 'Login'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}