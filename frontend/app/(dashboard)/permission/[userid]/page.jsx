"use client"
import { useFetchPermission, useUpsertPermission } from '@/libs/mutation/permission/permission-mutations'
import React, { useMemo, useState } from 'react'
import { Save, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react'
import { Card } from '@heroui/card'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { useUser } from '@/libs/mutation/user/user-mutations'

const MODULES = ['systemuser','stock','sales','purchases','reports','organization','sessions', 'settings', 'category', 'warehouse', 'supplier', 'customer']
const ACTIONS = ['create', 'read', 'update', 'delete', 'can-approve', 'can-reject', 'can-complete' ]

const Page = ({ params }) => {
    const userId = params.userid
    const { data: userData, isLoading: gettingUser } = useUser(userId)
    const user = useMemo(() => userData?.data?.data , [userData])
    const { data: permissionsResp, isLoading: fetching, isError } = useFetchPermission(userId)
    const { mutateAsync: upsertPermission, isLoading: upserting } = useUpsertPermission()
    const [saveSuccess, setSaveSuccess] = useState(false)

    const fetched = permissionsResp?.permission || permissionsResp?.data?.permission || permissionsResp?.data || null

    const [local, setLocal] = useState(() => (fetched?.permissions) ? fetched.permissions : {})

    React.useEffect(() => {
        setLocal(fetched?.permissions || {})
    }, [fetched?.permissions])

    React.useEffect(() => {
        if (saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [saveSuccess])

    const toggle = (mod, action) => {
        setLocal(prev => {
            const modObj = { ...(prev[mod] || {}) }
            modObj[action] = !modObj[action]
            return { ...prev, [mod]: modObj }
        })
    }

    const toggleModule = (mod, enabled) => {
        setLocal(prev => ({
            ...prev,
            [mod]: {
                create: enabled,
                read: enabled,
                update: enabled,
                delete: enabled
            }
        }))
    }

    const isModuleFullyEnabled = (mod) => {
        return ACTIONS.every(action => local[mod]?.[action])
    }

    const handleSave = async () => {
        if (!userId) return alert('Missing userId')
        try {
            await upsertPermission({ userId, permissions: local })
            setSaveSuccess(true)
        } catch (err) {
            console.error('save failed', err)
        }
    }

    if (!userId) return (
        <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
            <Card className="rounded-lg shadow-lg p-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="">No user specified</span>
            </Card>
        </div>
    )

    if (fetching || gettingUser) return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-200 rounded-lg animate-pulse w-12 h-12"></div>
                            <div>
                                <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                            </div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                </div>

                {/* User Profile Skeleton */}
                <Card className="flex flex-row items-center my-4 gap-4 p-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                </Card>

                {/* Permissions Table Skeleton */}
                <Card className="rounded-xl shadow-xl overflow-hidden">
                    {/* Table Header Skeleton */}
                    <div className="bg-gradient-to-r p-6">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                            </div>
                            <div className="col-span-9">
                                <div className="grid grid-cols-4 gap-4">
                                    {ACTIONS.map(action => (
                                        <div key={action} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Body Skeleton */}
                    <div className="divide-y divide-default-100">
                        {MODULES.map((mod, idx) => (
                            <div key={mod} className="p-2">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                                        </div>
                                    </div>
                                    <div className="col-span-9">
                                        <div className="grid grid-cols-4 gap-4">
                                            {ACTIONS.map(action => (
                                                <div key={action} className="flex justify-center">
                                                    <div className="w-10 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Footer Info Skeleton */}
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
            </div>
        </div>
    )

    if (isError) return (
        <div className="min-h-screen p-6 flex items-center justify-center">
            <Card className="rounded-lg shadow-lg p-6 flex items-center gap-3 border-l-4 border-red-600">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">Failed loading permissions</span>
            </Card>
        </div>
    )

    const UserProfile = () => {
        
        return (
            <Card className="flex flex-row items-center my-4 gap-4 p-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'User Avatar'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <span className="text-2xl font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-semibold">{user?.name || 'Unknown User'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{user?.email || 'No email available'}</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-lg">
                                <Lock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Permissions</h1>
                                <p className="text-slate-400 mt-1">{fetched?.userId?.name || userId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {saveSuccess && (
                                <div className="flex items-center gap-2 px-4 py-2 border border-green-500/50 rounded-lg animate-pulse">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span className="text-green-300 text-sm font-medium">Saved successfully</span>
                                </div>
                            )}
                            <Button
                                onPress={handleSave}
                                disabled={upserting}
                                color='primary'
                                size='sm'
                            >
                                {upserting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <UserProfile />

                {/* Permissions Grid */}
                <Card className="rounded-xl shadow-xl overflow-hidden ">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r">
                        <div className="grid grid-cols-12 gap-4 p-6">
                            <div className="col-span-3">
                                <h3 className="text-sm font-semibold  uppercase tracking-wider">Module</h3>
                            </div>
                            <div className="col-span-9">
                                <div className="grid grid-cols-7 gap-4">
                                    {ACTIONS.map(action => (
                                        <h3 key={action} className="text-sm font-semibold text-nowrap uppercase tracking-wider text-center">
                                            {action}
                                        </h3>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-default-100">
                        {MODULES.map((mod, idx) => (
                            <div
                                key={mod}
                                className="transition-colors duration-150 p-2"
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <Switch size='sm' isSelected={isModuleFullyEnabled(mod)} onValueChange={(val) => toggleModule(mod, val)}>{mod}</Switch>
                                        </label>
                                    </div>
                                    <div className="col-span-9">
                                        <div className="grid grid-cols-7 text-nowrap gap-4">
                                            {ACTIONS.map(action => (
                                                <label
                                                    key={action}
                                                    className="flex items-center justify-center cursor-pointer group"
                                                >
                                                    <Switch size='sm' isSelected={!!(local[mod]?.[action])} onValueChange={() => toggle(mod, action)}></Switch>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Footer Info */}
                <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <p className="text-sm text-primary-600">
                        💡 <strong>Tip:</strong> Click on a module name to toggle all permissions for that module at once.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Page