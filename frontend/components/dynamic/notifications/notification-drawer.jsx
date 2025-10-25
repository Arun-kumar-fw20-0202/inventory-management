'use client'
import React, { useEffect, useMemo, useCallback } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/drawer'
import { Button } from '@heroui/button'
import {
  Bell, Inbox, CheckCircle, UserCheck, XCircle, Check,
  Package, Truck, AlertCircle, FileText,  ChevronDown
} from 'lucide-react'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

import {
    useFetchNotifications,
    useFetchUnreadCount,
    useMarkAsRead,
    useDismissNotification,
    useNotificationsCache
} from '@/libs/mutation/notifications/notification-mutations'
import { useSelector } from 'react-redux'
import { Pagination } from '@heroui/pagination'

const NOTIFICATION_TYPES = {
  SALE_SUBMITTED: ['sale:submitted', 'sale:created'],
  SALE_APPROVED: ['sale:approved'],
  SALE_APPROVED_ADMIN: ['sale:approved:admin', ':approved:admin'],
  SALE_REJECTED: ['sale:rejected'],
  SALE_COMPLETED: ['sale:completed'],
  PURCHASE_SUBMITTED: ['purchase:submitted', 'purchase:created'],
  PURCHASE_APPROVED: ['purchase:approved'],
  PURCHASE_APPROVED_ADMIN: ['purchase:approved:admin'],
  PURCHASE_REJECTED: ['purchase:rejected'],
  PURCHASE_RECEIVED: ['purchase:received'],
  LOW_STOCK: ['low-stock', 'stock:low', 'stock:warning'],
  DOCUMENT: ['invoice', 'order', 'document'],
}

const ICON_CONFIGS = {
  size: 18,
  className: 'text-gray-600 dark:text-gray-300'
}

// Icon component with memoization
const NotificationIcon = React.memo(({ type, isRead }) => {
  const typeStr = String(type || '').toLowerCase()

  const iconMap = [
    { types: NOTIFICATION_TYPES.SALE_SUBMITTED, icon: Inbox, color: 'text-blue-500' },
    { types: NOTIFICATION_TYPES.SALE_APPROVED, icon: CheckCircle, color: 'text-green-500' },
    { types: NOTIFICATION_TYPES.SALE_APPROVED_ADMIN, icon: UserCheck, color: 'text-purple-500' },
    { types: NOTIFICATION_TYPES.SALE_REJECTED, icon: XCircle, color: 'text-red-500' },
    { types: NOTIFICATION_TYPES.SALE_COMPLETED, icon: Check, color: 'text-emerald-500' },
    { types: NOTIFICATION_TYPES.PURCHASE_SUBMITTED, icon: Package, color: 'text-orange-500' },
    { types: NOTIFICATION_TYPES.PURCHASE_APPROVED, icon: CheckCircle, color: 'text-green-500' },
    { types: NOTIFICATION_TYPES.PURCHASE_APPROVED_ADMIN, icon: UserCheck, color: 'text-purple-500' },
    { types: NOTIFICATION_TYPES.PURCHASE_REJECTED, icon: XCircle, color: 'text-red-500' },
    { types: NOTIFICATION_TYPES.PURCHASE_RECEIVED, icon: Truck, color: 'text-cyan-500' },
    { types: NOTIFICATION_TYPES.LOW_STOCK, icon: AlertCircle, color: 'text-amber-500' },
    { types: NOTIFICATION_TYPES.DOCUMENT, icon: FileText, color: 'text-indigo-500' },
  ]

  for (const config of iconMap) {
    if (config.types.some(t => typeStr.includes(t))) {
      const IconComponent = config.icon
      return (
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/50 ${config.color}`}>
          <IconComponent size={ICON_CONFIGS.size} />
          {!isRead && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
          )}
        </div>
      )
    }
  }

  return (
    <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
      <Bell size={ICON_CONFIGS.size} />
      {!isRead && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
      )}
    </div>
  )
})


const NotificationItem = React.memo(({
  notification,
  isRead,
  onMarkRead,
  onOpenAction,
  onDismiss
}) => {
    const handleOpenClick = useCallback(() => {
        onMarkRead(notification)
        onOpenAction(notification)
    }, [notification, onMarkRead, onOpenAction])

    const timeAgo = dayjs(notification.createdAt).fromNow()

    return (
        <div className="group relative px-4 py-3 transition-colors duration-150 border-b last:border-0">
        <div className="flex items-start gap-3">
            <NotificationIcon type={notification.type} isRead={isRead} />

            <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                    {notification.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {timeAgo}
                </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <button
                onClick={handleOpenClick}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                Open
                </button>

                {!isRead && (
                <button
                    onClick={() => onMarkRead(notification)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Mark read
                </button>
                )}

            </div>
            </div>
        </div>
        </div>
    )
})

export const NotificationDrawer = ({ isOpen, onOpenChange, count }) => {
    const [filter, setFilter] = React.useState({ page: 1, limit: 25, unread: false });
    const user = useSelector((state) => state.auth.user);

    const { data, isLoading, refetch } = useFetchNotifications(filter, { enabled: !!isOpen })
    const { data: unreadData, refetch: refetchUnread } = useFetchUnreadCount()
    const markRead = useMarkAsRead()
    const dismiss = useDismissNotification()
    const cache = useNotificationsCache()

    useEffect(() => {
        if (isOpen) {
            refetch()
            refetchUnread()
        }
    }, [isOpen, refetch, refetchUnread])

    const items = useMemo(() => data?.data?.items || data?.items || [], [data])
    const paginationData = useMemo(() => data?.data?.pagination || data?.pagination , [data])
    const unreadCount = (unreadData && (unreadData.data?.count || unreadData.count)) || 0

    // notify parent (sidebar) about unread count if callback provided
    useEffect(() => {
        try {
            if (typeof count === 'function') count(unreadCount)
        } catch (e) {
            // ignore
        }
    }, [unreadCount, count])

    const handleOpenAction = (note) => {
        if (note?.action && note.action.url) {
            window.open(note.action.url, '_blank')
        }
    }

    const handleMarkRead = async (note) => {
        try {
            await markRead.mutateAsync({ id: note._id })
            cache.invalidate()
        } catch (err) {
            console.error('mark read failed', err)
        }
    }

    const handleDismiss = async (note) => {
        try {
            await dismiss.mutateAsync({ id: note._id })
            cache.invalidate()
        } catch (err) {
            console.error('dismiss failed', err)
        }
    }

    const checkReadStatus = (note) => {
        return note.recipients?.some(r => r.recipient === user?.data.id && r.read);
    }

    return (
        <>
            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <div className="flex h-full w-full flex-col justify-center items-center">
                                <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center mb-6">
                                        <Bell size={32} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        Notifications
                                    </h2>
                                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                                        Coming Soon!
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm">
                                        We're working hard to bring you a comprehensive notification system. Stay tuned for updates!
                                    </p>
                                </div>
                            </div>
                            {/* <DrawerHeader className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-semibold">Notifications</span>
                                    <span className="text-xs text-default-400">{unreadCount} unread</span>
                                </div>
                                <div className="flex gap-2 items-center">    
                                    <div className="flex gap-2 px-4 justify-end">
                                        {['All', 'Unread'].map((status) => {
                                            const isActive =
                                                (status === 'All' && !filter.unread) ||
                                                (status === 'Unread' && filter.unread) 
                                            return (
                                                <Button key={status} onPress={() => { 
                                                        if (status === 'All') {
                                                            setFilter(prev => ({ ...prev, unread: false, read: false, page: 1 }))
                                                        } else if (status === 'Unread') {
                                                            setFilter(prev => ({ ...prev, unread: true, read: false, page: 1 }))
                                                        }
                                                    }}
                                                    size='sm'
                                                    variant={isActive ? 'solid' : 'light'}
                                                    color='primary'
                                                >
                                                    {status}
                                                </Button>
                                            )
                                        })}
                                        <Button size="sm" variant="light" onPress={() => { cache.invalidate(); refetch(); refetchUnread(); }}>
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </DrawerHeader> */}

                            {/* <DrawerBody className="p-0">
                                    {isLoading ? (
                                        <>
                                            {[...Array(5)].map((_, i) => (
                                                <NotificationSkeleton key={i} />
                                            ))}
                                        </>
                                    ) : items.length <= 0 ? (
                                        <EmptyNotifications />
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {items.map((note) => (
                                                <NotificationItem
                                                    key={note._id}
                                                    notification={note}
                                                    isRead={checkReadStatus(note)}
                                                    onMarkRead={handleMarkRead}
                                                    onOpenAction={handleOpenAction}
                                                    onDismiss={handleDismiss}
                                                />
                                            ))}
                                        </div>
                                    )}
                            </DrawerBody>

                            <DrawerFooter>
                                <div className="w-full overflow-hidden flex justify-between">
                                    <Pagination color="primary" isCompact page={paginationData?.page} total={paginationData?.pages} onChange={(setPage) => setFilter(prev => ({ ...prev, page: setPage }))} showControls/>
                                </div>
                            </DrawerFooter> */}
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    )
}




// Empty state component
const EmptyNotifications = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-4">
            <Bell size={28} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No notifications</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You're all caught up!</p>
    </div>
)

// Loading skeleton component
const NotificationSkeleton = () => (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600/50">
        <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 animate-pulse" />
        <div className="flex-1">
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2" />
            <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-600/50 animate-pulse mb-3" />
            <div className="flex gap-2">
            <div className="h-8 w-16 rounded bg-gray-100 dark:bg-gray-600 animate-pulse" />
            <div className="h-8 w-20 rounded bg-gray-100 dark:bg-gray-600 animate-pulse" />
            </div>
        </div>
        </div>
    </div>
)