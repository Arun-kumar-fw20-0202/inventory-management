// import { useAuthLogout } from "@/libs/mutation/auth/use-logout";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {User} from "@heroui/user";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import {Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

export const PrintMenues = ({menuList, onOpenChange}) => {
   const pathname = usePathname();
     const [expanded, setExpanded] = useState({});

   const handleExpand = (index) => {
     setExpanded((prev) => ({
       ...prev,
       [index]: !prev[index],
     }));
   };

    return menuList.map((item, index) => (
      <div className='flex flex-col gap-2' key={index}>
        <Button 
          as={Link} 
          href={item?.isComingsoon ? '#' : item?.menues.length > 0 ? '#' : item.url} 
          className={`flex w-full gap-3 flex-row p-3 rounded-md cursor-pointer transition-all ${ pathname === item.url || pathname == item?.url.includes(pathname) ? 'bg-primary bg-opacity-15 text-primary hover:bg-opacity-30 dark:text-white' : 'bg-transparent hover:bg-default-100' }`} 
          isDisabled={item?.isComingsoon}
          onPress={() => {
            handleExpand(index)
            item?.menues.length > 0 ? null : onOpenChange()
          }} 
        >
          <item.icon size={20}  />
          <span className="flex-1">{item.title}</span>
          {item.menues?.length > 0 && (
            <span>{expanded[index] ? '▼' : '▶'}</span>
          )}
          {item?.isComingsoon && <Chip size='sm' className='bg-gray-500 text-white rounded-md text-[10px]'>Coming Soon</Chip>}
        </Button>

        {/* Submenu Items */}
          {expanded[index] && item.menues?.length > 0 && (
            <div className="flex flex-col gap-1 pl-8">
              {item.menues.map((subItem, subIndex) => (
                <Button size='sm' variant='flat' color={pathname === subItem.path ? 'primary' : 'light'} as={Link} href={subItem.path} key={subIndex} className={`flex justify-start p-2 rounded-md cursor-pointer transition-all`} onPress={() => onOpenChange()}
                >
                  {subItem.name}
                </Button>
              ))}
            </div>
          )}
      </div>
    ))
  }


  export const SidebrProfile = ({ user }) => {
      // const { mutate: logout, isPending: logingout, isSuccess: logedout } = useAuthLogout();
      const { theme, setTheme } = useTheme()
      return (
        <div className="mt-auto border-t pt-4">
            <Dropdown>
              <DropdownTrigger>
                  <User
                  avatarProps={{
                    src: "https://avatars.githubusercontent.com/u/30373425?v=4",
                  }}
                  description={
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-900 dark:text-gray-300">{user?.data?.phone}</p>
                        <Chip className='rounded-lg p-1' size="xs" color="primary">{user?.data?.activerole}</Chip>
                        {/* {user?.data?.whatsapp_cred && (
                          <Chip color="success" variant="flat" avatar={<FaWhatsapp />} className='rounded-md text-[10px]' size='sm'>
                            {Math.ceil(user?.data?.whatsapp_cred)} WhatsApp Credits
                          </Chip>
                        )} */}
                        {/* <Button color="danger" size='sm' isLoading={logingout} onPress={() => logout()}>
                        Logout
                        </Button> */}
                    </div>
                  }
                  name={user?.data?.name}
                  />
              </DropdownTrigger>
              <DropdownMenu>
                  <DropdownItem as={Link} href="/setting">Settings</DropdownItem>
                  {/* <DropdownItem>Settings</DropdownItem> */}
                  <DropdownItem onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark') }>
                        {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </DropdownItem>
                  {/* <DropdownItem
                    isLoading={logingout}
                    onPress={() => logout()}
                    className="text-red-500"
                  >
                        Logout
                  </DropdownItem> */}
              </DropdownMenu>
            </Dropdown>
            </div>
      );
  }