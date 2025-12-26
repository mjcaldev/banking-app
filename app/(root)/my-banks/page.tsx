import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/ui/HeaderBox'
import GuestUpgradePrompt from '@/components/GuestUpgradePrompt'
import { getAccounts } from '@/lib/actions/bank.actions';
import getLoggedInUser from '@/lib/actions/user.actions';
import { getGuestUserServer, createGuestUserObjectServer } from '@/lib/guest-server';
import React from 'react'

const MyBanks = async () => {
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
      <section className="flex">
        <div className="my-banks">
          <GuestUpgradePrompt 
            title="My Bank Accounts"
            message="Sign in or create an account to view and manage your bank accounts."
          />
        </div>
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: user.$id
    })
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
          <div className="flex flex-wrap gap-6">
            {accounts && accounts.data.map((a: Account) => (
              <BankCard 
                key={accounts.id}
                account={a}
                userName={user?.firstName}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks