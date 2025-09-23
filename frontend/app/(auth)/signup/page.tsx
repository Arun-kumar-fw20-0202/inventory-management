// @ts-nocheck
'use client'
 import { Button } from "@heroui/button";
 import { Card, CardBody } from "@heroui/card";
 import { Input } from "@heroui/input";
 
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useState, useCallback, useEffect } from "react";
import api from "@/components/base-url";
import { MailIcon } from "@/components/icons";
import Stepper from "@/components/ui/stepper";
import { Phone } from "lucide-react";
 
  export default function Index({ searchParams } = {}) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const ref = searchParams.ref || "";

    // console.log("Referral code from URL:", ref);

    const {
      control,  
      handleSubmit,
      formState: { errors },
      reset,
      trigger,
      getValues
    } = useForm({
      defaultValues: {
        name: '',
        phone: '',
        email: '',
        shop_name: '',
        password: '',
        referralCode: ref || ""
      }
    });

    const { mutateAsync: SignupUser, isPending: signing } = useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/auth/signup', data)
        return response.data;
      },
    });

    const onSubmit = async (data) => {
      // Prevent signup if referral code is present and invalid
      if (data.referralCode && referralStatus.valid === false) {
        toast.error("Please enter a valid referral code or leave it blank.");
        return;
      }
      try{
        await SignupUser(data)
        toast.success("Signup Successful");
        router.push("/");
      }catch (error) {
        console.error("Signup error:", error);
        toast.error(error?.response?.data.message || "An error occurred during signup.");
      }
    }

    const [referralStatus, setReferralStatus] = useState({ loading: false, valid: null, name: "", shop_name: "", error: "" });

    // Live referral code check
    const checkReferralCode = async (code) => {
      if (!code) {
        setReferralStatus({ loading: false, valid: null, name: "", shop_name: "", error: "" });
        return;
      }
      setReferralStatus({ loading: true, valid: null, name: "", shop_name: "", error: "" });
      try {
        const res = await api.get(`/auth/check-referral?code=${code}`);
        if (res.data.success && res.data.name) {
          setReferralStatus({ loading: false, valid: true, name: res.data.name, shop_name: res.data.shop_name, error: "" });
        } else {
          setReferralStatus({ loading: false, valid: false, name: "", shop_name: "", error: "Referral code not found" });
        }
      } catch (err) {
        setReferralStatus({ loading: false, valid: false, name: "", shop_name: "", error: "Referral code not found" });
      }
    };

    // Debounced referral code check
    const debouncedCheckReferralCode = useCallback(
      debounce((code) => checkReferralCode(code), 500),
      []
    );

    const steps = [
      'Account Info',
      'Shop Info',
      'Security',
      'Referral (Optional)'
    ];

    // Define required fields for each step
    const stepFields = [
      ['name', 'phone'], // Step 0: Account Info
      ['shop_name'],     // Step 1: Shop Info
      ['password'],      // Step 2: Security
      []                 // Step 3: Referral (no required fields)
    ];

    // Use a separate form state for each step to avoid field value overlap
    const [stepValues, setStepValues] = useState({
      name: '',
      phone: '',
      email: '',
      shop_name: '',
      password: '',
      referralCode: ref || ""
    });
    const [showPassword, setShowPassword] = useState(false);

    // Patch: keep form values in sync with stepValues
    useEffect(() => {
      reset(stepValues);
    }, [step, reset]);

    // On field change, update stepValues
    const handleFieldChange = (field, value) => {
      setStepValues(prev => ({ ...prev, [field]: value }));
    };

    // Step 1: Account Info
    const AccountStep = (
      <div className="space-y-4">
        <Controller 
          name="name"
          control={control}
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <Input {...field} value={stepValues.name} onChange={e => { field.onChange(e); handleFieldChange('name', e.target.value); }} label="Name" placeholder="Enter your name" variant="bordered" isInvalid={!!errors.name} errorMessage={errors.name?.message} />
          )}
        />
        <Controller 
          name="phone"
          control={control}
          rules={{ required: "Phone number is required", pattern: { value: /^\d{10}$/, message: "Invalid phone number" } }}
          render={({ field }) => (
            <Input {...field} value={stepValues.phone} onChange={e => { field.onChange(e); handleFieldChange('phone', e.target.value); }} label="Phone Number" placeholder="Enter your phone number" variant="bordered" endContent={<Phone className="text-default-400" />} isInvalid={!!errors.phone} errorMessage={errors.phone?.message} />
          )}
        />
        <Controller 
          name="email"
          control={control}
          render={({ field }) => (
            <Input {...field} value={stepValues.email} onChange={e => { field.onChange(e); handleFieldChange('email', e.target.value); }} endContent={<MailIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />} label="Email Address" placeholder="Enter your email" variant="bordered" isInvalid={!!errors.email} errorMessage={errors.email?.message} />
          )}
        />
      </div>
    );

    // Step 2: Shop Info
    const ShopStep = (
      <div className="space-y-4">
        <Controller 
          name="shop_name"
          control={control}
          rules={{ required: "Shop name is required" }}
          render={({ field }) => (
            <Input {...field} value={stepValues.shop_name} onChange={e => { field.onChange(e); handleFieldChange('shop_name', e.target.value); }} label="Shop Name" placeholder="Enter your shop name" variant="bordered" isInvalid={!!errors.shop_name} errorMessage={errors.shop_name?.message} />
          )}
        />
      </div>
    );

    // Step 3: Security
    const SecurityStep = (
      <div className="space-y-4">
        <Controller 
          name="password"
          control={control}
          rules={{ required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } }}
          render={({ field }) => (
            <Input {...field} value={stepValues.password} onChange={e => { field.onChange(e); handleFieldChange('password', e.target.value); }}
              label="Password" placeholder="Enter your password" type={showPassword ? "text" : "password"} variant="bordered" isInvalid={!!errors.password} errorMessage={errors.password?.message}
              endContent={
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="focus:outline-none">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-default-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-default-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c1.772 0 3.433-.37 4.893-1.02M6.228 6.228A10.45 10.45 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a17.896 17.896 0 01-3.197 4.412M15 15l6 6M3 3l6 6" /></svg>
                  )}
                </button>
              }
            />
          )}
        />
      </div>
    );

    // Step 4: Referral
    const ReferralStep = (
      <div className="space-y-4">
        <Controller 
          name="referralCode"
          control={control}
          render={({ field }) => (
            <div>
              <Input {...field} value={stepValues.referralCode} onChange={e => { field.onChange(e); handleFieldChange('referralCode', e.target.value); debouncedCheckReferralCode(e.target.value.trim()); }} label="Referral Code (optional)" placeholder="Enter referral code if you have one" variant="bordered" />
              {referralStatus.loading && (<span className="text-xs text-default-400">Checking referral code...</span>)}
              {referralStatus.valid && (<span className="text-xs text-success-600">Referred by: {referralStatus.name} {referralStatus?.shop_name && `Shop (${referralStatus?.shop_name})`}</span>)}
              {referralStatus.valid === false && (<span className="text-xs text-danger-600">{referralStatus.error}</span>)}
            </div>
          )}
        />
      </div>
    );

    const stepContent = [AccountStep, ShopStep, SecurityStep, ReferralStep];

    useEffect(() => {
      if (ref) {
        // Set the referralCode field value if ref exists in URL
        reset({ ...getValues(), referralCode: ref });
        // Check the referral code validity on load
        checkReferralCode(ref);
      }
    }, [ref, reset, getValues]);

    // Intercept stepper navigation to prevent skipping required fields
    const handleStepChangeRequest = async (targetStep) => {
      if (targetStep === step) return;
      if (targetStep < step) {
        setStep(targetStep); // Always allow going back
        return;
      }
      // Only allow moving forward one step at a time, and validate required fields
      for (let s = step; s < targetStep; s++) {
        const fieldsToValidate = stepFields[s];
        const isValid = await trigger(fieldsToValidate);
        if (!isValid) {
          // Optionally, scroll to the first invalid field or show a message
          return;
        }
      }
      setStep(targetStep);
    };

    const handleNext = async (e) => {
      if (e) e.preventDefault(); // Prevent form submit on Next
      const fieldsToValidate = stepFields[step];
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setStep(s => Math.min(s + 1, steps.length - 1));
      }
    };

    const handleBack = () => setStep(s => Math.max(s - 1, 0));

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-auto">
          <CardBody className="p-8">
            <div className="flex flex-col gap-1 text-center pb-2 mb-6">

              {/* <div>
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
              </div> */}
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sign Up</h2>
              <p className="text-small font-normal">Create your account in a few easy steps</p>
            </div>
            <Stepper
              steps={steps}
              activeStep={step}
              onStepChangeRequest={handleStepChangeRequest}
            />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
              {stepContent[step]}
              <div className="flex gap-2 justify-between pt-6">
                <Button disabled={step === 0} onPress={handleBack} variant="bordered" type="button">Back</Button>
                {step < steps.length - 1 ? (
                  <Button color="primary" onPress={handleNext} type="button">Next</Button>
                ) : (
                  <Button isLoading={signing} type="submit" color="primary" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-semibold w-full">{signing ? "Signing up..." : "Sign Up"}</Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

 // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
 }
