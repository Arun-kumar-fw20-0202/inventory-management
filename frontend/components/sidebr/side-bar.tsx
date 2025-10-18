// @ts-nocheck
'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { getMenuList } from './menu-list';

import {User} from "@heroui/user";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import {Chip } from '@heroui/chip';
import { Card } from '@heroui/card';
import { Button } from '@heroui/button';


import Link from 'next/link';
// import { useAuthLogout } from '@/libs/mutation/auth/use-logout';
import { useTheme } from 'next-themes';
import MobileSideBar from './mobile-sidebr';

import { Menu, X, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { PrintMenues, SidebrProfile } from './print-menues';
import { useDisclosure } from '@heroui/modal';
import { NotificationDrawer } from '../dynamic/notifications/notification-drawer';
import { Badge } from '@heroui/badge';
import { NotificationIcon } from '../icons';

export const Sidebar = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const permissions = useSelector((state) => state.permissions?.permissions)
  const { isOpen: isOpenNotification, onOpen: onOpenNotification, onOpenChange: onOpenChangeNotification } = useDisclosure();
  const organisation = useSelector((state) => state?.organisation?.organisation?.organisation);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // console.log("Organisation in Sidebar:", organisation); // Debugging line
  const menuList = getMenuList(user?.data?.activerole, permissions);

  // console.log("Menu List:", menuList); // Debugging line
  
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  
  const { theme, setTheme } = useTheme()


  const BrandLog = () => (
    <div className="flex items-center gap-2">
      {organisation?.details?.logoUrl ? (
        <>
          <img src={organisation?.details?.logoUrl} alt="Logo" className="w-12 h-12 object-cover rounded-full" />
          {!isCollapsed && <span className="text-sm font-bold">{organisation?.name || 'Inventory'}</span>}
        </>
      ) : (
        <>
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-cover" />
          {!isCollapsed && <span className="text-sm font-bold">Inventory</span>}
        </>
      )}
    </div>
  );


  const [notificationCount, setNotificationCount] = useState(0);
  return (
    <>
      <div className="flex h-screen w-full flex-row">
        {/* Sidebar */}
        <NotificationDrawer 
          isOpen={isOpenNotification}
          onOpen={onOpenNotification}
          count={(count) => setNotificationCount(count)}
          onOpenChange={onOpenChangeNotification}
        />
        <Card className={`z-[20] w-[${isCollapsed ? '40px' : '260px'}] rounded-none md:flex flex-col justify-between md:border-r border-none border-gray-300 shadow-md ${!isCollapsed ? 'md:p-4' : 'md:p-1'} hidden p-0 h-screen transition-all`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
            <Button className='' isIconOnly size="sm" variant="flat" onPress={() => setIsCollapsed(prev => !prev)} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
            {!isCollapsed && (
              <div className='cursor-pointer' onClick={onOpenNotification}>
                <Badge color="danger" content={notificationCount} shape="circle">
                  <NotificationIcon className="fill-current" size={30} />
                </Badge>
              </div>
            )}
          </div>
        
          {/* <div className="flex items-center justify-center w-full">
            <div className="flex gap-2 items-center">
              <BrandLog />
              
            </div>
          </div> */}
          {/* Sidebar Header (Brand + Toggle shown above) */}
          {/* Sidebar Menu */}
          <nav className={`flex-1 mt-3 overflow-y-auto flex ${isCollapsed && 'px-2'} flex-col overflow-x-hidden gap-2`}>
            {isCollapsed && (
              <div className='cursor-pointer' onClick={onOpenNotification}>
                <Badge color="danger" content={notificationCount} shape="circle">
                  <NotificationIcon className="fill-current" size={30} />
                </Badge>
              </div>
            )}
            <PrintMenues menuList={menuList} onOpenChange={() => {}} collapsed={isCollapsed} />
          </nav>

          {/* User Profile Section */}
          <SidebrProfile user={user} collapsed={isCollapsed} />
        </Card>

        <MobileSideBar isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange} headerdata={<BrandLog />}>
          <div className="rounded-none flex flex-col w-[80%] h-screen">
            <PrintMenues menuList={menuList} onOpenChange={onOpenChange} />
            <SidebrProfile user={user} />
          </div>
        </MobileSideBar>


        {/* Main Content */}
        {/* <div className="relative flex-1 overflow-y-auto bg-gradient-to-br from-default-50 to-default-100"> */}
        <div className="relative flex-1 overflow-y-auto">
          {/* <section className="h-full w-full absolute front-section before:bg-secondary before:bg-opacity-30"></section> */}
          {/* <section className='absolute inset-0 h-full w-full bg-secondary dark:bg-gray-900'></section> */}
          {/* hamburger menu */}
          <Card className="rounded-none p-2 w-full flex md:hidden">
            <div className="flex items-center gap-3">
              {!isOpen ? <Menu onClick={onOpenChange} size={30} /> : <X onClick={onOpenChange} size={30} />}
              <div className="flex justify-between w-full">
                <div>
                  <p className='text-2xl'>{user?.data?.name}</p>
                  <Chip className='text-sm rounded-md' size='sm' color="primary">{user?.data?.activerole}</Chip>

                </div>
                <div className="flex justify-between items-center gap-2">
                  <div className='cursor-pointer p-2' onClick={onOpenNotification}>
                    <Badge color="danger" content={notificationCount} shape="circle">
                      <NotificationIcon className="fill-current" size={30} />
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {children}
        </div>
      </div>
    </>
  );
};
