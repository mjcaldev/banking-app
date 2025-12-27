'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions'
import { isGuestUser } from '@/lib/guest'
import Link from 'next/link'

const AddBankButton = ({ user }: { user: User }) => {
  const router = useRouter()
  const isGuest = isGuestUser() || user?.userId === 'guest'

  const [token, setToken] = useState('')
  const [isLoadingToken, setIsLoadingToken] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip token fetch for guests
    if (isGuest) {
      setIsLoadingToken(false)
      return
    }

    const getLinkToken = async () => {
      if (!user) {
        setError('User information is missing')
        setIsLoadingToken(false)
        return
      }

      try {
        setIsLoadingToken(true)
        setError(null)
        const data = await createLinkToken(user)

        if (data?.linkToken) {
          setToken(data.linkToken)
        } else {
          setError('Failed to create link token')
        }
      } catch (err) {
        console.error('Error getting Plaid link token:', err)
        setError('Unable to connect to bank. Please try again.')
      } finally {
        setIsLoadingToken(false)
      }
    }

    getLinkToken()
  }, [user, isGuest])

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    await exchangePublicToken({
      publicToken: public_token,
      user,
    })

    router.push('/')
  }, [user, router])
  
  // Memoize config to prevent unnecessary re-initializations
  const config: PlaidLinkOptions = useMemo(() => ({
    token: token || '',
    onSuccess
  }), [token, onSuccess])

  // Hook must be called unconditionally (React Rules of Hooks)
  const { open, ready } = usePlaidLink(config)

  // Show sign-in link for guests
  if (isGuest) {
    return (
      <Link href="/sign-in" className="flex gap-2">
        <Image
          src="icons/plus.svg"
          width={20}
          height={20}
          alt="plus"
        />
        <h2 className="text-14 font-semibold text-gray-600">
          Add Bank
        </h2>
      </Link>
    )
  }

  // Show loading state
  if (isLoadingToken) {
    return (
      <div className="flex gap-2 opacity-50 cursor-not-allowed">
        <Image
          src="icons/plus.svg"
          width={20}
          height={20}
          alt="plus"
        />
        <h2 className="text-14 font-semibold text-gray-600">
          Loading...
        </h2>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex gap-2">
        <Image
          src="icons/plus.svg"
          width={20}
          height={20}
          alt="plus"
        />
        <h2 className="text-14 font-semibold text-red-600">
          Error
        </h2>
      </div>
    )
  }

  // Render the add bank button
  return (
    <button
      onClick={() => open()}
      disabled={!ready || !token}
      className="flex gap-2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Image
        src="icons/plus.svg"
        width={20}
        height={20}
        alt="plus"
      />
      <h2 className="text-14 font-semibold text-gray-600">
        Add Bank
      </h2>
    </button>
  )
}

export default AddBankButton

