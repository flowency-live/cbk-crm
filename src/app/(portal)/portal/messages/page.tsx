import { redirect } from "next/navigation";
import { getMessagesContext } from "@/lib/portal/data";
import { MessageThread } from "@/components/portal/message-thread";
import { MessageComposer } from "@/components/portal/message-composer";

export default async function MessagesPage() {
  const ctx = await getMessagesContext();
  if (!ctx) redirect("/portal/login");

  const { messages } = ctx;

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Chat with your bookkeeper.
        </p>
      </div>

      <div className="flex flex-1 flex-col rounded-xl border border-border bg-elevated">
        <MessageThread messages={messages} />
        <MessageComposer />
      </div>
    </div>
  );
}
