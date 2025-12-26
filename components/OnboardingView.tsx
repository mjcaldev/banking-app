'use client'

import PlaidLink from './PlaidLink'
import HeaderBox from './ui/HeaderBox'

interface OnboardingViewProps {
  user: User
}

const OnboardingView = ({ user }: OnboardingViewProps) => {
  return (
    <>
      <header className="home-header">
        <HeaderBox 
          type="greeting"
          title="Welcome"
          user={user?.firstName || 'Guest'}
          subtext="Link your bank account to get started with your financial dashboard."
        />
      </header>
      
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="flex flex-col gap-4 max-w-md text-center">
          <h2 className="text-24 font-semibold text-gray-900">
            Connect Your Bank Account
          </h2>
          <p className="text-16 font-normal text-gray-600">
            Securely connect your bank account to view your transactions, manage your finances, and track your spending.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <PlaidLink user={user} variant="primary" />
        </div>
      </div>
    </>
  )
}

export default OnboardingView

