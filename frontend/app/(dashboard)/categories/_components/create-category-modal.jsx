
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
import { Info, Table } from "lucide-react";
import { useCreateProductsCategory, useUpdateCategory } from "@/libs/mutation/category/use-create-category";
 
export default function CreateProductCategoryModel({ isOpen, onOpen, onOpenChange, item = null }) {

   const { mutate: CreateCategory, isLoading: creating, isSuccess: created } = useCreateProductsCategory();
   const { mutate: UpdateCategory, isLoading: updating, isSuccess: updated } = useUpdateCategory();

   const {
      control,
      handleSubmit,
      formState: { errors },
      reset: resetFm
   } = useForm();

   const onCreateWherehouse = (data) => {
      if (item && (item._id || item.id)) {
         const id = item._id || item.id
         UpdateCategory({ id, ...data })
      } else {
         CreateCategory(data)
      }
   }

   // Close/reset after create or update
   useEffect(() => {
      if (created || updated) {
         onOpenChange(false)
         resetFm({ name: "", description: "" })
      }
   }, [created, updated])

   // Prefill form when editing
   useEffect(() => {
      if (isOpen && item) {
         resetFm({ name: item.name || '', description: item.description || '' })
      }
      if (!isOpen) {
         resetFm({ name: '', description: '' })
      }
   }, [isOpen, item])
 
   return (
     <>
       <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
         <ModalContent>
            {(onClose) => (
               <form onSubmit={handleSubmit(onCreateWherehouse)}>
                  <ModalHeader className="flex flex-col gap-1">Products Category</ModalHeader>
                  <ModalBody>
                     <Controller 
                        control={control}
                        name="name"
                        rules={{ required: "Category name is required" }}
                        render={({field}) => (
                          <Input  {...field} placeholder="Category name" label="Category Name" startContent={<Table size={16} />} size="sm" 
                            isInvalid={errors?.name?.message ? true : false} 
                            errorMessage={errors?.name?.message}
                          />
                        )}
                     />
                     <Controller 
                        control={control}
                        name="description"
                        rules={{ required: "Description is required" }}
                        render={({field}) => (
                          <Textarea  {...field} placeholder="Description" label="Description" startContent={<Info size={16} />} size="sm" 
                            isInvalid={errors?.description?.message ? true : false}
                            errorMessage={errors?.description?.message}
                          />
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
 