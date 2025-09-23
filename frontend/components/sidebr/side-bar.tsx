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

import { Menu, X } from 'lucide-react';
import { PrintMenues, SidebrProfile } from './print-menues';
import { useDisclosure } from '@heroui/modal';

export const Sidebar = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  // console.log("User in Sidebar:", user); // Debugging line
  const menuList = getMenuList(user?.data?.activerole);

  // console.log("Menu List:", menuList); // Debugging line
  
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  
  const { theme, setTheme } = useTheme()


  const BrandLog = () => (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
      <span className="text-sm font-bold">Inventory</span>
    </div>
  );


  return (
    <>
      <div className="flex h-screen w-full flex-row">
        {/* Sidebar */}
        <Card className="z-[20] rounded-none flex flex-col justify-between md:border-r border-none border-gray-300 shadow-md md:p-4 md:w-[240px] p-0 w-0 h-screen">
          {/* Sidebar Header */}
            {/* <Chip className="text-md font-bold">The Royal Healthclub Gym</Chip> */}
            <BrandLog />
          {/* Sidebar Menu */}
          <nav className="flex-1 mt-3 overflow-y-auto flex flex-col gap-2">
            <PrintMenues menuList={menuList} onOpenChange={() => {}} />
          </nav>

          {/* User Profile Section */}
          <SidebrProfile user={user} />
        </Card>

        <MobileSideBar isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange} headerdata={<BrandLog />}>
          <div className="rounded-none flex flex-col w-[80%] h-screen">
            <PrintMenues menuList={menuList} onOpenChange={onOpenChange} />
            <SidebrProfile user={user} />
          </div>
        </MobileSideBar>


        {/* Main Content */}
        <div className="relative flex-1 overflow-y-auto ">
            {/* <section className="h-full w-full absolute front-section before:bg-secondary before:bg-opacity-30"></section> */}
            {/* <section className='absolute inset-0 h-full w-full bg-secondary dark:bg-gray-900'></section> */}
            {/* hamburger menu */}
            <Card className="rounded-none p-2 w-full flex md:hidden">
              <div className="flex items-center gap-3">
                {!isOpen ? <Menu onClick={onOpenChange} size={30} /> : <X onClick={onOpenChange} size={30} />}
                <p className='text-2xl'>{user?.data?.name}</p>
                <Chip className='text-sm' color="primary">{user?.data?.activerole}</Chip>
              </div>
            </Card>
            {children}
        </div>
      </div>
    </>
  );
};
