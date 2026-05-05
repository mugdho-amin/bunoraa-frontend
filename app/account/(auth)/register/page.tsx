"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/auth/useAuth";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string().min(8, "Confirm your password"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = React.useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
      phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await register.mutateAsync(values);
    router.push("/account/login/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-3 sm:px-5 py-20">
        <Card variant="bordered" className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Create account</h1>
          </div>

          <GoogleLoginButton nextUrl="/account/profile/" />

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <label className="block text-sm">
              First name
              <input
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2"
                {...form.register("first_name")}
              />
            </label>
            <label className="block text-sm">
              Last name
              <input
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2"
                {...form.register("last_name")}
              />
            </label>
            <label className="block text-sm">
              Phone
              <input
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2"
                {...form.register("phone")}
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2"
                type="email"
                {...form.register("email")}
              />
            </label>
            <label className="block text-sm">
              Password
              <div className="relative mt-2">
                <input
                  className={`w-full rounded-lg border border-border bg-card px-3 py-2 pr-12 transition-all ${showPassword ? "text-base tracking-normal font-normal" : "text-xl tracking-widest font-bold [-webkit-text-stroke:1px_currentColor]"}`}
                  type={showPassword ? "text" : "password"}
                  {...form.register("password", { onChange: (e) => setPasswordValue(e.target.value) })}
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground p-2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {!showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.78 0 1.53-.09 2.24-.26"/><path d="M2 2l20 20"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                )}
              </div>
            </label>
            <label className="block text-sm">
              Confirm password
              <div className="relative mt-2">
                <input
                  className={`w-full rounded-lg border border-border bg-card px-3 py-2 pr-12 transition-all ${showConfirmPassword ? "text-base tracking-normal font-normal" : "text-xl tracking-widest font-bold [-webkit-text-stroke:1px_currentColor]"}`}
                  type={showConfirmPassword ? "text" : "password"}
                  {...form.register("password_confirm", { onChange: (e) => setConfirmPasswordValue(e.target.value) })}
                />
                {confirmPasswordValue && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground p-2"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {!showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.78 0 1.53-.09 2.24-.26"/><path d="M2 2l20 20"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                )}
              </div>
            </label>

            {register.isError ? (
              <p className="text-sm text-red-500">
                {register.error instanceof Error
                  ? register.error.message
                  : "Registration failed."}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? "Creating..." : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-foreground/70">
            Already have an account?{" "}
            <Link className="text-primary" href="/account/login/">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
