"use client";

import { ONBOARDING_STATUS_META, type OnboardingStatus as Status } from "@/lib/types";

const STEPS = [
  { key: "started" as const, label: "Started" },
  { key: "questionnaire_complete" as const, label: "Details" },
  { key: "id_uploaded" as const, label: "ID" },
  { key: "review" as const, label: "Review" },
  { key: "complete" as const, label: "Done" },
];

interface OnboardingStatusProps {
  status: Status;
}

export function OnboardingStatus({ status }: OnboardingStatusProps) {
  const currentStep = ONBOARDING_STATUS_META[status].step;

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                isComplete
                  ? "bg-accent text-white"
                  : isCurrent
                  ? "bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                  : "bg-surface border border-border text-muted"
              }`}
            >
              {isComplete ? "✓" : stepNum}
            </div>
            <span
              className={`ml-2 hidden text-sm sm:inline ${
                isCurrent ? "font-medium" : "text-muted"
              }`}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-4 sm:w-8 ${
                  isComplete ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
