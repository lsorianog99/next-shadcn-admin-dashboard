import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

/**
 * Middleware helper para Supabase
 * Maneja el refresh de sesiones de autenticación en el edge runtime
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANTE: Evita escribir lógica entre createServerClient y
  // supabase.auth.getUser(). Un simple error podría hacer que tu
  // usuario no esté autenticado de forma inadvertida.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rutas del dashboard que requieren autenticación
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api/webhooks") &&
    request.nextUrl.pathname !== "/"
  ) {
    // Redirigir a login si no está autenticado
    const url = request.nextUrl.clone();
    url.pathname = "/auth/v2/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: DEBES retornar la variable supabaseResponse que devuelve
  // NextResponse.next(), como se muestra arriba, para asegurar que Set-Cookie
  // headers se envíen correctamente.

  return supabaseResponse;
}
