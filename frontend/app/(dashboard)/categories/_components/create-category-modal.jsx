
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
import { useCreateProductsCategory } from "@/libs/mutation/category/use-create-category";
 
 export default function CreateProductCategoryModel({isOpen, onOpen, onOpenChange}) {

   const { mutate: CreateCategory, isPending: creating, isSuccess: created } = useCreateProductsCategory();

   const {
      control,
      handleSubmit,
      formState: { errors },
      reset: resetFm
   } = useForm();

   const onCreateWherehouse = (data) => {
      CreateCategory(data);
   }

   useEffect(() => {
      if(created) {
         onOpenChange();
         resetFm({
            name: "",
            description: "",
         });
      }
   }, [created]);
 
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
 