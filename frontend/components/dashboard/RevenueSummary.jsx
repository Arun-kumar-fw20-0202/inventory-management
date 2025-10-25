'use client'
import React from 'react'
import { useRevenueSummary } from '@/libs/query/dashboard/dashboard-queries'
import { DashboardRevenueSummaryGraph } from './graphs/dashboard-revenue-summary-graph'

export default function DashboardRevenueSummary({ params, options }) {
  const { data, isLoading, error } = useRevenueSummary(params, options)
  const points = data?.data || []

  return (
    <div className="rounded-lg shadow">
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load revenue</div>
      ) : (
        <DashboardRevenueSummaryGraph data={points} title="Monthly Revenue" descriptionText="Last months revenue" />
      )}
    </div>
  )
}
