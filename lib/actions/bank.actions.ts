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
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db - each bank document represents one account
    const banks = await getBanks({ userId });
    if (!banks || banks.length === 0) return;

    const accounts = await Promise.all(
      banks.map(async (bank: Bank) => {
        try {
          // get all accounts from plaid for this access token
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });

          // Find the account that matches the accountId stored in our database
          const accountData = accountsResponse.data.accounts.find(
            (acc) => acc.account_id === bank.accountId
          );

          if (!accountData) {
            console.error(`Account ${bank.accountId} not found in Plaid response`);
            // Return a fallback account object with data from database
            return {
              id: bank.accountId,
              availableBalance: 0,
              currentBalance: 0,
              institutionId: '',
              name: 'Account not found',
              officialName: null,
              mask: '',
              type: 'unknown',
              subtype: 'unknown',
              appwriteItemId: bank.$id,
              shareableId: bank.shareableId,
            };
          }

          // get institution info from plaid
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });

          const account = {
            id: accountData.account_id,
            availableBalance: accountData.balances.available ?? 0,
            currentBalance: accountData.balances.current ?? 0,
            institutionId: institution.institution_id,
            name: accountData.name,
            officialName: accountData.official_name ?? null,
            mask: accountData.mask ?? '',
            type: accountData.type as string,
            subtype: accountData.subtype ?? '',
            appwriteItemId: bank.$id,
            shareableId: bank.shareableId,
          };

          return account;
        } catch (error) {
          console.error(`Error fetching account details for bank ${bank.$id}:`, error);
          // Return a fallback account object
          return {
            id: bank.accountId,
            availableBalance: 0,
            currentBalance: 0,
            institutionId: '',
            name: 'Error loading account',
            officialName: null,
            mask: '',
            type: 'unknown',
            subtype: 'unknown',
            appwriteItemId: bank.$id,
            shareableId: bank.shareableId,
          };
        }
      })
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    throw error;
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    // get bank from db - this represents one account
    const bank = await getBank({ documentId: appwriteItemId });
    if (!bank) {
      throw new Error(`Bank account with ID ${appwriteItemId} not found`);
    }

    // get all accounts from plaid for this access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });

    // Find the account that matches the accountId stored in our database
    const accountData = accountsResponse.data.accounts.find(
      (acc) => acc.account_id === bank.accountId
    );

    if (!accountData) {
      throw new Error(`Account ${bank.accountId} not found in Plaid response`);
    }

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferTransactions = transferTransactionsData?.documents.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
      })
    ) || [];

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    if (!institution) {
      throw new Error('Failed to get institution information');
    }

    // get transactions for this specific account
    const allPlaidTransactions = (await getTransactions({
      accessToken: bank.accessToken,
    })) || [];

    // Filter transactions to only include those for this account
    const transactions = allPlaidTransactions.filter(
      (txn: any) => txn.accountId === bank.accountId
    );

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available ?? 0,
      currentBalance: accountData.balances.current ?? 0,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name ?? null,
      mask: accountData.mask ?? '',
      type: accountData.type as string,
      subtype: accountData.subtype ?? '',
      appwriteItemId: bank.$id,
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
    throw error;
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let transactions: any = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      transactions = response.data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url,
      }));

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};