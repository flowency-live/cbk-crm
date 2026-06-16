import { Construction } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">{title}</h1>
      <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
        <Construction size={32} className="mb-3 text-muted" />
        <div className="font-brand text-lg">{title} — coming soon</div>
        <p className="mt-1 max-w-sm text-sm text-muted">
          This section is scaffolded and next in the build plan. Companies is fully built out.
        </p>
      </div>
    </div>
  );
}
