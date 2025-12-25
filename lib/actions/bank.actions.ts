"use server";

import {
  ACHClass,
  CountryCode,
  TransferAuthorizationCreateRequest,
  TransferCreateRequest,
  TransferNetwork,
  TransferType,
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps): Promise<{
  data: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
} | null> => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });
    if (!banks || banks.length === 0) {
      return { data: [], totalBanks: 0, totalCurrentBalance: 0 };
    }

    const accounts = await Promise.all(
      banks.map(async (bank: Bank) => {
        try {
          // get each account info from plaid
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });

          if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
            return null;
          }

          const accountData = accountsResponse.data.accounts[0];

          // get institution info from plaid
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });

          const account: Account = {
            id: accountData.account_id,
            availableBalance: accountData.balances.available ?? 0,
            currentBalance: accountData.balances.current ?? 0,
            institutionId: institution?.institution_id || '',
            name: accountData.name,
            officialName: accountData.official_name || null,
            mask: accountData.mask || '',
            type: accountData.type as string,
            subtype: accountData.subtype || '',
            appwriteItemId: bank.$id,
            shareableId: bank.shareableId,
          };

          return account;
        } catch (error) {
          console.error(`Error getting account for bank ${bank.$id}:`, error);
          return null;
        }
      })
    );

    const validAccounts = accounts.filter((account): account is Account => account !== null);

    const totalBanks = validAccounts.length;
    const totalCurrentBalance = validAccounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: validAccounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return null;
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps): Promise<{
  data: Account;
  transactions: Transaction[];
} | null> => {
  try {
    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });
    if (!bank) {
      return null;
    }

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });

    if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
      return null;
    }

    const accountData = accountsResponse.data.accounts[0];

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferTransactions: Transaction[] = (transferTransactionsData?.documents || []).map(
      (transferData: any) => ({
        id: transferData.$id,
        $id: transferData.$id,
        name: transferData.name || '',
        amount: transferData.amount || 0,
        date: transferData.$createdAt || '',
        paymentChannel: transferData.channel || '',
        category: transferData.category || '',
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
        accountId: bank.accountId,
        pending: false,
        image: '',
        $createdAt: transferData.$createdAt || '',
        channel: transferData.channel || '',
        senderBankId: transferData.senderBankId || '',
        receiverBankId: transferData.receiverBankId || '',
      })
    );

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await getTransactions({
      accessToken: bank.accessToken,
    });

    const account: Account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available ?? 0,
      currentBalance: accountData.balances.current ?? 0,
      institutionId: institution?.institution_id || '',
      name: accountData.name,
      officialName: accountData.official_name || null,
      mask: accountData.mask || '',
      type: accountData.type as string,
      subtype: accountData.subtype || '',
      appwriteItemId: bank.$id,
      shareableId: bank.shareableId,
    };

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    return null;
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps): Promise<{ institution_id: string; name: string } | null> => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const institution = institutionResponse.data.institution;

    return parseStringify({
      institution_id: institution.institution_id,
      name: institution.name,
    });
  } catch (error) {
    console.error("An error occurred while getting the institution:", error);
    return null;
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps): Promise<Transaction[]> => {
  let cursor: string | undefined = undefined;
  let hasMore = true;
  let transactions: Transaction[] = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
      });

      const data = response.data;

      const newTransactions = data.added.map((transaction) => ({
        id: transaction.transaction_id,
        $id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url || "",
        $createdAt: transaction.date,
        channel: transaction.payment_channel,
        senderBankId: "",
        receiverBankId: "",
      }));

      transactions = [...transactions, ...newTransactions];
      hasMore = data.has_more;
      cursor = data.next_cursor || undefined;
    }

    return parseStringify(transactions) as Transaction[];
  } catch (error) {
    console.error("An error occurred while getting transactions:", error);
    return [];
  }
};