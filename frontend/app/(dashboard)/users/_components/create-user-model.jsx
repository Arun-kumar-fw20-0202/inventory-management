import { Button } from '@heroui/button'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal'
import { Input } from '@heroui/input'
import { Radio, RadioGroup } from '@heroui/radio'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useCreateUser, useUpdateUser } from '@/libs/mutation/user/user-mutations'


export default function CreateUserModal({
    activerole = 'admin',
    isOpen,
    onOpen,
    onOpenChange,
    mode = 'create', // 'create' | 'edit'
    initialData = null,
    onSuccess: onExternalSuccess = null,
}) {
    
    const ROLE_OPTIONS = [
        {label: 'Admin', value: 'admin', isVisible: ['superadmin'].includes(activerole)},
        {label: 'Manager', value: 'manager', isVisible: ['admin'].includes(activerole)},
        {label: 'Staff', value: 'staff', isVisible: ['admin', 'manager'].includes(activerole)}
    ]

    const [showPassword, setShowPassword] = React.useState(false)
    
    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            role: '',
        },
    })

    const { mutate: createUser, isLoading: creating, isSuccess: createSuccess } = useCreateUser()
    const { mutate: updateUser, isLoading: updating, isSuccess: updateSuccess } = useUpdateUser()
    const isLoading = creating || updating
    const isSuccess = mode === 'create' ? createSuccess : updateSuccess

    // Determine which roles the current user can create
    const creatableRoles = (() => {
        const r = String(activerole || '').toLowerCase()
        if (r === 'superadmin') return ['admin', 'manager', 'staff']
        if (r === 'admin') return ['manager', 'staff']
        if (r === 'manager') return ['staff']
        return []
    })()

    useEffect(() => {
        if (isSuccess) {
            onOpenChange && onOpenChange(false)
            // keep data after edit? reset to clear form
            reset({ name: '', email: '', phone: '', password: '', role: '' })
            onExternalSuccess && onExternalSuccess()
        }
    }, [isSuccess])

    // Default to first creatable role to speed up creation
    useEffect(() => {
        if (isOpen) {
            const first = creatableRoles[0] || ''
            if (first) setValue('role', first)
        }
    }, [isOpen])

    // when editing, populate form
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // set core fields; do not set password
            setValue('name', initialData.name || '')
            setValue('email', initialData.email || '')
            setValue('phone', initialData.phone || '')
            setValue('role', initialData.activerole || initialData.role?.[0] || '')
            setValue('password', '')
        }
    }, [mode, initialData])

    const onSubmit = (data) => {
        // client-side permission check
        if (!creatableRoles.includes(data.role)) return

        if (mode === 'create') {
            createUser(data)
            return
        }

        // edit mode
        if (mode === 'edit' && initialData && initialData._id) {
            const id = initialData._id
            // do not send empty password
            const payload = { ...data }
            if (!payload.password) delete payload.password
            updateUser({ id, data: payload })
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">Create User</ModalHeader>

                        <ModalBody>
                            <div className="flex flex-col gap-3">
                                <Controller
                                    control={control}
                                    name="name"
                                    rules={{ required: 'Name is required' }}
                                    render={({ field }) => (
                                        <Input variant="bordered" {...field} placeholder="Full name" label="Name" size="sm" />
                                    )}
                                />
                                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}

                                <Controller
                                    control={control}
                                    name="email"
                                    rules={{ required: 'Email is required' }}
                                    render={({ field }) => (
                                        <Input variant="bordered" {...field} placeholder="Email" label="Email" size="sm" type='email' />
                                    )}
                                />
                                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}

                                <Controller
                                    control={control}
                                    name="phone"
                                    rules={{ 
                                        required: 'Phone is required',
                                        pattern: {
                                            value: /^[\+]?[1-9][\d]{0,15}$/,
                                            message: 'Invalid phone number format',
                                        },
                                        minLength: { value: 10, message: 'Phone number is too short' },
                                        maxLength: { value: 15, message: 'Phone number is too long' },
                                     }}
                                    render={({ field }) => (
                                        <Input variant="bordered" {...field} placeholder="Phone" label="Phone" size="sm" inputMode='numeric' />
                                    )}
                                />
                                {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}

                                <Controller
                                    control={control}
                                    name="password"
                                    rules={{ 
                                        required: mode === 'create' ? 'Password is required' : false 
                                    }}
                                    render={({ field }) => (
                                        <Input type={showPassword ? 'text' : 'password'} variant="bordered" {...field} placeholder={mode === 'edit' ? 'Leave blank to keep existing' : 'Password'} label="Password" size="sm" 
                                            endContent={
                                                <Button size='sm' type="button" onPress={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </Button>
                                            }
                                        />
                                    )}
                                />
                                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}

                                <div>
                                    <label className="block text-sm font-medium mb-2">Role (creating as)</label>
                                    <Controller
                                        control={control}
                                        name="role"
                                        rules={{ required: 'Role is required' }}
                                        render={({ field }) => (
                                            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-col gap-2">
                                                {ROLE_OPTIONS.filter(r => r.isVisible).map((role) => (
                                                    <Radio key={role.value} value={role.value} className="capitalize">
                                                        {role.label}
                                                    </Radio>
                                                ))}
                                            </RadioGroup>
                                        )}
                                    />
                                    {errors.role && <p className="text-xs text-danger mt-1">{errors.role.message}</p>}
                                </div>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button size="sm" color="danger" variant="light" onPress={onClose}>Close</Button>
                            <Button size="sm" color="primary" type="submit" isLoading={isLoading}>Create</Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    )
}