'use server'
//To delete appwrite Auth users in groups.

import { Client, Users } from 'node-appwrite' //here I import Client and Users types from Appwrite SDK (instead of downloading entire library)
import dotenv from 'dotenv'; // secret/key management

dotenv.config(); // loads from .env to process.env for secure access

const client = new Client() // creating this client instance to load API info and to allow creationg of a Users instance
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) // Your API Endpoint (these are from Appwrite docs)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT) // Your project ID
    .setKey(process.env.NEXT_APPWRITE_KEY); // Your secret API key. Unlike appwrite docs, I am using a variables for additional security.

const users = new Users(client); //creating instance of Users passing client to manipulate Appwrite users with Users type methods

// This deletes a single user:

async function deleteUserId(userId) {
  try {
    const userExists = await users.get(userId);
    if(userExists) {
      await users.delete(userId);
      console.log(`User with ID ${userId} has been deleted.`);
    } else {
      console.log(`User with ID ${userId} does not exist.`);
    }
  } catch (error) {
    console.error(`Error deleting ${userId}: ${error}`);
    throw error; // Re-throw to allow error handling in batch function
  }
}

// deleteUserId()


// How to repeat this for all users using async batch approach (instead of for loop which is slow or async all which may overload server):
async function batchDeleteAllUsers(batchSize = 10) {
  try {
    const usersList = await users.list(); //Here I am accessing the list method of User type to get the list of users for batch deletion
    let batch = []; 

    for (let i = 0; i < usersList.users.length; i++) { //iterating over the list, pushing batches of user ids to the deleteUser function, and then reinitializing the batch array to store the next batch
      batch.push(deleteUserId(usersList.users[i].$id));

      if(batch.length === batchSize || i === usersList.users.length - 1) {
        await Promise.all(batch);
        batch = [];
      }
    }

    console.log('All users successfully deleted.')
    
  } catch (error) {
    console.error(`Error deleting all users: ${error}`); // using this approach instead of error.message to see stack trace
  }

}

batchDeleteAllUsers();


/*
History of this code:

Here is the original script from Appwrite:
const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('<YOUR_PROJECT_ID>') // Your project ID
    .setKey('<YOUR_API_KEY>'); // Your secret API key

const users = new sdk.Users(client);

const result = await users.delete(
    '<USER_ID>' // userId
);

This did not work for multiple reasons.
1. It was better to use import User and Client to avoid importing the whole sdk library
2. I needed to ensure all of my inputs in .setEndpoint, .setProject, and .setKey were strings.
3. I needed to exluced the <> in the .setEndpoint, .setProject, and .setKey
4. I needed to use the sdk endpoint instead of the raw REST endpoint .setEndpoint('https://cloud.appwrite.io/v1')
5. It is better form to use try catch blocks to properly handle errors and to show success messages.
*/