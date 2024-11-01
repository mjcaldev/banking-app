import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import getLoggedInUser from '@/lib/actions/user.actions';

const Home = async () => {
  const loggedIn = (await getLoggedInUser()) as User | null;
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
         <HeaderBox 
         type="greeting"
         title="Welcome"
         user={loggedIn?.name || 'Guest'}
         subtext="Access and manage your account and transactions efficiently."
         />

        <TotalBalanceBox 
        accounts={[]}
        totalBanks={1}
        totalCurrentBalance={1250.35}
        />

        </header>


      </div>
      
      {loggedIn ? (
  <RightSidebar 
    user={loggedIn}
    transactions={[]}
    banks={[{currentBalance: 123.50}, {currentBalance: 125.50}]}
  />
) : (
  <p>Loading user information...</p>
)}
</section>
);
};
export default Home