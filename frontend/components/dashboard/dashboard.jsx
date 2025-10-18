'use client'
import React from 'react'
import { useSelector } from 'react-redux';
import StaffDashboard from './staff-dashboard';
import AdminDashboard from './admin-dashboard';
import SuperadminDashboard from './superadmin-dashboard';
import { useHasPermission } from '@/libs/utils/check-permission';

const Dashboard = () => {
    const user = useSelector((state) => state.auth.user);
    const activeRole = user?.data?.activerole    
    
    if(activeRole === 'staff' || activeRole == 'manager') {
        return <StaffDashboard />
    }
    // if(activeRole === 'manager') {
    //     return <ManagerDashboard />
    // }
    if(activeRole === 'admin') {
        return <AdminDashboard />
    }
    if(activeRole === 'superadmin') {
        return <SuperadminDashboard />
    }

}

export default Dashboard