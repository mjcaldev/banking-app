import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import getLoggedInUser from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { isGuestUser, createGuestUser } from '@/lib/utils';
import RecentTransactions from '@/components/RecentTransactions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Home = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  const isGuest = !loggedIn || isGuestUser(loggedIn);
  const user = loggedIn || createGuestUser();

  // For guests, show welcome message with sign up option
  if (isGuest) {
    return (
      <section className="home">
        <div className="home-content">
          <header className="home-header">
            <HeaderBox 
              type="greeting"
              title="Welcome"
              user="Guest"
              subtext="Sign up or sign in to access your banking information and manage your accounts."
            />
            <div className="flex flex-col gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart">
              <h2 className="text-24 font-semibold text-gray-900">Get Started</h2>
              <p className="text-16 text-gray-600">
                Create an account to connect your bank accounts, view transactions, and transfer funds securely.
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
          </header>
        </div>
        <RightSidebar 
          user={user}
          transactions={[]}
          banks={[]}
        />  
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id
  });

  if(!accounts) {
    return (
      <section className="home">
        <div className="home-content">
          <header className="home-header">
            <HeaderBox 
              type="greeting"
              title="What's good"
              user={loggedIn?.firstName || 'Guest'}
              subtext="No bank accounts connected yet. Connect your first bank to get started."
            />
          </header>
        </div>
        <RightSidebar 
          user={loggedIn}
          transactions={[]}
          banks={[]}
        />  
      </section>
    );
  }

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  const account = await getAccount({ appwriteItemId });
  
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="What's good"
            user={loggedIn?.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox 
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />

        </header>
        <RecentTransactions 
          accounts={accountsData}
          transactions={account?.transactions}
          appwriteItemId={appwriteItemId}
          page={currentPage}
        />
      </div>
      
      <RightSidebar 
        user={loggedIn}
        transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      />  
    </section>
  );
};
export default Home