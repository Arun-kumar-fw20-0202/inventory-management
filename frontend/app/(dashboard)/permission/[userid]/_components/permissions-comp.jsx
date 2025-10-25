'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { useFetchPermission, useUpsertPermission } from '@/libs/mutation/permission/permission-mutations'
import ConfirmActionModal from '../../../sales/all/_components/ConfirmActionModal'
import { Save, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react'
import { Card } from '@heroui/card'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { useUser } from '@/libs/mutation/user/user-mutations'

/**
 * Constants & helpers
 */
const MODULES = ['systemuser','stock','sales','purchases','reports','organization','sessions', 'settings', 'category', 'warehouse', 'supplier', 'customer']

const BASE_ACTIONS = ['create', 'read', 'update', 'delete']
const EXTRA_ACTIONS = {
  sales: ['can-approve', 'can-reject', 'can-complete'],
  purchases: ['can-approve', 'can-reject', 'can-complete', 'can-receive']
}
const RESTRICTED_ACTIONS = {
  organization: ['create', 'delete']
}
const ACTIONS = Array.from(new Set([...BASE_ACTIONS, ...Object.values(EXTRA_ACTIONS).flat()]))

const ACTION_TO_KEY = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
  'can-approve': 'approve',
  'can-reject': 'reject',
  'can-complete': 'complete',
  'can-receive': 'receive'
}

function displayActionLabel(action) {
  if (action.startsWith('can-')) return action.replace('can-', '').replace(/(^|\s)\S/g, s => s.toUpperCase())
  return action.charAt(0).toUpperCase() + action.slice(1)
}

function isActionApplicableToModule(mod, action) {
  const restricted = RESTRICTED_ACTIONS[mod]
  if (restricted && restricted.includes(action)) return false
  if (BASE_ACTIONS.includes(action)) return true
  const extras = EXTRA_ACTIONS[mod]
  if (!extras) return false
  return extras.includes(action)
}

/**
 * Dependency triggers for create-like actions:
 * When enabling create on the left module, we must ensure certain read flags exist in other modules.
 * Each entry describes which { mod, key, label } should be present when enabling 'create' for the given module.
 */
const DEPENDENCY_TRIGGERS = {
  sales: [
    { mod: 'customer', key: 'read', label: 'Customers (Read)' },
    // you might also require product/read-stock depending on your design; add here if needed
  ],
  purchases: [
    { mod: 'supplier', key: 'read', label: 'Suppliers (Read)' }
  ],
  stock: [
    { mod: 'category', key: 'read', label: 'Categories (Read)' },
    { mod: 'warehouse', key: 'read', label: 'Warehouses (Read)' }
  ]
}



export const PermissionsComp = ({userId}) => {

    const { data: userData, isLoading: gettingUser } = useUser(userId)
    const user = useMemo(() => userData?.data?.data , [userData])

    const { data: permissionsResp, isLoading: fetching, isError } = useFetchPermission(userId)
    const { mutateAsync: upsertPermission, isLoading: upserting } = useUpsertPermission()
    const [saveSuccess, setSaveSuccess] = useState(false)

    const fetched = permissionsResp?.permission || permissionsResp?.data?.permission || permissionsResp?.data || null

    // local permission state (module -> { read: bool, create: bool, ... })
    const [local, setLocal] = useState(() => (fetched?.permissions) ? fetched.permissions : {})

    useEffect(() => {
        setLocal(fetched?.permissions || {})
    }, [fetched?.permissions])

    useEffect(() => {
        if (saveSuccess) {
        const timer = setTimeout(() => setSaveSuccess(false), 3000)
        return () => clearTimeout(timer)
        }
    }, [saveSuccess])

    // modal + pending state for dependent permission confirmation
    // pending: { mod, key, newVal, missing: [{mod,key,label}], source: 'action'|'module' }
    const [pending, setPending] = useState(null)
    const [modalData, setModalData] = useState({ open: false, title: '', message: '', showReason: false })

    /**
     * Helper: open confirmation modal for a pending change
     */
    const openDependencyModal = ({ mod, key, newVal, missing, source = 'action' }) => {
        const actionLabel = (key === 'create') ? `create ${mod}` : displayActionLabel(key)
        const missingLabels = (missing || []).map(m => m.label).join(', ')
        const title = `Confirm enabling ${actionLabel}`
        const message = `Enabling the "${key === 'create' ? `Create ${mod}` : actionLabel}" permission requires granting ${missingLabels}. This access is required so the user can perform ${mod === 'sales' ? 'sales' : mod === 'purchases' ? 'purchase orders' : `${mod} operations`}. Do you want to enable these permissions automatically?`
        setPending({ mod, key, newVal, missing, source })
        setModalData({ open: true, title, message, showReason: false })
    }

    /**
     * Apply the pending change (called when user confirms)
     * reason is optional and currently only captured in the UI (not sent to the upsert API; add logging if required)
     */
    const applyPending = (reason) => {
        if (!pending) return
        const { mod, key, newVal, missing } = pending
        setLocal(prev => {
        const clone = { ...prev }
        clone[mod] = { ...(clone[mod] || {}), [key]: newVal }
        ;(missing || []).forEach(r => {
            clone[r.mod] = { ...(clone[r.mod] || {}), [r.key]: true }
        })
        return clone
        })
        // clear modal/pending
        setPending(null)
        setModalData({ open: false, title: '', message: '', showReason: false })
        // optionally: record reason somewhere (audit) — left as TODO
    }

    const cancelPending = () => {
        setPending(null)
        setModalData({ open: false, title: '', message: '', showReason: false })
    }

    /**
     * Toggle single action for a module (e.g., sales:create)
     */
    const toggle = (mod, action) => {
        if (!isActionApplicableToModule(mod, action)) return
        const key = ACTION_TO_KEY[action] || action
        const current = !!(local[mod]?.[key])
        const newVal = !current

        // If enabling 'create' => check dependency triggers for this module
        if (key === 'create' && newVal === true && DEPENDENCY_TRIGGERS[mod]) {
        const related = DEPENDENCY_TRIGGERS[mod].filter(r => !local[r.mod]?.[r.key])
        if (related.length > 0) {
            openDependencyModal({ mod, key, newVal, missing: related, source: 'action' })
            return
        }
        }

        // Otherwise, just toggle the key
        setLocal(prev => {
        const modObj = { ...(prev[mod] || {}) }
        modObj[key] = newVal
        return { ...prev, [mod]: modObj }
        })
    }

    /**
     * Toggle entire module (on/off). This will toggle only allowed actions for the module.
     * If enabling the module triggers dependency issues (for create), show modal.
     */
    const toggleModule = (mod, enabled) => {
        // If enabling module and create is applicable, check dependencies
        const willEnableCreate = enabled && isActionApplicableToModule(mod, 'create')
        if (willEnableCreate && DEPENDENCY_TRIGGERS[mod]) {
        const related = DEPENDENCY_TRIGGERS[mod].filter(r => !local[r.mod]?.[r.key])
        if (related.length > 0) {
            openDependencyModal({ mod, key: 'create', newVal: true, missing: related, source: 'module' })
            return
        }
        }

        // create the new state for this module (only actions applicable to it)
        setLocal(prev => {
        const prevModule = { ...prev[mod] }
        const applicable = BASE_ACTIONS.slice()
        if (EXTRA_ACTIONS[mod]) applicable.push(...EXTRA_ACTIONS[mod])
        const allowedActions = applicable.filter(action => isActionApplicableToModule(mod, action))

        const mapped = allowedActions.reduce((acc, a) => {
            const k = ACTION_TO_KEY[a] || a
            acc[k] = !!enabled
            return acc
        }, { ...prevModule })
        return { ...prev, [mod]: mapped }
        })
    }

    /**
     * Check whether a module has all applicable permissions enabled
     */
    const isModuleFullyEnabled = (mod) => {
        const moduleObj = local[mod] || {}
        const applicable = BASE_ACTIONS.slice()
        if (EXTRA_ACTIONS[mod]) applicable.push(...EXTRA_ACTIONS[mod])
        const allowedActions = applicable.filter(action => isActionApplicableToModule(mod, action))
        return allowedActions.every(a => {
        const k = ACTION_TO_KEY[a] || a
        return !!moduleObj[k]
        })
    }

    /**
     * Persist to backend
     */
    const handleSave = async () => {
        if (!userId) return alert('Missing userId')
        try {
        await upsertPermission({ userId, permissions: local })
        setSaveSuccess(true)
        } catch (err) {
        console.error('save failed', err)
        // optionally show user-facing error toast
        }
    }

    // UI states for various fetch/error scenarios
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
            {/* ...skeleton omitted for brevity - keep your original skeleton from earlier */}
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

            <Card className="flex flex-row items-center my-4 gap-4 p-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
            </Card>

            <Card className="rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r p-6">
                <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
                <div className="col-span-9">
                    <div style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, minmax(0, 1fr))` }} className="gap-4 grid">
                    {ACTIONS.map(action => (
                        <div key={action} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                    </div>
                </div>
                </div>
            </div>

            <div className="divide-y divide-default-100">
                {MODULES.map((mod) => (
                <div key={mod} className="p-2">
                    <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                    </div>
                    <div className="col-span-9">
                        <div style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, minmax(0, 1fr))` }} className="gap-4 grid">
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

    /**
     * UserProfile small component
     */
    const UserProfile = () => (
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

    
  return (
    <>
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
                    <div style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, minmax(0, 1fr))` }} className={`gap-4 grid`}>
                    {ACTIONS.map(action => (
                        <h3 key={action} className="text-sm font-semibold text-nowrap uppercase tracking-wider text-center">
                        {displayActionLabel(action)}
                        </h3>
                    ))}
                    </div>
                </div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-default-100">
                {MODULES.map((mod) => (
                <div
                    key={mod}
                    className="transition-colors duration-150 p-2"
                >
                    <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                        <label className="flex items-center capitalize gap-3 cursor-pointer">
                        <Switch size='sm' isSelected={isModuleFullyEnabled(mod)} onValueChange={(val) => toggleModule(mod, val)}>{mod}</Switch>
                        </label>
                    </div>
                    <div className="col-span-9">
                        <div style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, minmax(0, 1fr))` }} className={`text-nowrap gap-4 grid`}>
                        {ACTIONS.map(action => {
                            const key = ACTION_TO_KEY[action] || action
                            if (!isActionApplicableToModule(mod, action)) {
                            return (
                                <div key={action} className="flex items-center justify-center text-sm text-muted">—</div>
                            )
                            }
                            return (
                            <label
                                key={action}
                                className="flex items-center justify-center cursor-pointer group"
                            >
                                <Switch size='sm' isSelected={!!(local[mod]?.[key])} onValueChange={() => toggle(mod, action)}></Switch>
                            </label>
                            )
                        })}
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

        {/* Confirmation modal for dependency enabling */}
        <ConfirmActionModal
            open={modalData.open}
            title={modalData.title}
            message={modalData.message}
            showReason={modalData.showReason}
            onCancel={cancelPending}
            onConfirm={(reason) => applyPending(reason)}
        />
        </div>
    </>
  )
}
