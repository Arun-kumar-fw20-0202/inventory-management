'use client'
import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Textarea } from '@heroui/input'

const ConfirmActionModal = ({ open, title = 'Confirm', message, showReason = false, onCancel, onConfirm }) => {
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    if (!open) setReason('')
  }, [open])

  return (
    <Modal isOpen={open} onOpenChange={(v) => { if (!v) onCancel && onCancel() }}>
      <ModalContent>
        <ModalHeader>
          <div className="font-semibold">{title}</div>
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">{message}</div>
          {showReason && (
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" />
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button variant="ghost" onPress={() => onCancel && onCancel()}>Cancel</Button>
            <Button onPress={() => onConfirm && onConfirm(reason)}>Confirm</Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfirmActionModal
