import PaymentTransferForm from '@/components/PaymentTransferForm'
import HeaderBox from '@/components/ui/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions'
import getLoggedInUser from '@/lib/actions/user.actions'
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser() //(await getLoggedInUser()) as User | null; to ensure User
  if (!loggedIn) return; // addressing the potential null value of loggedIn from getLoggedInUser
  const accounts = await getAccounts({ 
    userId: loggedIn.$id
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