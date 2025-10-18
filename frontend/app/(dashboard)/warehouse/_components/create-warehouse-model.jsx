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
import { usecreateWarehouse, useUpdateWarehouse } from "@/libs/mutation/warehouse/use-create-warehouse";
import { LocateIcon, Warehouse } from "lucide-react";
 
export default function CreateWherehouseModel({ isOpen, onOpen, onOpenChange, item = null }) {

   const { mutate: CreateWarehouse, isLoading: creating, isSuccess: created } = usecreateWarehouse();
   const { mutate: UpdateWarehouse, isLoading: updating, isSuccess: updated } = useUpdateWarehouse();

   const {
      control,
      handleSubmit,
      formState: { errors },
      reset: resetFm
   } = useForm();

   const onCreateWherehouse = (data) => {
      if (item && (item._id || item.id)) {
         // update existing
         const id = item._id || item.id
         UpdateWarehouse({ id, ...data })
      } else {
         CreateWarehouse(data)
      }
   }

   // Close/reset after create or update finishes
   useEffect(() => {
      if (created || updated) {
         onOpenChange(false)
         resetFm({ name: "", location: "" })
      }
   }, [created, updated])

   // When modal opens for edit, populate form
   useEffect(() => {
      if (isOpen && item) {
         resetFm({ name: item.name || '', location: item.location || '', description: item.description || '' })
      }
      if (!isOpen) {
         resetFm({ name: '', location: '', description: '' })
      }
   }, [isOpen, item])
 
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
                     <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                           <Textarea {...field} placeholder="Optional description" label="Description" size="sm" />
                        )}
                     />
                  </ModalBody>
                  <ModalFooter>
                     <Button size="sm" color="danger" variant="light" onPress={onClose}>Close</Button>
                     <Button size="sm" color="primary" type='submit' isLoading={creating || updating}>{item ? 'Update' : 'Create +'}</Button>
                  </ModalFooter>
               </form>
            )}
         </ModalContent>
       </Modal>
     </>
   );
 }
 