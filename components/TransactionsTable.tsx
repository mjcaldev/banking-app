import React from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAmount, formatDateTime, getTransactionStatus, removeSpecialCharacters } from '@/lib/utils'


const TransactionsTable = ({ transactions }: TransactionTableProps) => {   //deconstruct transactions from table body THIS IS WHERE THE DATA IS COMING FROM
  return ( // below in main header added a special class to header "bg-[#f9fafb]"
    //below in table header added class px-2 to add some space
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader className="bg-[#f9fafb]">                        
        <TableRow>
          <TableHead className="px-2">Transactions</TableHead>
          <TableHead className="px-2">Amount</TableHead>
          <TableHead className="px-2">Status</TableHead>
          <TableHead className="px-2">Date</TableHead>
          <TableHead className="px-2 max-md:hidden">Channel</TableHead>
          <TableHead className="px-2 max-md:hidden">Category</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
       {transactions.map((t: Transaction ) => {                  // this maps over all transactions
        const status = getTransactionStatus(new Date(t.date))
        const amount = formatAmount(t.amount)

        const isDebit = t.type === 'debit';
        const isCredit = t.type === 'credit';

        return (
          <TableRow key={t.id}>
            <TableCell>
              <div>
                <h1>
                  {removeSpecialCharacters(t.name)}
                </h1>
              </div>
            </TableCell>
            <TableCell>
              {isDebit ? `-{amount}` : isCredit ? amount : amount}
            </TableCell>
            <TableCell>
              {status}
            </TableCell>
            <TableCell>
              {formatDateTime(new Date(t.date)).dateTime}
            </TableCell>
          </TableRow>
        )
       })}
      </TableBody>
    </Table>

  )
}

export default TransactionsTable