// @ts-nocheck
'use client'
import { UseAuthLogin } from "@/libs/mutation/auth/use-login";

 import { Button } from "@heroui/button";
 import { Card, CardBody } from "@heroui/card";
 import { Input } from "@heroui/input";
 import { Link } from "@heroui/link";
 import { Checkbox } from "@heroui/checkbox";

 
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MailIcon } from "lucide-react";
import ForgotPassword from "./_components/forgot-password";
 
 export default function Index() {
  const [showPassword, setShowPassword] = useState(false);
  const [type, setType] = useState("login"); // 'login' or 'forgot'
  
  const {
   control,  
   handleSubmit,
   formState: { errors },
   reset
  } = useForm();

  const { mutateAsync: LoginUser, isPending: logging } = UseAuthLogin()
  const router = useRouter()

  const onSubmit = async (data) => {
   try{
    await LoginUser(data)
    router.replace("/")
   }catch (error) {
    console.error("Login failed:", error)
   }

  }
 
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <section className="h-full w-full absolute front-section before:bg-primary before:bg-opacity-30"></section>
      <Card className="w-full max-w-md  shadow-2xl">
        {type === "login" ? (
          <CardBody className="py-8 px-8">
            <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="flex flex-col gap-1 text-center pb-2 mb-6">
              {/* <BrandLogo /> */}
              <h2 className="text-2xl font-bold text-primary ">
                Welcome Back
              </h2>
              <p className="text-small text-default-500 font-normal">
                Sign in to your account to continue
              </p>
            </div>
            
            {/* Body */}
            <div className="flex flex-col gap-6 mb-6">
                <Controller 
                name="email"
                control={control}
                rules={{
                  required: "Phone or Email is required",
                  // pattern: {
                  //   value: /^\S+@\S+$/i,
                  //   message: "Invalid email address"
                  // }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    endContent={
                      <MailIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
                    }
                    label="Phone or Email Address"
                    placeholder="Enter your Phone or Email"
                    variant="bordered"
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "border-default-200 data-[hover=true]:border-primary group-data-[focus=true]:border-primary",
                    }}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                  />
                )}
                />
                
                <Controller 
                  name="password"
                  control={control}
                  rules={{ 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      // endContent={
                      //   <EyeIcon />
                      // }
                      label="Password"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      variant="bordered"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "border-default-200 data-[hover=true]:border-primary group-data-[focus=true]:border-primary",
                      }}
                      isInvalid={!!errors.password}
                      errorMessage={errors.password?.message}
                    />
                  )}
                />

                <div className="flex py-2 px-1 justify-between items-center">
                <Checkbox
                  size="sm"
                  value={showPassword}
                  onValueChange={setShowPassword}
                  classNames={{
                    label: "text-small text-default-600",
                    wrapper: "data-[selected=true]:bg-primary data-[selected=true]:border-primary"
                  }}
                >
                  Show Password
                </Checkbox>
                <Button
                  variant='light'
                  size="sm"
                  onPress={() => setType('forgot')}
                >
                  Forgot password?
                </Button>
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex flex-col gap-4 pt-6">
              <Button 
                isLoading={logging} 
                color="primary" 
                type="submit"
                size="lg"
                className="w-full hover:opacity-90 transition-opacity font-semibold"
              >
                {logging ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center">
                <span className="text-small text-default-500">Don't have an account?{" "}</span>
                <Link color="primary" href="/signup" size="sm" className="font-medium hover:underline">Sign up</Link>
              </div>
            </div>
            </form>
          </CardBody>
          )
          : 
          <CardBody className="py-8 px-8">
            <ForgotPassword onBack={() => setType("login")} />
          </CardBody>
        }
      </Card>
    </div>
  );
 }
