"use client";

import * as React from "react";
import { ArrowRight, Loader2, Mail } from "@/components/icons";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "google" | "email" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const getRedirectTo = () =>
    `${window.location.origin}/auth/callback?next=/dashboard`;

  async function handleGoogle() {
    setErrorMsg(null);
    setStatus("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectTo(),
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  }

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setErrorMsg(null);
    setStatus("email");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectTo(),
        shouldCreateUser: true,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full border-2 border-border-2 bg-secondary">
          <Mail className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to{" "}
            <span className="font-mono text-foreground">{email}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-muted-foreground"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={status === "google"}
      >
        {status === "google" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@startup.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={status === "email" || !email}
        >
          {status === "email" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Continue with email
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      {errorMsg ? (
        <p className="text-center font-mono text-xs text-destructive">
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
