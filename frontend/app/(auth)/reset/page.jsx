'use client'
import React, { useState, useEffect } from 'react'
import {  useRouter } from 'next/navigation'
import api from '@/components/base-url'
import { Card } from '@heroui/card'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import Link from 'next/link'
import { Eye, EyeOffIcon } from 'lucide-react'

const ResetPassword = (params) => {
    const token = params?.searchParams?.token;
    const email = params?.searchParams?.email;

    console.log({token, email})

    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false,
    })

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isValidToken, setIsValidToken] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    const router = useRouter()

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link')
            setLoading(false)
            return
        }
        validateToken(token)
    }, [token])

    const validateToken = async (token) => {
        try {
            const response = await api.post('/auth/forgot/validate', { token, email: email })
            const data = response?.data || {}
            if (data.ok) {
                setIsValidToken(true)
            } else {
                setError(data.message || 'Invalid or expired reset link')
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to validate reset link')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        
        setLoading(true)
        try {
            const response = await api.post('/auth/forgot/reset', { token, email: email, password })
            const data = response?.data || {}
            if (data.ok) {
                setSuccess('Password reset successfully')
                setTimeout(() => router.push('/auth/login'), 1300)
            } else {
                setError(data.message || 'Failed to reset password')
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingState />

    if (!isValidToken) {
        // show error state when token invalid or validation failed
        return <IsInvalidToken error={error} />
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-lg p-6">
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-6 rounded shadow">
                    <h1 className="text-2xl font-bold text-center">Reset Password</h1>

                    {error && <div className="text-red-500 text-center">{error}</div>}
                    {success && <div className="text-green-500 text-center">{success}</div>}

                    <Input
                        type={showPassword.password ? "text" : "password"}
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        endContent={
                            showPassword.password ? (<EyeOffIcon onClick={() => setShowPassword({...showPassword, password: false})} />) : (<Eye onClick={() => setShowPassword({...showPassword, password: true})} />)
                        }
                    />

                    <Input
                        type={showPassword.confirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        endContent={
                            showPassword.confirmPassword ? (<EyeOffIcon onClick={() => setShowPassword({...showPassword, confirmPassword: false})} />) : (<Eye onClick={() => setShowPassword({...showPassword, confirmPassword: true})} />)
                        }
                    />

                    <Button
                        color='primary'
                        type="submit"
                        isLoading={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default ResetPassword

const LoadingState = () => (
    <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
            <span className="text-gray-700 dark:text-gray-300">Verifying your token...</span>
        </Card>
    </div>
)

const IsInvalidToken = ({ error }) => (
    <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2">Reset Password</h2>
            <div className="text-red-500 mb-4">{error || 'Invalid or expired reset link.'}</div>
            <Button as={Link} href="/auth/login" color='primary'>Back to login</Button>
        </Card>
    </div>
)