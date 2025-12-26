/**
 * Server-side guest utilities
 * Checks for guest state from cookies/headers (for server components)
 */

import { cookies } from 'next/headers'

const GUEST_COOKIE_KEY = 'luno_guest_email'

/**
 * Check if user is a guest (server-side)
 * Returns guest email if guest, null otherwise
 */
export async function getGuestUserServer(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const guestEmail = cookieStore.get(GUEST_COOKIE_KEY);
    return guestEmail?.value || null;
  } catch {
    return null;
  }
}

/**
 * Create guest user object for server components
 * This is a pure utility function, not a server action
 */
export function createGuestUserObjectServer(email: string): User {
  return {
    $id: 'guest',
    email,
    userId: 'guest',
    dwollaCustomerUrl: '',
    dwollaCustomerId: '',
    firstName: 'Guest',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    dateOfBirth: '',
    ssn: '',
  };
}

