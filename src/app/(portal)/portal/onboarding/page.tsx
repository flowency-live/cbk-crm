import { redirect } from "next/navigation";
import { getOnboardingContext } from "@/lib/portal/data";
import { OnboardingQuestionnaire } from "@/components/portal/onboarding-questionnaire";
import { OnboardingIdUpload } from "@/components/portal/onboarding-id-upload";
import { OnboardingStatus } from "@/components/portal/onboarding-status";
import { ONBOARDING_STATUS_META } from "@/lib/types";

export default async function OnboardingPage() {
  const ctx = await getOnboardingContext();
  if (!ctx) redirect("/portal/login");

  const { onboarding } = ctx;

  // No onboarding record means they're fully onboarded or not yet set up
  if (!onboarding) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Setup</h1>
          <p className="mt-1 text-sm text-muted">
            Get started with your bookkeeping.
          </p>
        </div>
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">
            No onboarding required — you&apos;re all set up.
          </p>
        </section>
      </div>
    );
  }

  const currentStep = ONBOARDING_STATUS_META[onboarding.status].step;
  const isComplete = onboarding.status === "complete";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Setup</h1>
        <p className="mt-1 text-sm text-muted">
          Complete your setup to get started.
        </p>
      </div>

      {/* Progress Indicator */}
      <OnboardingStatus status={onboarding.status} />

      {/* Questionnaire Step */}
      {!isComplete && currentStep <= 2 && (
        <OnboardingQuestionnaire
          questionnaire={onboarding.questionnaire}
          disabled={currentStep > 1}
        />
      )}

      {/* ID Upload Step */}
      {!isComplete && currentStep >= 2 && currentStep < 4 && (
        <OnboardingIdUpload disabled={currentStep !== 2} />
      )}

      {/* Review / Complete States */}
      {onboarding.status === "review" && (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-semibold">Under Review</p>
              <p className="text-sm text-muted">
                We&apos;re reviewing your information. We&apos;ll be in touch shortly.
              </p>
            </div>
          </div>
        </section>
      )}

      {isComplete && (
        <section className="rounded-xl border border-accent bg-accent-soft p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-accent">Setup Complete</p>
              <p className="text-sm text-muted">
                You&apos;re all set. Your bookkeeper will be in touch.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
