'use server'

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequestProcessorEnum, ProcessorTokenCreateRequest, Products } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { access } from "fs";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

function normalizeDob(dob: string) {
  // Enforce YYYY-MM-DD exactly
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new Error("Date of birth must be YYYY-MM-DD");
  }

  const date = new Date(dob);
  const today = new Date();

  const age =
    today.getFullYear() -
    date.getFullYear() -
    (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);

  if (age < 18) {
    throw new Error("User must be at least 18 years old");
  }

  return dob;
}

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error)
  }
}

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    
    await (await cookies()).set("appwrite-session", session.secret, { //there is an issue arising with .set and Promise<Read Only Request Cookies. Typescript wants me to set an awat to fix this but that is also causing issues with login
     path: "/",
     httpOnly: true,
     sameSite: "strict",
     secure: true,
  });

    const user = await getUserInfo({ userId: session.userId})

    return parseStringify(user);
    } catch (error) {
      console.error('Error creating email password session', error);
      throw error;
    }
}

export const signUp = async ({ password, ...userData}: SignUpParams) => {
  const { account, database, user } = await createAdminClient();

  let newUserAccount: any = null;

  try {
    // 1️⃣ Normalize + validate DOB BEFORE external calls
    const dateOfBirth = normalizeDob(userData.dateOfBirth);

    // 2️⃣ Create Appwrite user
    newUserAccount = await account.create(
      ID.unique(),
      userData.email,
      password,
      `${userData.firstName} ${userData.lastName}`
    );

    if (!newUserAccount) throw new Error('Error creating user');

    // 🔑 Create login session immediately
    const session = await account.createEmailPasswordSession(
      userData.email,
      password
    );
    
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // 3️⃣ Create Dwolla customer
    const dwollaCustomerUrl = await createDwollaCustomer({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      dateOfBirth,
      ssn: userData.ssn,
      address1: userData.address1,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode,
      type: 'personal'
    });

    if (!dwollaCustomerUrl) {
      throw new Error("Dwolla customer creation failed");
    }

    // 4️⃣ Persist mapping
    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        dateOfBirth,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    );

    return parseStringify(newUser);

  } catch (error) {
    // 🔁 ROLLBACK Appwrite user if Dwolla fails
    if (newUserAccount?.$id) {
      try {
        await user.delete(newUserAccount.$id);
      } catch (rollbackError) {
        console.error('Failed to rollback Appwrite user:', rollbackError);
      }
    }

    console.error('Signup failed:', error);
    throw error;
  }
}

export default async function getLoggedInUser() {  //was going to add : Promise<User | null> to override this Document type that keeps showing up. It is causing problems in root > page.tsx and other areas. Will have to research this more
  try {
    const sessionClient = await createSessionClient();
    
    // Explicitly check for null session instead of relying on exceptions
    if (!sessionClient) {
      return null;
    }

    const { account } = sessionClient;
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id})

    return parseStringify(user)
  } catch (error) {
    // Log error for debugging but return null gracefully
    console.error('Error getting logged in user:', error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const sessionClient = await createSessionClient();
    
    if (!sessionClient) {
      // No session to delete, just clear the cookie
      (await cookies()).delete('appwrite-session');
      return;
    }

    const { account } = sessionClient;
    (await cookies()).delete('appwrite-session'); //added await here to resolve the error

    await account.deleteSession('current');
  } catch (error) {
    console.error('Error during logout:', error);
    // Still try to clear the cookie even if session deletion fails
    try {
      (await cookies()).delete('appwrite-session');
    } catch (cookieError) {
      console.error('Error clearing cookie:', cookieError);
    }
  }
}

export const createLinkToken = async (user: User) => {
  try {
    if (!user || !user.userId) {
      throw new Error('User or userId is missing');
    }

    const tokenParams = {
      user: {
        client_user_id: user.userId // Use userId (Appwrite account ID) not $id (document ID)
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth','transactions','identity'] as Products[], //this was just auth and so threw an error blocking transaction data from plaid
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate(tokenParams);
    
    return parseStringify({ linkToken: response.data.link_token })
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    throw error; // Re-throw to allow proper error handling
  }
}

export const createBankAccount = async ({
userId,
bankId,
accountId,
accessToken,
fundingSourceUrl,
shareableId,

}: createBankAccountProps) => {
  try {
    // Check if account already exists
    const existingBank = await getBankByAccountId({ accountId });
    if (existingBank) {
      console.log(`Bank account with accountId ${accountId} already exists`);
      return { success: false, error: 'Account already exists', bank: parseStringify(existingBank) };
    }

    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    )

    return { success: true, bank: parseStringify(bankAccount) };

  } catch (error) {
    console.error(`Error creating bank account for accountId ${accountId}:`, error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

export const exchangePublicToken = async ({
  publicToken,
  user, 
}: exchangePublicTokenProps) => {
  try {
    //Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    //Get all accounts from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const allAccounts = accountsResponse.data.accounts;
    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as { accountId: string; error: string }[],
    };

    //Process each account returned by Plaid
    for (const accountData of allAccounts) {
      try {
        //Check if account already exists
        const existingBank = await getBankByAccountId({ accountId: accountData.account_id });
        if (existingBank) {
          console.log(`Account ${accountData.account_id} (${accountData.name}) already exists, skipping`);
          results.skipped.push(accountData.account_id);
          continue;
        }

        //Create a processor token for Dwolla using the access token and account ID
        const request : ProcessorTokenCreateRequest = {
          access_token: accessToken,
          account_id: accountData.account_id,
          processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
        }

        const processorTokenResponse = await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token;

        //Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
        const fundingSourceUrl = await addFundingSource({
          dwollaCustomerId: user.dwollaCustomerId,
          processorToken,
          bankName: accountData.name,
        })

        //If the funding source URL is not created, skip this account
        if(!fundingSourceUrl) {
          console.error(`Failed to create funding source for account ${accountData.account_id}`);
          results.errors.push({ accountId: accountData.account_id, error: 'Failed to create funding source' });
          continue;
        }

        //Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareable ID
        const createResult = await createBankAccount({
          userId: user.$id,
          bankId: itemId,
          accountId: accountData.account_id,
          accessToken,
          fundingSourceUrl,
          shareableId: encryptId(accountData.account_id),
        });

        if (createResult.success) {
          results.created.push(accountData.account_id);
          console.log(`Successfully created bank account for ${accountData.account_id} (${accountData.name})`);
        } else {
          results.skipped.push(accountData.account_id);
        }

      } catch (accountError) {
        console.error(`Error processing account ${accountData.account_id}:`, accountError);
        results.errors.push({ 
          accountId: accountData.account_id, 
          error: accountError instanceof Error ? accountError.message : 'Unknown error' 
        });
        // Continue processing other accounts even if one fails
      }
    }

    //Log summary
    console.log(`Bank linking complete: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`);

    //If at least one account was created, consider it a success
    if (results.created.length === 0 && results.errors.length > 0) {
      throw new Error(`Failed to link any accounts: ${results.errors.map(e => `${e.accountId} (${e.error})`).join(', ')}`);
    }

    return results;

  } catch (error) {
    console.error("An error occurred while exchanging public token:", error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error)
  }
}

export const getBank = async ({ documentId }: getBankProps): Promise<Bank |undefined> => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])] // the same as the above function but targeting documentId instead of userId and using getBank(no 'S')props.
    )

    return parseStringify(bank.documents[0] as unknown as Bank);
  } catch (error) {
    console.log(error)
  }
}

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps): Promise<Bank |undefined> => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])] // the same as the above function but targeting documentId instead of userId and using getBank(no 'S')props.
    )

    if(bank.total !== 1) return; // putting "return null" threw an error saying bank cannot reutnr undefined.

    return parseStringify(bank.documents[0] as unknown as Bank);
  } catch (error) {
    console.log(error)
  }
}

