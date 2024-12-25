'use client'

import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorError,
  getMultiFactorResolver,
  MultiFactorResolver,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/loading'

interface FirebaseAuthError extends Error {
  code?: string
  message: string
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isMFARequired, setIsMFARequired] = useState(false)
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null) // Reset error message
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as FirebaseAuthError
        switch (authError.code) {
          case 'auth/invalid-credential':
            setErrorMessage('Invalid credentials. Please check your email and password.')
            break
          case 'auth/user-not-found':
            setErrorMessage('No user found with this email. Please sign up.')
            break
          case 'auth/wrong-password':
            setErrorMessage('Incorrect password. Please try again.')
            break
          case 'auth/multi-factor-auth-required':
            setIsMFARequired(true)
            const resolver = getMultiFactorResolver(auth, error as MultiFactorError)
            setMfaResolver(resolver)
            break
          default:
            setErrorMessage('An unexpected error occurred. Please try again.')
            console.error('Error signing in:', authError.message)
        }
      } else {
        setErrorMessage('An unknown error occurred. Please try again.')
        console.error('Unknown error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaResolver) return

    setErrorMessage(null) // Reset error message
    try {
      const phoneAuthProvider = new PhoneAuthProvider(auth)
      const phoneInfoOptions = {
        multiFactorHint: mfaResolver.hints[0],
        session: mfaResolver.session,
      }
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions)
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode)
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred)
      await mfaResolver.resolveSignIn(multiFactorAssertion)
      router.push('/')
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        setErrorMessage((error as FirebaseAuthError).message)
        console.error('Error completing MFA:', (error as FirebaseAuthError).message)
      } else {
        setErrorMessage('An unknown MFA error occurred. Please try again.')
        console.error('Unknown MFA error:', error)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl transform transition-all hover:scale-105">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isMFARequired ? 'Multi-Factor Authentication' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isMFARequired ? 'Enter the verification code sent to your device' : 'Sign in to access your dashboard'}
          </p>
        </div>
        {errorMessage && (
          <div className="text-red-500 text-sm text-center mb-4">
            {errorMessage}
          </div>
        )}
        {isMFARequired ? (
          <form className="mt-8 space-y-6" onSubmit={handleMFASubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Verification Code"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pl-10"
                />
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <Button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300">
              Verify
            </Button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="relative">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pl-10"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pl-10 pr-10"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
              >
                Sign In
              </Button>
            </div>
          </form>
        )}
        {!isMFARequired && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-300">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}