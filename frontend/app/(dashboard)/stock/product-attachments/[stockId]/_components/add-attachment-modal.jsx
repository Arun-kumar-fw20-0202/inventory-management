'use client'
import React, { useEffect, useState } from 'react'
import AttachmentsAutocomplete from '@/components/dynamic/attachments/attachment-autocomplete'
import { useAttachAttachments } from '@/libs/mutation/stock/stock-attachments-mutation'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal'
import { Trash2 } from 'lucide-react'

/**
 * AttachmentModal
 * - Prefills attachments from `stockData.attachments` (if present)
 * - Selecting the same attachment increments its qty
 * - Enforces minimum qty = 1
 * - Calls `onClose()` after successful attach
 */
export const AttachmentModal = ({ isOpen, onClose, stockData }) => {
    const { mutateAsync: attachAttachments, isPending: isAttaching } = useAttachAttachments()
    const [selectedItems, setSelectedItems] = useState([])

    console.log(selectedItems)

    // Prefill from stockData.attachments (support nested shape)
    useEffect(() => {
        if (!stockData) {
            setSelectedItems([])
            return
        }

        const attachments = stockData.attachments ?? stockData.data?.attachments ?? []
        const initial = (attachments || []).map((a) => {
            const nested = a?.attachmentId || null
            const att = nested || a || {}
            const id = nested?._id || a?._id || att.id || a?.id
            const qty = Number(a?.quantity ?? a?.qty ?? att.qty ?? 1) || 1
            return { _id: id, name: att.name || att.title || 'Untitled Attachment', description: att.description, qty }
        })

        setSelectedItems(initial)
    }, [stockData])

    const addSelectedAttachment = (attachment) => {
        if (!attachment) return
        // attachment can be either { _id, name } or the nested object returned by autocomplete
        const nested = attachment?.attachmentId || null
        const att = nested || attachment || {}
        const id = nested?._id || attachment._id || attachment.id || att.id
        if (!id) return

        setSelectedItems((prev) => {
            const idx = prev.findIndex((i) => String(i._id) === String(id))
            if (idx > -1) {
                const next = [...prev]
                next[idx] = { ...next[idx], qty: (Number(next[idx].qty) || 0) + 1 }
                return next
            }
            return [...prev, { _id: id, name: att.name || att.title || 'Untitled Attachment', description: att.description, qty: 1 }]
        })
    }

    const updateQty = (index, value) => {
        const qty = Math.max(1, Number(value) || 1)
        setSelectedItems((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], qty }
            return next
        })
    }

    const removeItem = (id) => setSelectedItems((prev) => prev.filter((i) => String(i._id) !== String(id)))

    const handleAttach = async () => {
        const stockId = stockData?.data?._id || stockData?._id || stockData?.id
        if (!stockId) return
        if (!selectedItems || selectedItems.length === 0) return

        try {
            await attachAttachments({
                stockId,
                attachments: selectedItems.map((i) => ({ attachmentId: i._id, quantity: Number(i.qty) })),
            })

            // reset selection and close on success
            setSelectedItems([])
            if (typeof onClose === 'function') onClose()
        } catch (err) {
            // keep modal open; caller/mutation should show error to user
            // eslint-disable-next-line no-console
            console.error('Failed to attach attachments', err)
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
            <ModalContent>
                <ModalHeader>Manage Attachments</ModalHeader>
                <ModalBody>
                    <div className="p-4">
                        <AttachmentsAutocomplete
                            label="Select Attachments"
                            placeholder="Search and select attachments to link with this stock item..."
                            style={{ width: '100%' }}
                            selectedAttachment={(data) => addSelectedAttachment(data)}
                            onSelectChange={() => {}}
                        />

                        <div className="mt-4">
                            <h3 className="font-medium mb-2">Selected Attachments:</h3>
                            {selectedItems && selectedItems.length > 0 ? (
                                <div>
                                    {selectedItems.map((item, idx) => (
                                        <div key={item._id} className="p-2 border border-default-200 rounded mb-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                {item.description && <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>}
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <Input label="Quantity" type="number" min={1} value={item.qty} size="sm" className="w-20" onChange={(e) => updateQty(idx, e.target.value)} />
                                                <Button variant="light" color="danger" size="sm" onPress={() => removeItem(item._id)}>
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No attachments selected.</p>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={() => typeof onClose === 'function' && onClose()}>
                        Close
                    </Button>
                    <Button isLoading={isAttaching} onPress={handleAttach}>
                        Attach Selected
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default AttachmentModal