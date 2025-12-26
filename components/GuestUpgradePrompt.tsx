'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import HeaderBox from './ui/HeaderBox'

interface GuestUpgradePromptProps {
  title?: string
  message?: string
}

const GuestUpgradePrompt = ({ 
  title = "Sign in to continue",
  message = "Sign in or create an account to access this feature."
}: GuestUpgradePromptProps) => {
  return (
    <section className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="flex flex-col gap-6 max-w-md text-center">
        <HeaderBox 
          title={title}
          subtext={message}
        />
        
        <div className="flex flex-col gap-4 p-6 bg-bank-gradient rounded-lg border border-bankGradient">
          <p className="text-16 font-normal text-white">
            Unlock full access to manage your finances, view transactions, and transfer funds.
          </p>
          <div className="flex gap-3">
            <Link href="/sign-in" className="flex-1">
              <Button variant="outline" className="w-full bg-white text-bankGradient hover:bg-gray-50">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up" className="flex-1">
              <Button variant="outline" className="w-full bg-white text-bankGradient hover:bg-gray-50">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GuestUpgradePrompt

