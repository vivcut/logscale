"use client";

import * as React from "react";
import { useActionState } from "react";
import { BadgeCheck, Loader2, Send } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 submitContact,
 type ContactSubmitState,
} from "@/app/dashboard/contact-page/actions";

const initialState: any = { ok: false };

/**
 * The public contact form. Shared by the standalone public page and the
 * embeddable widget so submissions are identical everywhere. The workspace
 * owner controls the textarea placeholder + whether email/SMS are mandatory.
 */
export function ContactForm({
 workspaceId,
 placeholder,
 emailRequired,
 smsRequired,
}: any) {
 const [state, formAction, pending] = useActionState(
  submitContact,
  initialState
 );

 if (state.ok) {
  return (
   <div className="flex flex-col items-center justify-center rounded-xl  border-2 border-border bg-card py-16 text-center">
    <BadgeCheck className="mb-3 size-8 text-emerald-400" />
    <h2 className="text-lg font-semibold">Message sent!</h2>
    <p className="mt-1 text-sm text-muted-foreground">
     Thanks for reaching out — we&apos;ll get back to you soon.
    </p>
   </div>
  );
 }

 return (
  <form action={formAction} className="space-y-5">
   <input type="hidden" name="workspace_id" value={workspaceId} />

   {/* Message */}
   <div className="space-y-2 rounded-xl  border-2 border-border bg-card p-5">
    <label htmlFor="message" className="block text-sm font-medium">
     Message <span className="text-destructive">*</span>
    </label>
    <textarea
     id="message"
     name="message"
     rows={5}
     required
     placeholder={placeholder}
     className="w-full resize-y rounded-xl  border-2 border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
    />
   </div>

   {/* Contact details */}
   <div className="space-y-4 rounded-xl  border-2 border-border bg-card p-5">
    <div className="space-y-2">
     <label htmlFor="email" className="block text-sm font-medium">
      Email{" "}
      {emailRequired ? (
       <span className="text-destructive">*</span>
      ) : (
       <span className="font-mono text-xs text-muted-foreground">
        (optional)
       </span>
      )}
     </label>
     <Input
      id="email"
      name="email"
      type="email"
      placeholder="you@example.com"
      required={emailRequired}
     />
    </div>

    <div className="space-y-2">
     <label htmlFor="sms" className="block text-sm font-medium">
      Phone / SMS{" "}
      {smsRequired ? (
       <span className="text-destructive">*</span>
      ) : (
       <span className="font-mono text-xs text-muted-foreground">
        (optional)
       </span>
      )}
     </label>
     <Input
      id="sms"
      name="sms"
      type="tel"
      placeholder="+1 555 000 1234"
      required={smsRequired}
     />
    </div>
   </div>

   {state.error ? (
    <p className="font-mono text-xs text-destructive">{state.error}</p>
   ) : null}

   <div className="flex justify-end">
    <Button type="submit" disabled={pending}>
     {pending ? <Loader2 className="animate-spin" /> : <Send />}
     Send message
    </Button>
   </div>
  </form>
 );
}
