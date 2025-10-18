"use client"
import React from 'react'
import SessionTable from './_components/SessionTable'
import { Card } from '@heroui/card'

const SessionsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active Sessions</h1>
          <p className="text-default-500 dark:text-gray-300 mt-1">View and revoke active sessions for your organisation.</p>
        </div>
      </div>

      <Card>
        <SessionTable />
      </Card>
    </div>
  )
}

export default SessionsPage