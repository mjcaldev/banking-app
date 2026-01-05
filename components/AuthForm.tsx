'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import Image from 'next/image'

import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import CustomInput from './CustomInput'
import StateSelect from './StateSelect'
import DateOfBirthInput from './DateOfBirthInput'
import { authFormSchema } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import getLoggedInUser, { signIn, signUp } from '@/lib/actions/user.actions'
import { Models } from 'node-appwrite'
import PlaidLink from './PlaidLink'
import GuestEmailPrompt from './GuestEmailPrompt'


const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(null);
  const [isLoading, setisLoading] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

const formSchema = authFormSchema(type);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
        firstName: type === 'sign-up' ? "" : undefined,
        lastName: type === 'sign-up' ? "" : undefined,
        address1: type === 'sign-up' ? "" : undefined,
        city: type === 'sign-up' ? "" : undefined,
        state: type === 'sign-up' ? "" : undefined,
        postalCode: type === 'sign-up' ? "" : undefined,
        dateOfBirth: type === 'sign-up' ? "" : undefined,
        ssn: type === 'sign-up' ? "123-45-6789" : undefined,
      },
    })
   
    // 2. Define a submit handler.
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
      setisLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        // signup with App write and create plaid token
        if(type === 'sign-up') {
          const userData = {
            firstName: data.firstName!,
            lastName: data.lastName!,
            address1: data.address1!,
            city: data.city!,
            state: data.state!,
            postalCode: data.postalCode!,
            dateOfBirth: data.dateOfBirth!,
            ssn: '123-45-6789', // Fixed value
            email: data.email,
            password: data.password
          }

          const newUser = await signUp(userData);

          setUser(newUser as unknown as User);
          setSuccessMessage('Account created successfully! Please link your bank account.');
          // PlaidLink component will handle navigation after bank linking succeeds
        }

        if (type === 'sign-in') {
          const response = await signIn({
            email: data.email,
            password: data.password,
          })

          if(response) {
            setSuccessMessage('Sign in successful! Redirecting...');
            // Small delay to show success message before redirect
            setTimeout(() => {
              router.push('/');
            }, 500);
          }
         }
      } catch (error: any) {
        console.error('Authentication error:', error);
        
        // Provide user-friendly error messages without exposing sensitive details
        // Appwrite errors typically have a message property
        const errorMsg = error?.message || error?.toString() || 'An error occurred';
        
        // Map common Appwrite errors to user-friendly messages
        if (errorMsg.includes('Invalid credentials') || 
            errorMsg.includes('email') && errorMsg.includes('password') ||
            errorMsg.includes('401') ||
            errorMsg.includes('Unauthorized')) {
          setErrorMessage('Invalid email or password. Please try again.');
        } else if (errorMsg.includes('User already exists') || 
                   errorMsg.includes('409')) {
          setErrorMessage('An account with this email already exists.');
        } else if (errorMsg.includes('network') || 
                   errorMsg.includes('timeout') ||
                   errorMsg.includes('ECONNREFUSED')) {
          setErrorMessage('Network error. Please check your connection and try again.');
        } else {
          // Generic error message - don't expose internal error details
          setErrorMessage('Unable to sign in. Please check your credentials and try again.');
        }
      } finally {
      setisLoading(false);
    }
  }

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
      <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image 
          src="/icons/logo.svg"
          width={34}
          height={34}
          alt="Muno Logo"
          />
            <h1 className="text-30 font-ibm-plex-serif font-bold text-black-1">Muno</h1>
          </Link>
          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
              {user
              ? 'Link Account'
              : type === 'sign-in'
                ? 'Sign In'
                : 'Sign Up'
              }
              <p className="text-16 font-normal text-gray-600">
                {user
                  ? 'Link your account to get started'
                  : 'Please enter your details'
                }
              </p>
            </h1>
          </div>
      </header>
      {user ? (
        <div className="flex flex-col gap-4">
          <PlaidLink user={user} variant="primary" />
        </div>
      ): (
        <>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {type === 'sign-up' && (
            <>
              <div className="flex gap-4">
                <CustomInput control={form.control} name='firstName'
                label="First Name" placeholder='Enter your first name'/>
                <CustomInput control={form.control} name='lastName'
                label="Last Name" placeholder='Enter your last name'/>
              </div>
              <CustomInput control={form.control} name='address1'
              label="Address" placeholder='Enter your address'/>
              <CustomInput control={form.control} name='city'
                label="City" placeholder='Enter your city'/>
              <div className="flex gap-4">
                <StateSelect control={form.control} name='state' label="State" />
                <CustomInput control={form.control} name='postalCode'
                label="Postal Code" placeholder='Example: 11101'/>
              </div>
              <div className="flex gap-4">
                <DateOfBirthInput control={form.control} name='dateOfBirth' label="Date of Birth" />
                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <div className="form-item">
                      <FormLabel className="form-label">SSN</FormLabel>
                      <div className="flex w-full flex-col">
                        <FormControl>
                          <Input
                            {...field}
                            value="123-45-6789"
                            disabled
                            readOnly
                            className="input-class bg-gray-100"
                            onChange={() => {}} // Prevent changes
                          />
                        </FormControl>
                        <FormMessage className="form-message" />
                      </div>
                    </div>
                  )}
                />
              </div>
            </>
          )}

            <CustomInput control={form.control} name='email'
            label="Email" placeholder='Enter your email'/>
            <CustomInput control={form.control} name='password'
            label="Password" placeholder='Enter your password'/>
          
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-lg bg-success-25 border border-success-100">
              <p className="text-sm font-medium text-success-900">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-900">{errorMessage}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading} className="form-btn">
              {isLoading ? (
                <>
                  <Loader2 size={20}
                  className="animate-spin" /> &nbsp;
                  Loading...
                </>
                
              ): type === 'sign-in'
              ? 'Sign-in' : 'Sign-Up'}
            </Button>
          </div>
        </form>
      </Form>

      <footer className="flex flex-col gap-4">
        <div className="flex justify-center gap-1">
          <p className="text-14 font-normal text-gray-600">
            {type === 'sign-in'
            ? "Don't have an account?"
            : "Already have an account?"
            }
          </p>
          <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className="form-link">
          {type === 'sign-in' ? 'Sign up' : 'Sign in'}
          </Link>
        </div>

        {type === 'sign-in' && (
          <div className="flex flex-col gap-2">
            <div className="relative flex items-center gap-2 my-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-12 font-normal text-gray-500 px-2">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGuestPrompt(true)}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Continue as Guest
            </Button>
          </div>
        )}
      </footer>

        </>
      )}

      {showGuestPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GuestEmailPrompt onCancel={() => setShowGuestPrompt(false)} />
        </div>
      )}
    </section>
  )
}
export default AuthForm