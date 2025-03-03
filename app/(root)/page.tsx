import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import getLoggedInUser from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransactions from '@/components/RecentTransactions';

const Home = async ({ searchParams }: SearchParamProps) => {  //extracting bank data. Can be applied modularly across other components. May need custom hook.
  const { id, page } = await searchParams //the following is  possible solution to a error being thrown when signing in. Error says "searchParams should be awaited before using its props"
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser() //(await getLoggedInUser()) as User | null; to ensure User
  if (!loggedIn) return; // addressing the potential null value of loggedIn from getLoggedInUser
  const accounts = await getAccounts({ 
    userId: loggedIn.$id
    })

  if(!accounts) return;

const accountsData = accounts?.data;
const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

const account = await getAccount({ appwriteItemId })
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