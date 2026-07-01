"use client";

import { useState, useTransition } from "react";
import { updateJobTaskStatus } from "@/lib/actions/workflow";
import type { JobTask, JobTaskStatus } from "@/lib/types";

const STATUS_STYLES: Record<JobTaskStatus, string> = {
  pending: "border-border bg-surface",
  in_progress: "border-primary bg-primary-soft",
  blocked: "border-danger bg-[#C8553D26]",
  done: "border-accent bg-accent-soft",
};

interface PortalTaskListProps {
  tasks: JobTask[];
}

export function PortalTaskList({ tasks }: PortalTaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskItem({ task }: { task: JobTask }) {
  const [status, setStatus] = useState<JobTaskStatus>(task.status);
  const [pending, startTransition] = useTransition();

  function toggleDone() {
    const next: JobTaskStatus = status === "done" ? "pending" : "done";
    setStatus(next);
    startTransition(async () => {
      const res = await updateJobTaskStatus(task.id, next);
      if (!res.ok) {
        setStatus(task.status);
      }
    });
  }

  const isDone = status === "done";

  return (
    <button
      onClick={toggleDone}
      disabled={pending}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${STATUS_STYLES[status]} ${pending ? "opacity-60" : "hover:brightness-95"}`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isDone
            ? "border-accent bg-accent text-white"
            : "border-border bg-surface"
        }`}
      >
        {isDone && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${isDone ? "text-muted line-through" : ""}`}>
        {task.title}
      </span>
    </button>
  );
}
