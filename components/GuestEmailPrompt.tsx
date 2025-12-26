'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { z } from 'zod'
import { setGuestUser } from '@/lib/guest'
import { setGuestCookie } from '@/lib/actions/guest.actions'
import { useRouter } from 'next/navigation'

interface GuestEmailPromptProps {
  onCancel: () => void
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const GuestEmailPrompt = ({ onCancel }: GuestEmailPromptProps) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate email
    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    setIsLoading(true)
    
    try {
      // Store guest user in sessionStorage (client-side)
      setGuestUser(email)
      
      // Set cookie for server-side detection
      await setGuestCookie(email)
      
      // Navigate to dashboard
      router.push('/')
    } catch (error) {
      console.error('Error setting guest user:', error)
      setError('Failed to continue as guest. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm max-w-md w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-20 font-semibold text-gray-900">
          Continue as Guest
        </h2>
        <p className="text-14 font-normal text-gray-600">
          Enter your email to preview the dashboard. You can sign up anytime to unlock all features.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="guest-email" className="text-14 font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="guest-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className="input-class"
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <p className="text-12 text-red-500">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="flex-1 form-btn"
          >
            {isLoading ? 'Loading...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default GuestEmailPrompt

