'use client';
import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";

export default function MobileSideBar({isOpen, onOpen, onOpenChange, headerdata, children}) {
  const [placement, setPlacement] = React.useState("left");

  const handleOpen = (placement) => {
    setPlacement(placement);
    onOpen();
  };

   return (
      <>
         <Drawer isOpen={isOpen} placement={placement} onOpenChange={onOpenChange} size='xs'>
            <DrawerContent>
               {(onClose) => (
                  <>
                     <DrawerHeader className="flex flex-col gap-1">{headerdata}</DrawerHeader>
                     <DrawerBody>
                     {children}
                     </DrawerBody>
                     {/* <DrawerFooter></DrawerFooter> */}
                  </>
               )}
            </DrawerContent>
         </Drawer>
      </>
   );
}
