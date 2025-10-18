'use client'
import React from 'react'
import { Modal, ModalContent } from '@heroui/modal'
import { Button } from '@heroui/button'
import useBulkUpload from '@/libs/mutation/bulkupload/useBulkUpload'
import { useBulkJobStatus } from '@/libs/query/bulkupload/useBulkJobQueries'
import { useQueryClient } from '@tanstack/react-query'
import { Progress } from '@heroui/progress'

const BulkUploadModal = ({ type = 'warehouse', isOpen, onOpenChange, onComplete }) => {
  const [file, setFile] = React.useState(null)
  const [jobId, setJobId] = React.useState(null)
  const [watching, setWatching] = React.useState(false)
  const upload = useBulkUpload(type)
  const queryClient = useQueryClient()
  const statusQuery = useBulkJobStatus(jobId, watching)

  React.useEffect(() => {
    if (!jobId || !watching) return
    const data = statusQuery.data?.data
    if (!data) return
    if (!BulkUploadModal._notified) BulkUploadModal._notified = {}
    if (BulkUploadModal._notified[jobId]) return
    const status = data.status
    if (status === 'COMPLETED' || status === 'FAILED' || (data.total && data.processed >= data.total)) {
      BulkUploadModal._notified[jobId] = true
      onComplete?.(jobId)
      setJobId(null)
      // stop polling / remove query from cache so status endpoint is no longer hit
      try {
        // cancel any active fetches first, then remove the query to stop future polling
        queryClient.cancelQueries(['bulk-status', jobId])
        queryClient.removeQueries(['bulk-status', jobId])
        // queryClient.invalidateQueries(["use-fetch-my-stock"])
      } catch (err) {
        // best-effort cleanup
        console.warn('Failed to remove bulk-status query', err)
      }
      setWatching(false)
    }
  }, [statusQuery.data, jobId, onComplete, watching, queryClient])

  // if the modal closes, stop watching to avoid background polling
  React.useEffect(() => {
    if (!isOpen) setWatching(false)
  }, [isOpen])

  const handleFile = (e) => setFile(e.target.files?.[0] || null)

  const startUpload = async () => {
    if (!file) return
    try {
      const res = await upload.mutateAsync({ file })
      if (res && res.jobId) {
        setJobId(res.jobId)
        // begin watching the job status
        setWatching(true)
      }
    } catch (err) {
      console.error('Bulk upload failed', err)
    }
  }

  const pct = (() => {
    const d = statusQuery?.data?.data
    if (!d || !d.total) return 0
    return Math.round((d.processed / d.total) * 100)
  })()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Bulk Upload {type}</h3>
          <p className="text-sm text-gray-500 mb-3">Upload an Excel file (.xlsx/.csv). The expected columns depend on the chosen type.</p>

          {!jobId && (
            <div className="space-y-3">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
              <div className="flex gap-2">
                <Button onPress={() => onOpenChange(false)}>Cancel</Button>
                <Button color="primary" onPress={startUpload} isLoading={upload.isLoading} disabled={!file}>Start Upload</Button>
              </div>
            </div>
          )}

          {jobId && (
            <div className="space-y-3">
              <p>Job ID: {jobId}</p>
              <Progress value={pct} className="h-3" />
              <p className="text-sm text-gray-500">{pct}% — {statusQuery.data?.data?.processed || 0}/{statusQuery.data?.data?.total || 0} processed — Failures: {statusQuery.data?.data?.failCount || 0}</p>
              <div className="flex gap-2">
                <Button onPress={() => onOpenChange(false)}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}

export default BulkUploadModal
