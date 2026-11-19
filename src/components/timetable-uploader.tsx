"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Upload } from "lucide-react";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

const TYPES = ["application/pdf", "image/jpeg", "image/png"];
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/** Shrink a large photo so it fits under the upload limit (phone photos are often 5-10 MB). */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

function Status({ preparing, label }: { preparing: boolean; label: string }) {
  const { pending } = useFormStatus();
  if (!pending && !preparing) return null;
  return (
    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-700">
      <Loader2 className="size-4 animate-spin" /> {preparing ? "Preparing your photo…" : `Uploading ${label}…`}
    </p>
  );
}

/**
 * Picking a file uploads it straight away, so students can't miss a separate "Upload" tap.
 * Files are checked here first so an oversized file gets a clear message, not a server error.
 */
export function TimetableUploader({ action, hasUpload }: { action: (fd: FormData) => void; hasUpload: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [label, setLabel] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    let file = e.target.files?.[0];
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setError("Please choose a PDF, or a JPG/PNG photo or screenshot.");
      e.target.value = "";
      return;
    }
    if (file.type.startsWith("image/") && file.size > 1.5 * 1024 * 1024) {
      setPreparing(true);
      try {
        file = await shrinkImage(file);
        const dt = new DataTransfer();
        dt.items.add(file);
        input.current!.files = dt.files;
      } catch {
        /* keep the original; the size check below still applies */
      }
      setPreparing(false);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `This file is ${mb(file.size)} MB; the limit is ${mb(MAX_UPLOAD_BYTES)} MB. Take a screenshot or photo of your timetable and upload that instead.`,
      );
      e.target.value = "";
      return;
    }
    setLabel(file.name);
    form.current!.requestSubmit();
  }

  return (
    <form ref={form} action={action} className="mt-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 px-4 py-6 text-center transition hover:border-brand-500 hover:bg-brand-50">
        <Upload className="size-7 text-brand-600" />
        <span className="font-semibold text-brand-800">{hasUpload ? "Upload a new version" : "Tap to choose your timetable"}</span>
        <span className="text-xs text-slate-500">PDF, photo or screenshot · uploads straight away</span>
        <input ref={input} type="file" name="file" accept="application/pdf,image/png,image/jpeg" onChange={onPick} className="sr-only" />
      </label>
      <Status preparing={preparing} label={label} />
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
