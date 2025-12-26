'use client'

import React from 'react'
import Image from 'next/image'
import { logoutAccount } from '@/lib/actions/user.actions';
import { clearGuestUser, isGuestUser } from '@/lib/guest';
import { useRouter } from 'next/navigation';

const Footer = ({ user, type = "desktop" }: FooterProps) => {
  const router = useRouter();
  const isGuest = isGuestUser() || user?.userId === 'guest';
  
  const handleLogOut = async () => {
    console.log('[Footer] Logout button clicked');
    
    try {
      if (isGuest) {
        // Clear guest state (client-side only)
        clearGuestUser();
        // Clear cookie by setting it to expire
        document.cookie = 'luno_guest_email=; path=/; max-age=0';
        router.push('/sign-in');
      } else {
        // Logout real user
        const loggedOut = await logoutAccount();
        console.log('[Footer] Logout result:', loggedOut);
        
        if(loggedOut !== null) {
          router.push('/sign-in');
        }
      }
    } catch (error) {
      console.error('[Footer] Logout error:', error);
    }
  }
  
  return (
    <footer className="footer">
      <div className={type === 'mobile' ?
         'footer_name-mobile' : 'footer_name'}>
        <p className="text-xl font-bold text-gray-700">
          {user?.firstName[0]}
        </p>
      </div>
      <div className={type === 'mobile' ?
         'footer_email-mobile' : 'footer_email'}>
          <h1 className="text-14 truncate text-gray-700 font-semibold">{user?.firstName}</h1>
          <p className="text-14 truncate font-normal text-gray-600">{user?.email}</p>
      </div>
      <div 
        className="footer_image cursor-pointer"
        onClick={handleLogOut}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogOut();
          }
        }}
        aria-label="Logout"
      >
        <Image src="icons/logout.svg" fill alt="logout" />
      </div>
    </footer>
  )
}

export default Footer