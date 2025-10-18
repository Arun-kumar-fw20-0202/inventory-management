'use client'
import React from 'react'
import { Modal, ModalContent } from '@heroui/modal'
import { Button } from '@heroui/button'
import api from '@/components/base-url'

const BulkUploadResultsModal = ({ jobId, isOpen, onOpenChange }) => {
  const [hasFailures, setHasFailures] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!jobId) return setHasFailures(null)
    // Check if failure CSV exists by calling the results endpoint head-ish
    const check = async () => {
      try {
        const resp = await api.head(`/bulk-upload/job/${jobId}/results`)
        setHasFailures(true)
      } catch (err) {
        setHasFailures(false)
      }
    }
    check()
  }, [jobId])

  const downloadFailures = async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const resp = await api.get(`/bulk-upload/job/${jobId}/results`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${jobId}-failures.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download failures', err)
      alert('No failures or failed to download')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <div className="p-4 max-h-[60vh] overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Upload Failures</h3>

          <div>
            <h4 className="font-medium">Failures</h4>
            {hasFailures === null ? (
              <p className="text-sm text-gray-500">Checking for failures...</p>
            ) : hasFailures === false ? (
              <p className="text-sm text-gray-500">No failures reported.</p>
            ) : (
              <p className="text-sm text-gray-500">Failures detected. Use the button below to download the CSV.</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {hasFailures && <Button color="default" onPress={downloadFailures} isLoading={loading}>Download Failures CSV</Button>}
            <Button onPress={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

export default BulkUploadResultsModal
