"use client"
import React from 'react'
import { Button } from '@heroui/button'
import { LogOut } from 'lucide-react'
import { useTerminateSession } from '@/libs/mutation/sessions/session-mutations'

const SessionActions = ({ session }) => {
  const { mutate: terminate, isLoading } = useTerminateSession()

  const handleTerminate = (e) => {
    e.stopPropagation()
    if (!confirm('Revoke this session? The user/device will be signed out.')) return
    terminate(session._id)
  }

    return (
        <div className="flex items-center gap-2">
            <Button size="sm" color="danger" variant="flat" onPress={handleTerminate} isLoading={isLoading}>
                <LogOut className="w-4 h-4 mr-2" />
                {!session?.revoked ? 'Revoked' : 'Terminate Session'}
            </Button>
        </div>
    )
}

export default SessionActions
