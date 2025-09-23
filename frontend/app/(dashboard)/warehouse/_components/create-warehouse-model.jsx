import {
   Modal,
   ModalContent,
   ModalHeader,
   ModalBody,
   ModalFooter,
 } from "@heroui/modal";
 import { Button } from "@heroui/button";
 import { Input, Textarea } from "@heroui/input";
 
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { usecreateWarehouse } from "@/libs/mutation/warehouse/use-create-warehouse";
import { LocateIcon, Warehouse } from "lucide-react";
 
 export default function CreateWherehouseModel({isOpen, onOpen, onOpenChange}) {

   const { mutate: CreateWarehouse, isPending: creating, isSuccess: created } = usecreateWarehouse();

   const {
      control,
      handleSubmit,
      formState: { errors },
      reset: resetFm
   } = useForm();

   const onCreateWherehouse = (data) => {
      CreateWarehouse(data);
   }

   useEffect(() => {
      if(created) {
         onOpenChange();
         resetFm({
            name: "",
            location: "",
         });
      }
   }, [created]);
 
   return (
     <>
       <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
         <ModalContent>
            {(onClose) => (
               <form onSubmit={handleSubmit(onCreateWherehouse)}>
                  <ModalHeader className="flex flex-col gap-1">Warehouse</ModalHeader>
                  <ModalBody>
                     <Controller 
                        control={control}
                        name="name"
                        render={({field}) => (
                           <Input variant="bordered" {...field} placeholder="Warehouse name" label="Warehouse Name" startContent={<Warehouse size={16} />} size="sm" />
                        )}
                     />
                     <Controller 
                        control={control}
                        name="location"
                        render={({field}) => (
                           <Input variant="bordered" {...field} placeholder="Location" label="Location" startContent={<LocateIcon size={16} />} size="sm" />
                        )}
                     />
                  </ModalBody>
                  <ModalFooter>
                     <Button size="sm" color="danger" variant="light" onPress={onClose}>Close</Button>
                     <Button size="sm" color="primary" type='submit' isLoading={creating}>Create +</Button>
                  </ModalFooter>
               </form>
            )}
         </ModalContent>
       </Modal>
     </>
   );
 }
 