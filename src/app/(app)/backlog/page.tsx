import { Info } from "lucide-react";
import { getBacklog } from "@/lib/data/backlog";
import { BacklogBoard } from "@/components/backlog/backlog-board";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const items = await getBacklog();

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">Platform Backlog</h1>
      <p className="mb-5 text-[13px] text-muted">
        The Hi-Vis delivery platform &amp; client portal — prioritised, with the AI
        automation level on each item. Move cards between columns as you go.
      </p>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-md border border-accent bg-accent-soft px-3.5 py-2.5 text-[12.5px] font-medium text-accent">
          <Info size={16} />
          No backlog items found — connect Supabase to load the live backlog.
        </div>
      ) : (
        <BacklogBoard items={items} />
      )}
    </div>
  );
}
