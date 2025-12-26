'use server'

/**
 * Server action for setting guest cookie
 */

import { cookies } from 'next/headers'

const GUEST_COOKIE_KEY = 'mjcal_guest_email'

export async function setGuestCookie(email: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(GUEST_COOKIE_KEY, email, {
      path: '/',
      maxAge: 86400, // 24 hours
      sameSite: 'lax',
      httpOnly: false, // Needs to be accessible from client for sessionStorage sync
    });
  } catch (error) {
    console.error('Error setting guest cookie:', error);
  }
}

