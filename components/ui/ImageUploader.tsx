"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import { ACCEPTED_IMAGE_TYPES, uploadImage } from "@/features/upload/api";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  /** Current hosted image URL (empty string when none). */
  value: string;
  /** Called with the new hosted URL after a successful upload, or "" on clear. */
  onChange: (url: string) => void;
  /** Optional label shown above the dropzone. */
  label?: string;
  /** Disable interaction (e.g. while a parent form submits). */
  disabled?: boolean;
  className?: string;
};

/**
 * Single image picker that uploads straight to ImgBB via `/api/upload`.
 *
 * There is intentionally no URL text box — the admin drops or selects a
 * file, we upload it, and the resulting hosted URL is pushed up through
 * `onChange`. The preview reflects whatever URL the parent currently
 * holds so it works for both create (empty) and edit (existing) flows.
 */
export default function ImageUploader({
  value,
  onChange,
  label,
  disabled,
  className,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError(null);
      setIsUploading(true);
      try {
        const uploaded = await uploadImage(file);
        onChange(uploaded.url);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Image upload failed.",
        );
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange],
  );

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const clear = () => {
    setError(null);
    onChange("");
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {label}
        </span>
      )}

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-3 text-center transition",
          isDragging && "border-violet-500 bg-violet-100/60",
          (disabled || isUploading) && "cursor-not-allowed opacity-70",
          value && "border-solid",
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="h-36 w-full rounded-lg object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900/0 transition group-hover:bg-gray-900/40">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-violet-700 opacity-0 transition group-hover:opacity-100">
                Click or drop to replace
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </span>
            <span className="text-sm font-semibold text-violet-700">
              {isUploading ? "Uploading..." : "Click to upload"}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <UploadCloud className="h-3 w-3" />
              or drag &amp; drop an image (max 32MB)
            </span>
          </>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={onInputChange}
          disabled={disabled || isUploading}
          className="sr-only"
        />
      </label>

      {value && (
        <button
          type="button"
          onClick={clear}
          disabled={disabled || isUploading}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove image
        </button>
      )}

      {isUploading && (
        <p className="flex items-center gap-1 text-xs text-violet-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading to image host...
        </p>
      )}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
