"use server";

import { Client, Account, Databases, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  // Use APPWRITE_* variables (server-side only, matches createAdminClient)
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  
  const client = new Client()
    .setEndpoint(endpoint!)
    .setProject(projectId!);

  const cookieStore = await cookies();
  const session = cookieStore.get("appwrite-session");

  // Return null instead of throwing - let caller handle missing session
  if (!session || !session.value) {
    return null;
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  
  const client = new Client()
    .setEndpoint(endpoint!)
    .setProject(projectId!)
    .setKey(apiKey!);

  return {
    get account() {
      return new Account(client);
    },
    get database() {
      return new Databases(client);
    },
    get user() {
      return new Users(client);
    }
  };
}