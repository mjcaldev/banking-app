import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from './ui/button'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import Image from 'next/image';

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLinkToken = async () => {
      if (!user) {
        setError('User information is missing');
        setIsLoadingToken(false);
        return;
      }

      try {
        setIsLoadingToken(true);
        setError(null);
        const data = await createLinkToken(user);

        if (data?.linkToken) {
          setToken(data.linkToken);
        } else {
          setError('Failed to create link token');
        }
      } catch (err) {
        console.error('Error getting Plaid link token:', err);
        setError('Unable to connect to bank. Please try again.');
      } finally {
        setIsLoadingToken(false);
      }
    }

    getLinkToken();
  }, [user]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    await exchangePublicToken({
      publicToken: public_token,
      user,
    })

    router.push('/');
  }, [user, router])
  
  // Memoize config to prevent unnecessary re-initializations
  // Always provide a token (empty string if not ready) to prevent multiple script loads
  const config: PlaidLinkOptions = useMemo(() => ({
    token: token || '', // Use empty string if no token yet - hook requires this
    onSuccess
  }), [token, onSuccess])

  // Hook must be called unconditionally (React Rules of Hooks)
  // The library should handle empty tokens gracefully
  const { open, ready } = usePlaidLink(config);
  
  if (isLoadingToken) {
    return (
      <Button disabled className="plaidlink-primary">
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-red-600">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="plaidlink-primary"
        >
          Retry
        </Button>
      </div>
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
        <Button onClick={() => open()} variant="ghost" className="plaidlink-ghost" disabled={!ready || !token}>
          <Image 
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='hiddenl text-[16px] font-semibold text-black-2 xl:block'>Connect bank</p>
        </Button>
      ): (
        <Button onClick={() => open()} className="plaidlink-default" disabled={!ready || !token}>
          <Image 
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='text-[16px] font-semibold text-black-2'>Connect bank</p>
        </Button>
      )}
    </>
  )
}

export default PlaidLink