'use client'
import React from 'react'
import { Modal, ModalContent } from '@heroui/modal'
import { useBulkJobResults } from '@/libs/query/bulkupload/bulkupload-queries'
import { Button } from '@heroui/button'

const BulkUploadResultsModal = ({ jobId, isOpen, onOpenChange }) => {
  const { data, isLoading } = useBulkJobResults(jobId)

  // Show only failures as requested. The API returns errors array with failure details.
  const failures = data?.data?.errors || []

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <div className="p-4 max-h-[60vh] overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Upload Failures</h3>

          <div>
            <h4 className="font-medium">Failures ({failures.length})</h4>
            {failures.length === 0 ? (
              <p className="text-sm text-gray-500">No failures reported.</p>
            ) : (
              <ul className="text-sm list-disc pl-5">
                {failures.slice(0,200).map((e, i) => (
                  <li key={i}>{`Row ${e.row || '-'}: ${e.reason}`}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onPress={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

export default BulkUploadResultsModal
