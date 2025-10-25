"use client"
import React from 'react'
import { useCreateAttachment, useUpdateAttachment } from '@/libs/mutation/stock/stock-attachments-mutation'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useForm, Controller } from 'react-hook-form'
import { Input, Textarea } from '@heroui/input';
import { Button } from '@heroui/button';

export default function AttachmentCreateModal({ isOpen, onOpenChange, initialData = null }) {
    const { control, handleSubmit, reset } = useForm({ defaultValues: { name: '', qty: 0, description: '' } })
    const createMutation = useCreateAttachment()
    const updateMutation = useUpdateAttachment()

    // When initialData changes (edit opened), reset form values
    React.useEffect(() => {
        if (initialData) {
            reset({ name: initialData.name || '', qty: initialData.qty || 0, description: initialData.description || '' })
        } else {
            reset({ name: '', qty: 0, description: '' })
        }
    }, [initialData, reset])

    const onSubmit = async (values) => {
        try {
            if (initialData && initialData._id) {
                await updateMutation.mutateAsync({ id: initialData._id, payload: values })
            } else {
                await createMutation.mutateAsync(values)
            }
            reset()
            if (typeof onOpenChange === 'function') onOpenChange(false)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <Modal isOpen={!!isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="flex flex-col gap-1">
                            {initialData ? 'Edit Attachment' : 'Create Attachment'}
                        </ModalHeader>
                        <ModalBody>
                            <form onSubmit={handleSubmit(onSubmit)} className="rounded mb-3 w-full max-w-md">
                                <div className="mt-2">
                                    <Controller name="name" control={control} rules={{ required: true }} render={({ field }) => (
                                        <Input label="Name" {...field} className="input w-full" 
                                            placeholder='Attachment name'
                                            isRequired
                                        />
                                    )} />
                                </div>

                                <div className="mt-2">
                                    <Controller name="qty" control={control} render={({ field }) => (
                                        <Input label='Quantity' type="number" {...field} className="input w-full" min={0} 
                                            placeholder='Attachment Quantity'
                                            isRequired
                                        />
                                    )} />
                                </div>

                                <div className="mt-2">
                                    <Controller name="description" control={control} render={({ field }) => (
                                        <Textarea {...field} label='Description' className="textarea w-full" 
                                            placeholder='About Attachment'
                                        />
                                    )} />
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <Button type="button" color='danger' className="btn" onPress={() => onClose()}>Cancel</Button>
                                    <Button type="submit"  isDisabled={(createMutation.isLoading || updateMutation.isLoading)}>{initialData ? 'Update' : 'Create'}</Button>
                                </div>
                            </form>
                        </ModalBody>
                        {/* <ModalFooter>
                        </ModalFooter> */}
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
