"use client";

import { useState, useTransition } from "react";
import { uploadDocuments } from "@/lib/actions/portal";
import { advanceOnboardingToIdUploaded } from "@/lib/actions/onboarding";

interface OnboardingIdUploadProps {
  disabled?: boolean;
}

export function OnboardingIdUpload({ disabled = false }: OnboardingIdUploadProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      // Upload the document first
      const uploadRes = await uploadDocuments(fd);
      if (!uploadRes.ok) {
        setError(uploadRes.error ?? "Upload failed.");
        return;
      }

      // Advance onboarding status
      const advanceRes = await advanceOnboardingToIdUploaded();
      if (!advanceRes.ok) {
        setError(advanceRes.error ?? "Failed to update status.");
        return;
      }

      setSuccess(true);
      form.reset();
    });
  }

  const isDisabled = disabled || pending;

  return (
    <section className="rounded-xl border border-border bg-elevated p-5">
      <div className="mb-4">
        <p className="font-semibold">ID Verification</p>
        <p className="text-sm text-muted">
          Upload a photo of your ID (passport, driving licence, or national ID).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
          <input
            name="files"
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            disabled={isDisabled}
            className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--brand-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--brand-ink)] disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-muted">
            Take a photo or select a file. We accept JPG, PNG, or PDF.
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {success && (
          <p className="mt-3 text-sm text-accent">
            ID uploaded. Your application is now under review.
          </p>
        )}

        {!disabled && (
          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-ink)",
            }}
          >
            {pending ? "Uploading..." : "Upload ID"}
          </button>
        )}
      </form>
    </section>
  );
}
