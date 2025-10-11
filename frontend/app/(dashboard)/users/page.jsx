'use client'
import PageAccess from '@/components/role-page-access';
import React from 'react'
import { useSelector } from 'react-redux';
import CreateUserModal from './_components/create-user-model';
import UsersList from './_components/users-list';
import { useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Plus } from 'lucide-react';

const Index = () => {
    const user = useSelector((state) => state.auth.user);
    const {isOpen, onOpen, onOpenChange} = useDisclosure()
    const activeRole = user?.data?.activerole

    if(!activeRole || activeRole === 'staff') {
        return <div className='text-center text-gray-500 mt-10'>You do not have permission to view this page.</div>
    }
    
    return (
        <PageAccess allowedRoles={['admin','manager', 'superadmin']}>
            <CreateUserModal activerole={activeRole} isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange} />
            <div className="p-4">
                <UsersList 
                    activerole={activeRole} 
                    topContent={
                        <Button onPress={onOpen} color='primary' variant='flat' size='sm' endContent={<Plus size={18} />} >Create User</Button>
                    }
                />
            </div>
        </PageAccess>
    )
}

export default Index