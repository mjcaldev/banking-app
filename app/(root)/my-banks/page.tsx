import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/ui/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import getLoggedInUser from '@/lib/actions/user.actions';
import { isGuestUser } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  const isGuest = !loggedIn || isGuestUser(loggedIn);

  if (isGuest) {
    return (
      <section className="flex">
        <div className="my-banks">
          <HeaderBox
            title="My Bank Accounts"
            subtext="Sign in to connect and manage your bank accounts"
          />
          <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
            <p className="text-16 text-gray-600 text-center">
              Please sign in to view and manage your bank accounts.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="/sign-up">
                <Button className="form-btn">Sign Up</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="text-16 rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id
  });

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage multiple accounts in one convenient space"
        />

        <div className="space-y-4">
          <h2 className="header-2">
            Your Cards
          </h2>
          {accounts && accounts.data.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {accounts.data.map((a: Account) => (
                <BankCard 
                  key={a.id}
                  account={a}
                  userName={loggedIn?.firstName}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart">
              <p className="text-16 text-gray-600 text-center">
                No bank accounts connected yet. Connect your first bank to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MyBanks