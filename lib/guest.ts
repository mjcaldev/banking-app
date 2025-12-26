'use client'

/**
 * Guest user utilities
 * Manages guest state in sessionStorage (client-side only)
 * No server-side persistence, no Appwrite integration
 */

export interface GuestUser {
  email: string;
  isGuest: true;
}

const GUEST_STORAGE_KEY = 'mjcal_guest_user';

/**
 * Check if current user is a guest
 */
export function isGuestUser(): boolean {
  if (typeof window === 'undefined') return false;
  const guestData = sessionStorage.getItem(GUEST_STORAGE_KEY);
  return guestData !== null;
}

/**
 * Get guest user data
 */
export function getGuestUser(): GuestUser | null {
  if (typeof window === 'undefined') return null;
  const guestData = sessionStorage.getItem(GUEST_STORAGE_KEY);
  if (!guestData) return null;
  try {
    return JSON.parse(guestData);
  } catch {
    return null;
  }
}

/**
 * Set guest user (store email only)
 */
export function setGuestUser(email: string): void {
  if (typeof window === 'undefined') return;
  const guestUser: GuestUser = {
    email,
    isGuest: true,
  };
  sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
}

/**
 * Clear guest user
 */
export function clearGuestUser(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_STORAGE_KEY);
}

/**
 * Create a guest User object compatible with existing User type
 */
export function createGuestUserObject(email: string): User {
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

