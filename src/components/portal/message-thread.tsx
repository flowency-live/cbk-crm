"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageThreadProps {
  messages: Message[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted">
          No messages yet. Send one to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_role === "client" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                msg.sender_role === "client"
                  ? "bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                  : "bg-surface border border-border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              <p
                className={`mt-1 text-xs ${
                  msg.sender_role === "client"
                    ? "text-[var(--brand-ink)] opacity-70"
                    : "text-muted"
                }`}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
