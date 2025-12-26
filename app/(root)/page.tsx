import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import getLoggedInUser from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransactions from '@/components/RecentTransactions';
import OnboardingView from '@/components/OnboardingView';

const Home = async ({ searchParams }: SearchParamProps) => {  //extracting bank data. Can be applied modularly across other components. May need custom hook.
  const { id, page } = await searchParams //the following is  possible solution to a error being thrown when signing in. Error says "searchParams should be awaited before using its props"
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser() //(await getLoggedInUser()) as User | null; to ensure User
  if (!loggedIn) return; // addressing the potential null value of loggedIn from getLoggedInUser
  const accounts = await getAccounts({ 
    userId: loggedIn.$id
    })

  if(!accounts) return;

  const accountsData = accounts?.data || [];
  
  // Determine user mode: "onboarding" | "full" (future: "guest")
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