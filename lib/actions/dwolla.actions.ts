"use server";

import { Client } from "dwolla-v2";

const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV;

  // Default to sandbox in development if not set
  if (!environment) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DWOLLA_ENV must be set in production. Set it to either 'sandbox' or 'production'"
      );
    }
    console.warn("DWOLLA_ENV not set, defaulting to 'sandbox' for development");
    return "sandbox";
  }

  switch (environment.toLowerCase()) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        `Invalid DWOLLA_ENV value: "${environment}". Must be either 'sandbox' or 'production'`
      );
  }
};

// Lazy initialization of Dwolla client to avoid errors at module load time
let dwollaClient: Client | null = null;

const getDwollaClient = (): Client => {
  if (!dwollaClient) {
    const key = process.env.DWOLLA_KEY;
    const secret = process.env.DWOLLA_SECRET;

    if (!key || !secret) {
      throw new Error(
        "DWOLLA_KEY and DWOLLA_SECRET must be set in environment variables"
      );
    }

    dwollaClient = new Client({
      environment: getEnvironment(),
      key,
      secret,
    });
  }

  return dwollaClient;
};

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
): Promise<string | null> => {
  try {
    const client = getDwollaClient();
    return await client
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Funding Source Failed: ", err);
    return null;
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const client = getDwollaClient();
    const onDemandAuthorization = await client.post(
      "on-demand-authorizations"
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
    return null;
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
): Promise<string | null> => {
  try {
    const client = getDwollaClient();
    return await client
      .post("customers", newCustomer)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Dwolla Customer Failed: ", err);
    return null;
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams): Promise<string | null> => {
  try {
    const client = getDwollaClient();
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await client
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Transfer fund failed: ", err);
    return null;
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams): Promise<string | null> => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    if (!dwollaAuthLinks) {
      console.error("Failed to create on-demand authorization");
      return null;
    }

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error("Adding funding source failed: ", err);
    return null;
  }
};