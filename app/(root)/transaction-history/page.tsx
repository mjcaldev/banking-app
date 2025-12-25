import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import HeaderBox from '@/components/ui/HeaderBox'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import getLoggedInUser from '@/lib/actions/user.actions';
import { formatAmount, isGuestUser } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react'

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  const isGuest = !loggedIn || isGuestUser(loggedIn);

  if (isGuest) {
    return (
      <section className='transactions'>
        <div className="transactions-header">
          <HeaderBox title="Transaction History" subtext="Sign in to view your transaction history." />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
          <p className="text-16 text-gray-600 text-center">
            Please sign in to view your transaction history.
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
      <section className='transactions'>
        <div className="transactions-header">
          <HeaderBox title="Transaction History" subtext="Connect a bank account to view transactions." />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
          <p className="text-16 text-gray-600 text-center">
            No bank accounts connected. Connect your first bank account to view transactions.
          </p>
        </div>
      </section>
    );
  }
  
  const accountsData = accounts.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  
  const account = await getAccount({ appwriteItemId });

  if (!account || !account.transactions || account.transactions.length === 0) {
    return (
      <section className='transactions'>
        <div className="transactions-header">
          <HeaderBox title="Transaction History" subtext="See your bank details and transactions." />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-chart mt-8">
          <p className="text-16 text-gray-600 text-center">
            No transactions found for this account.
          </p>
        </div>
      </section>
    );
  }

  const rowsPerPage = 10;
  const totalPages = Math.ceil(account.transactions.length / rowsPerPage);

  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = account.transactions.slice(
    indexOfFirstTransaction, indexOfLastTransaction
  );

  return (
    <section className='transactions'>
      <div className="transactions-header">
        <HeaderBox title="Transaction History" subtext="See your bank details and transactions." />
      </div>
      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white">{account.data.name}</h2>
            <p className="text-14 text-blue-25">
              {account.data.officialName}
            </p>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
            ●●●● ●●●● ●●●● {account.data.mask}
            </p>
          </div>
          <div className="transactions-account-balance">
            <p className="text-14">Current Balance</p>
            <p className="text-24 text-center font-bold">
               {formatAmount(account.data.currentBalance)}
            </p>
          </div>
        </div>
        <section className="flex w-full flex-col gap-6">
          <TransactionsTable 
            transactions={currentTransactions}          
          />
          {totalPages > 1 && (
            <div className="my-4 w-full">
              <Pagination totalPages={totalPages} page={currentPage} />
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default TransactionHistory