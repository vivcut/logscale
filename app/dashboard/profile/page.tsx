import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "../sign-out-button";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.name ?? "";
  const email = profile?.email ?? user.email ?? "";

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your name and profile picture.
        </p>
      </div>

      <SignOutButton />

      <ProfileForm
        initialName={displayName}
        email={email}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
