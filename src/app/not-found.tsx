import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="font-brand text-3xl font-bold">404</div>
      <p className="text-muted">We couldn&apos;t find that page.</p>
      <Link
        href="/companies"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Back to Companies
      </Link>
    </div>
  );
}
