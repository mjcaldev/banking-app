import PaymentTransferForm from '@/components/PaymentTransferForm'
import HeaderBox from '@/components/ui/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions'
import getLoggedInUser from '@/lib/actions/user.actions'
import { isGuestUser } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  const isGuest = !loggedIn || isGuestUser(loggedIn);

  if (isGuest) {
    return (
      <section className="payment-transfer">
        <HeaderBox 
          title="Payment Transfer"
          subtext="Sign in to transfer money quickly and securely."
        />
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
          <p className="text-16 text-gray-600 text-center">
            Please sign in to transfer funds between accounts.
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
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id
  });

  if(!accounts || !accounts.data || accounts.data.length === 0) {
    return (
      <section className="payment-transfer">
        <HeaderBox 
          title="Payment Transfer"
          subtext="Connect a bank account to start transferring funds."
        />
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
          <p className="text-16 text-gray-600 text-center">
            No bank accounts connected. Connect your first bank account to get started.
          </p>
        </div>
      </section>
    );
  }

  const accountsData = accounts.data;
  
  return (
    <section className="payment-transfer">
      <HeaderBox 
        title="Payment Transfer"
        subtext="Transfer money quickly and securely. Be sure to provide relevant details or other notes here."
      />
      <section className="size-full pt-5">
        <PaymentTransferForm 
          accounts={accountsData}
        />
      </section>
    </section>
  )
}

export default Transfer