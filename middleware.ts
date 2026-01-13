import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicRoutes = ["/login", "/", "/forgot-password", "/reset-password", "/auth/confirm"]

  // Permitir rutas públicas
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith("/auth/"))

  // Si no hay usuario y trata de acceder al dashboard, redirigir a login
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si hay usuario y está en login o forgot-password, redirigir al dashboard
  if (user && (pathname === "/login" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Check Onboarding (Has Organization?)
  if (user && (pathname.startsWith("/dashboard") || pathname === "/")) {
    // Use Service Role to bypass RLS and ensure we find the membership if it exists
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() { } // usage of service role doesn't need to set cookies for auth
        },
      }
    )

    const { count, error } = await adminSupabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    console.log("Middleware: Check. User:", user.email, user.id, "Count:", count, "KeyPresent:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // If no org membership found (and no error), redirect to onboarding
    if (!error && count === 0) {
      console.log("Middleware: Redirecting to Create Organization")
      return NextResponse.redirect(new URL("/create-organization", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
