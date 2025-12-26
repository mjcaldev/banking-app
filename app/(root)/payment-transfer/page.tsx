import PaymentTransferForm from '@/components/PaymentTransferForm'
import HeaderBox from '@/components/ui/HeaderBox'
import GuestUpgradePrompt from '@/components/GuestUpgradePrompt'
import { getAccounts } from '@/lib/actions/bank.actions'
import getLoggedInUser from '@/lib/actions/user.actions'
import { getGuestUserServer, createGuestUserObjectServer } from '@/lib/guest-server'
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser()
  let user: User | null = loggedIn;
  let isGuest = false;
  
  if (!user) {
    const guestEmail = await getGuestUserServer();
    if (guestEmail) {
      user = createGuestUserObjectServer(guestEmail);
      isGuest = true;
    }
  }
  
  if (!user) return;

  // Show upgrade prompt for guests
  if (isGuest) {
    return (
      <section className="payment-transfer">
        <GuestUpgradePrompt 
          title="Payment Transfer"
          message="Sign in or create an account to transfer funds between your accounts."
        />
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: user.$id
  })

  if(!accounts) return;

  const accountsData = accounts?.data;
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