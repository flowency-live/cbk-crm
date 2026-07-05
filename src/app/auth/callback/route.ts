import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the magic-link `code` for a server session cookie, then redirects in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth/magic link errors from Supabase
  if (error) {
    const loginPath = next.startsWith("/portal") ? "/portal/login" : "/login";
    const errorMsg = encodeURIComponent(errorDescription ?? error);
    return NextResponse.redirect(`${origin}${loginPath}?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginPath = next.startsWith("/portal") ? "/portal/login" : "/login";
      const errorMsg = encodeURIComponent(exchangeError.message);
      return NextResponse.redirect(`${origin}${loginPath}?error=${errorMsg}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
