"use client";

import * as React from "react";
import { Loader2, Mail, Plus, Trash2, UserPlus } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteEditor, revokeInvite, removeMember } from "./editors-actions";

export type EditorMember = {
  profile_id: string;
  name: string | null;
  email: string;
  role: string;
};

export type PendingInvite = {
  id: string;
  email: string;
};

export function EditorsManager({
  canManage,
  members,
  invites,
}: {
  canManage: boolean;
  members: EditorMember[];
  invites: PendingInvite[];
}) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await inviteEditor(email);
    if (!res.ok) {
      setError(res.error ?? "Could not send invite.");
    } else {
      setOk(`Invited ${email.trim().toLowerCase()}`);
      setEmail("");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Invite form */}
      {canManage ? (
        <form onSubmit={onInvite} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={busy || !email.trim()}>
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Invite
            </Button>
          </div>
          {error ? (
            <p className="font-mono text-[10px] text-destructive">{error}</p>
          ) : null}
          {ok ? (
            <p className="font-mono text-[10px] text-emerald-500">{ok}</p>
          ) : null}
          <p className="font-mono text-[10px] text-muted-foreground">
            Editors can manage boards, roadmap & changelog. Anyone signing in
            with an invited email gets access automatically.
          </p>
        </form>
      ) : null}

      {/* Members + pending invites */}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border-2 border-border bg-card">
        {members.map((m) => (
          <li key={m.profile_id} className="flex items-center gap-3 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full  border-2 border-border  bg-secondary text-xs font-medium">
              {(m.name ?? m.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {m.name ?? m.email}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {m.email}
              </p>
            </div>
            <span className="shrink-0 rounded  border-2 border-border  px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              {m.role}
            </span>
            {canManage && m.role !== "owner" ? (
              <button
                disabled={pendingId === m.profile_id}
                onClick={async () => {
                  setPendingId(m.profile_id);
                  await removeMember(m.profile_id);
                  setPendingId(null);
                }}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove member"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </li>
        ))}

        {invites.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center gap-3 bg-secondary/20 p-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full  border-2 border-border border-dashed  text-muted-foreground">
              <Plus className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs text-muted-foreground">
                {inv.email}
              </p>
            </div>
            <span className="shrink-0 rounded  border-2 border-border  px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              pending
            </span>
            {canManage ? (
              <button
                disabled={pendingId === inv.id}
                onClick={async () => {
                  setPendingId(inv.id);
                  await revokeInvite(inv.id);
                  setPendingId(null);
                }}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Revoke invite"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
