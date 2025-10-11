// import { useAuthLogout } from "@/libs/mutation/auth/use-logout";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {User} from "@heroui/user";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import {Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { useAuthLogout } from "@/libs/mutation/auth/use-login";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { useSelector } from "react-redux";
import { Badge } from "@heroui/badge";

export const PrintMenues = ({menuList, onOpenChange, collapsed = false}) => {
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
        {collapsed && item?.menues?.length > 0 ? (
          // When collapsed and this item has submenus, show a popover trigger (icon-only)
          <Popover placement="right" key={`pop-${index}`}>
            <PopoverTrigger>
              <Button
                // size="sm"
                isIconOnly
                className={`hover:bg-default-100`}
                variant={pathname === item?.url ? 'flat' : 'light'}
                color={pathname === item?.url ? 'primary' : 'light'}
                isDisabled={item?.isComingsoon}
                title={item?.title}
              >
                <Badge color="warning" placement="bottom-right" content={item?.menues?.length}>
                  <item.icon size={18} />
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-1">
                {item.menues.map((subItem, subIndex) => (
                  <Button
                    key={subIndex}
                    size="sm"
                    variant="flat"
                    color={pathname === subItem?.path ? 'primary' : 'light'}
                    as={Link}
                    href={subItem?.path}
                    className="justify-start hover:bg-default-100"
                    onPress={() => onOpenChange()}
                  >
                    {subItem?.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // Normal full or collapsed-no-submenus button
          <Button 
            variant={pathname === item?.url ? 'flat' : 'light'}
            color={pathname === item?.url ? 'primary' : 'light'}
            as={Link} 
            className={`hover:bg-default-100`}
            isIconOnly={collapsed}
            href={item?.isComingsoon ? '#' : item?.menues.length > 0 ? '#' : item?.url} 
            isDisabled={item?.isComingsoon}
            startContent={<item.icon size={20}  />}
            onPress={() => {
              handleExpand(index)
              item?.menues.length > 0 ? null : onOpenChange()
            }}
            title={collapsed ? item?.title : undefined}
          >
            {!collapsed && <span className="flex-1">{item?.title}</span>}
            {!collapsed && item?.menues?.length > 0 && (
              <span>{expanded[index] ? '▼' : '▶'}</span>
            )}
            {!collapsed && item?.isBeta && <Chip size='sm' variant="shadow" color="warning" className='rounded-md text-[10px]'>Beta</Chip>}
            {!collapsed && item?.isComingsoon && <Chip size='sm' className='bg-foreground text-background rounded-md text-[10px]'>Soon</Chip>}
          </Button>
        )}

        {/* Submenu Items */}
          {expanded[index] && item?.menues?.length > 0 && !collapsed && (
            <div className="flex flex-col gap-1 pl-6">
              {item?.menues.map((subItem, subIndex) => (
                <Button size='sm' variant='flat' color={pathname === subItem?.path ? 'primary' : 'light'} as={Link} href={subItem?.path} key={subIndex} className={`flex justify-start p-2 rounded-md cursor-pointer transition-all hover:bg-default-100`} onPress={() => onOpenChange()}>
                  {subItem?.name}
                </Button>
              ))}
            </div>
          )}
      </div>
    ))
  }


  export const SidebrProfile = ({ user, collapsed = false }) => {
      const { mutate: logout, isPending: logingout } = useAuthLogout();
      const { theme, setTheme } = useTheme();
      const organisation = useSelector((state) => state?.organisation?.organisation?.organisation);

      return (
        <div className="mt-auto border-t pt-4">
          {collapsed ? (
            <div className="flex items-center justify-center p-2">
              <User avatarProps={{ src: "https://avatars.githubusercontent.com/u/30373425?v=4" }} />
            </div>
          ) : (
            <Dropdown>
              <DropdownTrigger>
                  <User
                    avatarProps={{ src: organisation?.details?.logoUrl || "https://avatars.githubusercontent.com/u/30373425?v=4" }}
                    description={
                      <div className="flex flex-col gap-1">
                          <p className="text-gray-900 dark:text-gray-300">{user?.data?.phone}</p>
                          <Chip className='rounded-lg p-1' size="xs" color="primary">{user?.data?.activerole}</Chip>
                      </div>
                    }
                    name={user?.data?.name}
                  />
              </DropdownTrigger>
              <DropdownMenu>
                  <DropdownItem as={Link} href="/settings">Settings</DropdownItem>
                  <DropdownItem onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark') }>
                    {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </DropdownItem>
                  <DropdownItem
                    isLoading={logingout}
                    onPress={() => logout()}
                    className="text-red-500"
                  >
                    Logout
                  </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      );
  }