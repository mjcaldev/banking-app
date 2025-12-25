'use client'

import React from 'react'
import Image from 'next/image'
import { logoutAccount } from '@/lib/actions/user.actions';
import { useRouter } from 'next/navigation';
import { isGuestUser } from '@/lib/utils';
import Link from 'next/link';

const Footer = ({ user, type = "desktop" }: FooterProps) => {
  const router = useRouter();
  const isGuest = isGuestUser(user);

  const handleLogOut = async () => {
    const loggedOut = await logoutAccount();
    if(loggedOut) router.push('/sign-in');
  }

  if (isGuest) {
    return (
      <footer className="footer">
        <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
          <p className="text-xl font-bold text-gray-700">G</p>
        </div>
        <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
          <h1 className="text-14 truncate text-gray-700 font-semibold">Guest</h1>
          <Link href="/sign-in" className="text-14 truncate font-normal text-gray-600 hover:text-bankGradient">
            Sign in to continue
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className={type === 'mobile' ?
         'footer_name-mobile' : 'footer_name'}>
        <p className="text-xl font-bold text-gray-700">
          {user?.firstName?.[0] || 'U'}
        </p>
      </div>
      <div className={type === 'mobile' ?
         'footer_email-mobile' : 'footer_email'}>
          <h1 className="text-14 truncate text-gray-700 font-semibold">{user?.firstName || 'User'}</h1>
          <p className="text-14 truncate font-normal text-gray-600">{user?.email || ''}</p>
      </div>
      <button onClick={handleLogOut} className="footer_image cursor-pointer">
        <Image src="/icons/logout.svg" fill alt="logout" />
      </button>
    </footer>
  )
}

export default Footer