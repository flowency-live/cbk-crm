"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export function ToolbarSearch({
  basePath,
  placeholder,
}: {
  basePath: string;
  placeholder: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (text) next.set("q", text);
      else next.delete("q");
      router.replace(`${basePath}?${next.toString()}`, { scroll: false });
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="flex min-w-[240px] max-w-[380px] flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2">
      <Search size={16} className="shrink-0 text-muted" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        aria-label={placeholder}
      />
    </div>
  );
}
