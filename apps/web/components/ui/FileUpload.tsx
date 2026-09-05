"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  uploading?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
};

export function FileUpload({ accept = "image/*", multiple = false, uploading = false, onFiles, label = "Drop an image here", hint = "or click to browse · up to 10MB" }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`file-upload${dragging ? " is-dragging" : ""}${uploading ? " is-uploading" : ""}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click(); }}
    >
      {uploading ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
      <span className="file-upload__label">{uploading ? "Uploading…" : label}</span>
      <span className="file-upload__hint">{hint}</span>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) onFiles(files); e.target.value = ""; }} />
    </div>
  );
}