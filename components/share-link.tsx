"use client";

import * as React from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, QrCode, X } from "@/components/icons";

/**
 * ShareLink — a read-only URL field with copy + QR-code actions.
 *
 * Used everywhere a public surface (board, roadmap, changelog, survey, status,
 * contact) needs to be shared. The QR button opens a dialog rendering a QR for
 * the link, which can be downloaded as a PNG.
 */
export function ShareLink({
 url,
 label,
 className,
}: {
 url: string;
 /** Used in the QR dialog title + the downloaded PNG filename. */
 label?: string;
 className?: string;
}) {
 const [copied, setCopied] = React.useState(false);
 const [qrOpen, setQrOpen] = React.useState(false);

 // Resolve relative paths (e.g. "/public/acme/changelog") to an absolute URL
 // so the copied link + QR code work when scanned from another device.
 const [resolved, setResolved] = React.useState(url);
 React.useEffect(() => {
  if (/^https?:\/\//.test(url)) {
   setResolved(url);
  } else if (typeof window !== "undefined") {
   setResolved(new URL(url, window.location.origin).toString());
  }
 }, [url]);

 async function copy() {
  try {
   await navigator.clipboard.writeText(resolved);

   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  } catch {
   /* clipboard unavailable */
  }
 }

 return (
  <>
   <div className={cn("flex items-center gap-2", className)}>
    <input
     type="text"
     readOnly
     value={resolved}
     onFocus={(e) => e.currentTarget.select()}

     className="h-9 min-w-0 flex-1 rounded-xl  border-2 border-border border-input bg-background px-3 font-mono text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
    />
    <Button
     type="button"
     size="sm"
     variant="outline"
     onClick={copy}
     className="shrink-0"
    >
     {copied ? <Check className="text-emerald-400" /> : <Copy />}
     {copied ? "Copied" : "Copy"}
    </Button>
    <Button
     type="button"
     size="sm"
     variant="outline"
     onClick={() => setQrOpen(true)}
     className="shrink-0"
     title="Show QR code"
     aria-label="Show QR code"
    >
     <QrCode />
    </Button>
   </div>

   {qrOpen ? (
    <QrDialog url={resolved} label={label} onClose={() => setQrOpen(false)} />
   ) : null}

  </>
 );
}

function slugifyForFile(input: string) {
 return (
  input
   .toLowerCase()
   .replace(/https?:\/\//, "")
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/^-+|-+$/g, "")
   .slice(0, 60) || "qr-code"
 );
}

function QrDialog({
 url,
 label,
 onClose,
}: {
 url: string;
 label?: string;
 onClose: () => void;
}) {
 const [dataUrl, setDataUrl] = React.useState<string | null>(null);
 const [error, setError] = React.useState(false);

 React.useEffect(() => {
  let cancelled = false;
  QRCode.toDataURL(url, {
   errorCorrectionLevel: "M",
   margin: 2,
   width: 512,
   color: { dark: "#000000", light: "#ffffff" },
  })
   .then((d) => {
    if (!cancelled) setDataUrl(d);
   })
   .catch(() => {
    if (!cancelled) setError(true);
   });
  return () => {
   cancelled = true;
  };
 }, [url]);

 // Close on Escape.
 React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
 }, [onClose]);

 function download() {
  if (!dataUrl) return;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${slugifyForFile(label || url)}-qr.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
 }

 return (
  <div
   className="fixed h-screen w-screen inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
   role="dialog"
   aria-modal="true"
   onClick={onClose}
  >
   <div
    className="w-full max-w-sm rounded-xl  border-2 border-border bg-card shadow-xl"
    onClick={(e) => e.stopPropagation()}
   >
    <div className="flex items-center justify-between border-b-2 px-4 py-3">
     <span className="truncate text-sm font-medium">
      {label ? `QR code · ${label}` : "QR code"}
     </span>
     <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex size-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
     >
      <X className="size-4" />
     </button>
    </div>

    <div className="flex flex-col items-center gap-4 p-6">
     <div className="flex aspect-square w-full max-w-[256px] items-center justify-center rounded-xl  border-2 border-border bg-white p-4">
      {error ? (
       <span className="text-center text-xs text-destructive">
        Could not generate QR code.
       </span>
      ) : dataUrl ? (
       // eslint-disable-next-line @next/next/no-img-element
       <img src={dataUrl} alt="QR code" className="size-full" />
      ) : (
       <span className="text-xs text-muted-foreground">Generating…</span>
      )}
     </div>

     <p className="w-full break-all text-center font-mono text-xs text-muted-foreground">
      {url}
     </p>

     <Button
      type="button"
      onClick={download}
      disabled={!dataUrl}
      className="w-full"
     >
      <Download />
      Download PNG
     </Button>
    </div>
   </div>
  </div>
 );
}
