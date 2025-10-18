"use client"
import React from 'react'
import api from '@/components/base-url'
import { Button } from '@heroui/button'
import Link from 'next/link'
import { Input } from '@heroui/input'
import { ArrowLeft } from 'lucide-react'

const ForgotPassword = ({ onBack }) => {
    const [email, setEmail] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(null)
    const [error, setError] = React.useState(null)

    const submit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault()
        }
        setError(null)
        setSuccess(null)
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setError('Please enter a valid email address')
            return
        }
        setLoading(true)
        try {
            let response = await api.post('/auth/forgot', { email })
            setSuccess(response?.data?.message || 'If an account exists for this email, a reset link has been sent.')
        } catch (err) {
            console.error('forgot request failed', err)
            setError(err?.response?.data?.message || 'Something went wrong. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto rounded shadow">
            <div className="flex items-center gap-1 mb-4">
                <Button isIconOnly size='sm' variant='light' color='primary' onPress={onBack} aria-label="Back to login">
                    <ArrowLeft />
                </Button>

                {/* <div className="flex items-center justify-center text-white font-bold">
                    <img src="/logo.jpeg" alt="AppSevaa" className="w-12 h-12" />
                </div> */}
                <div>
                    <div className="text-lg font-bold">AppSevaa</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">Password reset</div>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-2">Forgot your password?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">Enter the email associated with your AppSevaa account and we'll send a secure link to reset your password.</p>

            {success ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded mb-4">
                    <p className="text-green-800">{success}</p>
                    <div className="mt-3 flex gap-2">
                        {onBack ? (
                            <Button color='primary' onPress={onBack}>Back to login</Button>
                        ) : (
                            <Link href="/auth/login"><a className="text-sm text-[#c31d7b]">Back to login</a></Link>
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <Input
                            id="fp-email"
                            aria-label="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            // isInvalid={!!error}
                            // errorMessage={error}
                            placeholder="you@example.com"
                        />
                    </div>

                    {error && <div className="text-sm text-danger">{error}</div>}

                    <div className="flex items-center justify-between">
                        <Button onPress={submit} isLoading={loading} aria-label="Send reset link" color='primary'>
                            Send reset link
                        </Button>
                    </div>
                </form>
            )}

            <div className="mt-6 text-xs text-gray-400 dark:text-gray-300">If you don't receive an email, check your spam folder or try again in a few minutes.</div>
        </div>
    )
}

export default ForgotPassword