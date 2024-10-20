import RightSidebar from '@/components/RightSidebar';
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';

export default function Home() {
  const loggedIn = { firstName: 'Micheal', lastName: 'Callaghan', email: 'mjcalcontact@gmail.com' };
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
         <HeaderBox 
         type="greeting"
         title="Welcome"
         user= {loggedIn?.firstName || 'Guest'}
         subtext="Access and manage your account and transactions efficiently."
         />

        <TotalBalanceBox 
        accounts={[]}
        totalBanks={1}
        totalCurrentBalance={1250.35}
        />

        </header>

        RECENT TRANSACTIONS
      </div>

      <RightSidebar 
      user={loggedIn}
      transactions={[]}
      banks={[{currentBalance: 123.50}, {currentBalance: 125.50}]}
      />
    </section>
  );
};
