'use client'

import React from 'react'
import HeaderBox from './ui/HeaderBox'
import Link from 'next/link'
import { Button } from './ui/button'

interface GuestDashboardViewProps {
  user: User
}

const GuestDashboardView = ({ user }: GuestDashboardViewProps) => {
  return (
    <>
      <header className="home-header">
        <HeaderBox 
          type="greeting"
          title="Welcome"
          user="Guest"
          subtext="Preview the dashboard. Sign in or create an account to unlock all features."
        />
      </header>

      <div className="flex flex-col gap-6 py-12">
        {/* Mock Balance Box */}
        <div className="flex flex-col gap-2 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-14 font-medium text-gray-600">Total Balance</p>
              <p className="text-24 font-semibold text-gray-400">$0.00</p>
            </div>
          </div>
          <p className="text-12 text-gray-500 mt-2">
            Connect your bank account to see your balance
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="flex flex-col gap-4 p-6 bg-bank-gradient rounded-lg border border-bankGradient">
          <div className="flex flex-col gap-2">
            <h2 className="text-20 font-semibold text-white">
              Unlock Full Access
            </h2>
            <p className="text-14 font-normal text-white/90">
              Sign in or create an account to link your bank, view transactions, and manage your finances.
            </p>
          </div>
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

        {/* Mock Transactions Placeholder */}
        <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-18 font-semibold text-gray-900">Recent Transactions</h2>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-14 font-normal text-gray-500 text-center">
              Connect your bank account to view transactions
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="mt-2">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default GuestDashboardView

