"use client";

import * as React from "react";
import { LogOut } from "@/components/icons";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, setPending] = React.useState(false);

  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={() => setPending(true)}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="w-full justify-start text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
