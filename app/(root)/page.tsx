import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import getLoggedInUser from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransactions from '@/components/RecentTransactions';
import OnboardingView from '@/components/OnboardingView';
import GuestDashboardView from '@/components/GuestDashboardView';
import { getGuestUserServer, createGuestUserObjectServer } from '@/lib/guest-server';

const Home = async ({ searchParams }: SearchParamProps) => {  //extracting bank data. Can be applied modularly across other components. May need custom hook.
  const { id, page } = await searchParams //the following is  possible solution to a error being thrown when signing in. Error says "searchParams should be awaited before using its props"
  const currentPage = Number(page as string) || 1;
  
  // Get logged in user or guest user
  const loggedIn = await getLoggedInUser();
  let user: User | null = loggedIn;
  let isGuest = false;
  
  if (!user) {
    const guestEmail = await getGuestUserServer();
    if (guestEmail) {
      user = createGuestUserObjectServer(guestEmail);
      isGuest = true;
    }
  }
  
  if (!user) return; // This should not happen due to layout guard, but safety check

  // Render guest dashboard (no bank data needed)
  if (isGuest) {
    return (
      <section className="home">
        <div className="home-content">
          <GuestDashboardView user={user} />
        </div>
        
        <RightSidebar 
          user={user}
          transactions={[]}
          banks={[]}
        />  
      </section>
    );
  }

  // For real users, fetch accounts and determine mode
  const accounts = await getAccounts({ 
    userId: user.$id
  });

  if(!accounts) {
    // Fallback to onboarding if accounts fetch fails
    return (
      <section className="home">
        <div className="home-content">
          <OnboardingView user={user} />
        </div>
        
        <RightSidebar 
          user={user}
          transactions={[]}
          banks={[]}
        />  
      </section>
    );
  }

  const accountsData = accounts?.data || [];
  
  // Determine user mode: "onboarding" | "full"
  const userMode = accountsData.length === 0 ? "onboarding" : "full";

  // Only fetch account details if banks exist
  let account = null;
  let appwriteItemId: string | undefined = undefined;
  
  if (userMode === "full") {
    appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
    if (appwriteItemId) {
      account = await getAccount({ appwriteItemId });
    }
  }

  // Render onboarding state for users without banks
  if (userMode === "onboarding") {
    return (
      <section className="home">
        <div className="home-content">
          <OnboardingView user={loggedIn} />
        </div>
        
        <RightSidebar 
          user={loggedIn}
          transactions={[]}
          banks={[]}
        />  
      </section>
    );
  }

  // Render full dashboard for users with banks
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