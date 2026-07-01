"use client";

import { useState, useTransition } from "react";
import { updateOnboardingQuestionnaire } from "@/lib/actions/onboarding";
import type { OnboardingQuestionnaire as QuestionnaireData } from "@/lib/types";

interface OnboardingQuestionnaireProps {
  questionnaire: QuestionnaireData;
  disabled?: boolean;
}

export function OnboardingQuestionnaire({
  questionnaire,
  disabled = false,
}: OnboardingQuestionnaireProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [utr, setUtr] = useState(questionnaire.utr ?? "");
  const [vatNo, setVatNo] = useState(questionnaire.vat_no ?? "");
  const [companyNo, setCompanyNo] = useState(questionnaire.company_no ?? "");
  const [businessDetails, setBusinessDetails] = useState(
    questionnaire.business_details ?? ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updateOnboardingQuestionnaire({
        utr: utr.trim() || undefined,
        vat_no: vatNo.trim() || undefined,
        company_no: companyNo.trim() || undefined,
        business_details: businessDetails.trim() || undefined,
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.error ?? "Failed to save.");
      }
    });
  }

  const isDisabled = disabled || pending;

  return (
    <section className="rounded-xl border border-border bg-elevated p-5">
      <div className="mb-4">
        <p className="font-semibold">Business Details</p>
        <p className="text-sm text-muted">
          Help us get to know your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              UTR (Unique Taxpayer Reference)
            </label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              disabled={isDisabled}
              placeholder="10 digits"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              VAT Number (if registered)
            </label>
            <input
              type="text"
              value={vatNo}
              onChange={(e) => setVatNo(e.target.value)}
              disabled={isDisabled}
              placeholder="GB 123 4567 89"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Company Number (if limited)
            </label>
            <input
              type="text"
              value={companyNo}
              onChange={(e) => setCompanyNo(e.target.value)}
              disabled={isDisabled}
              placeholder="8 digits"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Tell us about your business
          </label>
          <textarea
            value={businessDetails}
            onChange={(e) => setBusinessDetails(e.target.value)}
            disabled={isDisabled}
            rows={3}
            placeholder="What do you do? How many employees? Any specific bookkeeping needs?"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && (
          <p className="text-sm text-accent">
            Saved. Continue to the next step.
          </p>
        )}

        {!disabled && (
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-ink)",
            }}
          >
            {pending ? "Saving..." : "Save & Continue"}
          </button>
        )}
      </form>
    </section>
  );
}
