import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import { isGuestUser } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
  const router = useRouter();
  const isGuest = isGuestUser(user);

  const [token, setToken] = useState('');

  useEffect(() => {
    if (!isGuest) {
      const getLinkToken = async () => {
        const data = await createLinkToken(user);
        setToken(data?.linkToken || '');
      }
      getLinkToken();
    }
  }, [user, isGuest]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    await exchangePublicToken({
      publicToken: public_token,
      user,
    })

    router.push('/');
  }, [user, router])
  
  const config: PlaidLinkOptions = {
    token,
    onSuccess
  }

  const { open, ready } = usePlaidLink(config);

  if (isGuest) {
    return (
      <Link href="/sign-in" className="plaidlink-default">
        <Image 
          src="/icons/connect-bank.svg"
          alt="connect bank"
          width={24}
          height={24}
        />
        <p className='text-[16px] font-semibold text-charcoal'>Sign in to connect bank</p>
      </Link>
    );
  }
  
  return (
    <>
      {variant === 'primary' ? (
        <Button
          onClick={() => open()}
          disabled={!ready || !token}
          className="plaidlink-primary"
        >
          Connect bank
        </Button>
      ): variant === 'ghost' ? (
        <Button onClick={() => open()} disabled={!ready || !token} variant="ghost" className="plaidlink-ghost">
          <Image 
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='hidden text-[16px] font-semibold text-charcoal xl:block'>Connect bank</p>
        </Button>
      ): (
        <Button onClick={() => open()} disabled={!ready || !token} className="plaidlink-default">
          <Image 
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='text-[16px] font-semibold text-charcoal'>Connect bank</p>
        </Button>
      )}
    </>
  )
}

export default PlaidLink