// Adapter over the canonical status metadata in @/lib/types.
// Kept so existing imports of "@/lib/portal/status" keep working; no duplicated data.
import { JOB_STATUS_META, type JobStatus } from "@/lib/types";

export type { JobStatus };

const ACTION_NEEDED = new Set<JobStatus>(["info_required", "ready_for_approval"]);
const RAG_MAP: Record<JobStatus, "green" | "amber" | "red"> = {
  submitted: "green",
  under_review: "amber",
  in_progress: "amber",
  info_required: "red",
  ready_for_review: "green",
  ready_for_approval: "amber",
  completed: "green",
};

export interface StatusMeta {
  emoji: string;
  client: string;
  clientSub: string;
  internal: string;
  rag: "green" | "amber" | "red";
  clientActionNeeded: boolean;
}

export const JOB_STATUS = Object.fromEntries(
  (Object.keys(JOB_STATUS_META) as JobStatus[]).map((k) => {
    const m = JOB_STATUS_META[k];
    return [
      k,
      {
        emoji: m.dot,
        client: m.client,
        clientSub: m.clientSub,
        internal: m.internal,
        rag: RAG_MAP[k],
        clientActionNeeded: ACTION_NEEDED.has(k),
      },
    ];
  })
) as Record<JobStatus, StatusMeta>;

/** Pipeline order for pickers / progress UI. */
export const JOB_STATUS_ORDER: JobStatus[] = [
  "submitted",
  "under_review",
  "in_progress",
  "info_required",
  "ready_for_review",
  "ready_for_approval",
  "completed",
];
