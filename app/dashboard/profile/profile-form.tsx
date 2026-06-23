"use client";

import * as React from "react";
import { ImageIcon, Loader2, Trash2, Upload, Check } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileName,
  uploadAvatar,
  removeAvatar,
} from "./actions";

export function ProfileForm({
  initialName,
  email,
  initialAvatarUrl,
}: {
  initialName: string;
  email: string;
  initialAvatarUrl: string | null;
}) {
  const [name, setName] = React.useState(initialName);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    initialAvatarUrl
  );

  const [savingName, setSavingName] = React.useState(false);
  const [savedName, setSavedName] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const [busyAvatar, setBusyAvatar] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    setSavedName(false);
    const res = await updateProfileName(name);
    if (!res.ok) {
      setNameError(res.error ?? "Could not save.");
    } else {
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2000);
    }
    setSavingName(false);
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAvatar(true);
    setAvatarError(null);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await uploadAvatar(fd);
    if (!res.ok) {
      setAvatarError(res.error ?? "Upload failed.");
    } else if (res.url) {
      setAvatarUrl(res.url);
    }
    setBusyAvatar(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onRemoveAvatar() {
    setBusyAvatar(true);
    setAvatarError(null);
    const res = await removeAvatar();
    if (!res.ok) setAvatarError(res.error ?? "Could not remove.");
    else setAvatarUrl(null);
    setBusyAvatar(false);
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <section className="rounded-md  border border-border  bg-card p-6">
        <h2 className="text-sm font-semibold">Profile picture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown across your dashboard and on team-authored posts.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full  border border-border  bg-secondary text-lg font-bold">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              (name || email).charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPickAvatar}
                className="hidden"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={busyAvatar}
                onClick={() => inputRef.current?.click()}
              >
                {busyAvatar ? (
                  <Loader2 className="animate-spin" />
                ) : avatarUrl ? (
                  <Upload className="size-4" />
                ) : (
                  <ImageIcon className="size-4" />
                )}
                {avatarUrl ? "Replace" : "Upload"}
              </Button>
              {avatarUrl ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyAvatar}
                  onClick={onRemoveAvatar}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              PNG, JPG or WEBP · max 2MB
            </p>
            {avatarError ? (
              <p className="font-mono text-[10px] text-destructive">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Name + email */}
      <section className="rounded-md  border border-border  bg-card p-6">
        <h2 className="text-sm font-semibold">Account details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how your name appears across the app.
        </p>

        <form onSubmit={onSaveName} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="font-mono text-[10px] text-muted-foreground">
              Email is managed through your login and can't be changed here.
            </p>
          </div>

          {nameError ? (
            <p className="font-mono text-[10px] text-destructive">
              {nameError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={savingName}>
              {savingName ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
            {savedName ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-500">
                <Check className="size-3" />
                saved
              </span>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
