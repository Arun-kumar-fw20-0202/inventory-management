'use client'
import PageAccess from '@/components/role-page-access';
import React from 'react'
import { useSelector } from 'react-redux';
import CreateUserModal from './_components/create-user-model';
import UsersList from './_components/users-list';
import { useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Plus } from 'lucide-react';
import CheckPagePermission from '@/components/check-page-permissoin';
import { PERMISSION_MODULES } from '@/libs/utils';

const Index = () => {
    const user = useSelector((state) => state.auth.user);
    const {isOpen, onOpen, onOpenChange} = useDisclosure()
    const activeRole = user?.data?.activerole

    
    return (
        <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SYSTEMUSER, action: 'read' }}>
            <CreateUserModal activerole={activeRole} isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange} />
            <div className="p-4">
                <UsersList 
                    activerole={activeRole} 
                    topContent={
                        <Button onPress={onOpen} color='primary' variant='flat' size='sm' endContent={<Plus size={18} />} >Create User</Button>
                    }
                />
            </div>
        </CheckPagePermission>
    )
}

export default Index