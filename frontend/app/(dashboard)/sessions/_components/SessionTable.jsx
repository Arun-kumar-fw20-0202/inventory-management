"use client"
import React from 'react'
import DynamicDataTable from '@/components/dynamic-table'
import SessionActions from './SessionActions'
import { useFetchSessions } from '@/libs/mutation/sessions/session-mutations'
import dayjs from 'dayjs'

const columns = [
  { uid: "user", name: 'User' },
  { uid: 'device', name: 'Device' },
  { uid: 'activerole', name: 'Role' },
  { uid: 'ipAddress', name: 'IP' },
//   { uid: 'createdAt', name: 'Created' },
  { uid: 'lastUsedAt', name: 'Last Active' },
  { uid: 'revoked', name: 'Status' },
  { uid: 'actions', name: 'Actions' },
]

const SessionTable = ({ params = {} }) => {
  const { data, isLoading } = useFetchSessions(params)

  const sessions = data?.data || []
  const renderActions = (item) => <SessionActions session={item} />
  
  const parseUserAgent = (ua = '') => {
    const lower = (ua || '').toLowerCase()
    // Browser detection (simple and robust for common cases)
    let browser = 'Unknown'
    let browserVersion = ''
    if (/edg\//i.test(ua)) {
      browser = 'Edge'
      browserVersion = (ua.match(/Edg\/(\d+\.?\d*)/) || [])[1]
    } else if (/opera|opr\//i.test(ua)) {
      browser = 'Opera'
      browserVersion = (ua.match(/OPR\/(\d+\.?\d*)/) || [])[1]
    } else if (/chrome|crios\//i.test(ua)) {
      browser = 'Chrome'
      browserVersion = (ua.match(/Chrome\/(\d+\.?\d*)/) || ua.match(/CriOS\/(\d+\.?\d*)/) || [])[1]
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Firefox'
      browserVersion = (ua.match(/Firefox\/(\d+\.?\d*)/) || [])[1]
    } else if (/safari/i.test(ua) && !/chrome|crios|chromium|android/i.test(ua)) {
      browser = 'Safari'
      browserVersion = (ua.match(/Version\/(\d+\.?\d*)/) || [])[1]
    }

    // OS detection
    let os = 'Unknown'
    let osVersion = ''
    if (/windows nt/i.test(ua)) {
      os = 'Windows'
      const m = ua.match(/Windows NT (\d+\.\d+)/i)
      osVersion = m?.[1] || ''
    } else if (/android/i.test(ua)) {
      os = 'Android'
      const m = ua.match(/Android (\d+(?:\.\d+)*)/i)
      osVersion = m?.[1] || ''
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      os = 'iOS'
      const m = ua.match(/OS (\d+(_\d+)*) like Mac OS X/i)
      osVersion = m?.[1]?.replace(/_/g, '.') || ''
    } else if (/mac os x/i.test(ua)) {
      os = 'macOS'
      const m = ua.match(/Mac OS X (\d+[_\.\d+]*)/i)
      osVersion = m?.[1]?.replace(/_/g, '.') || ''
    } else if (/linux/i.test(ua)) {
      os = 'Linux'
    }

    // device type
    let deviceType = 'Desktop'
    if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) deviceType = 'Mobile'
    else if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet'

    return { browser, browserVersion, os, osVersion, deviceType }
  }

  const transformed = sessions.map(s => {
    const ua = s.userAgent || ''
    const parsed = parseUserAgent(ua)
    const browserLabel = parsed.browser + (parsed.browserVersion ? ` ${parsed.browserVersion}` : '')
    const osLabel = parsed.os + (parsed.osVersion ? ` ${parsed.osVersion}` : '')

    const details = (
      <div className="flex flex-col">
        <p className="text-sm font-medium truncate">{browserLabel} — {osLabel}</p>
        <p className="text-xs text-default-400 truncate" title={ua}>{parsed.deviceType}{s.deviceId ? ` • ${s.deviceId}` : ''}</p>
      </div>
    )

    return ({
      ...s,
      // render friendly device details in the 'device' column (browser — os + device type)
      device: details,
      ipAddress: s.ipAddress || '—',
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt ? dayjs(s.lastUsedAt).toISOString() : dayjs(s.createdAt).toISOString(),
      // keep a boolean for logic and a label for display
      isRevoked: !!s.revoked,
      revoked: s.revoked ? 'Revoked' : 'Active'
    })
  })

  return (
    <DynamicDataTable
      columns={columns}
      data={transformed}
      loading={isLoading}
      renderActions={renderActions}
    />
  )
}

export default SessionTable
