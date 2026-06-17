"use client";

/**
 * Lightweight, dependency-free browser fingerprint.
 * This is NOT meant to be cryptographically strong identity — it's a
 * best-effort device signal to discourage trivial anonymous vote fraud.
 * It combines stable browser/device traits with a persisted random salt
 * stored in localStorage so repeat visits from the same browser collapse
 * to the same hash.
 */

const STORAGE_KEY = "ttm_fp";

function fnv1aHash(str: string): string {
 let h = 0x811c9dc5;
 for (let i = 0; i < str.length; i++) {
  h ^= str.charCodeAt(i);
  h = Math.imul(h, 0x01000193);
 }
 // Convert to unsigned hex
 return (h >>> 0).toString(16).padStart(8, "0");
}

function collectTraits(): string {
 if (typeof window === "undefined") return "ssr";

 const nav = window.navigator;
 const screenInfo =
  typeof screen !== "undefined"
   ? `${screen.width}x${screen.height}x${screen.colorDepth}`
   : "0";

 const traits = [
  nav.userAgent,
  nav.language,
  (nav.languages || []).join(","),
  nav.platform ?? "",
  nav.hardwareConcurrency ?? "",
  // @ts-expect-error deviceMemory is non-standard but widely available
  nav.deviceMemory ?? "",
  screenInfo,
  new Date().getTimezoneOffset(),
  Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
 ];

 return traits.join("|");
}

/**
 * Returns a stable fingerprint hash for the current browser/device.
 * Safe to call on the client only.
 */
export function getFingerprint(): string {
 if (typeof window === "undefined") return "ssr";

 try {
  let salt = window.localStorage.getItem(STORAGE_KEY);
  if (!salt) {
   salt =
    (crypto.randomUUID && crypto.randomUUID()) ||
    Math.random().toString(36).slice(2);
   window.localStorage.setItem(STORAGE_KEY, salt);
  }
  return fnv1aHash(`${collectTraits()}::${salt}`);
 } catch {
  // localStorage blocked (private mode) — fall back to a per-session hash.
  return fnv1aHash(collectTraits());
 }
}
