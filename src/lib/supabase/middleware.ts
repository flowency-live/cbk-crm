import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase session cookie and gates protected routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isCrmLogin = path.startsWith("/login");
  const isPortal = path === "/portal" || path.startsWith("/portal/");
  const isPortalLogin = path === "/portal/login";
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/health") ||
    path.startsWith("/brand") ||
    path === "/favicon.ico";

  const authConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!authConfigured) return response;

  // Not signed in: route to the right login (portal vs CRM staff).
  if (!user) {
    if (isPortal && !isPortalLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (!isPortal && !isCrmLogin && !isPublicAsset) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Signed in: keep users off the login screens.
  if (isCrmLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  if (isPortalLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return response;
}
