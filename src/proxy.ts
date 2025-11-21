import { NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy middleware para WhatsApp CRM
 * Maneja la autenticación de Supabase y protección de rutas
 */
export async function proxy(req: NextRequest) {
  // Actualizar sesión de Supabase
  const supabaseResponse = await updateSession(req);

  // El middleware de Supabase ya maneja la redirección a /auth/login
  // si el usuario no está autenticado
  return supabaseResponse;
}

/**
 * Matcher: excluir archivos estáticos, imágenes y API pública
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - api/webhooks (webhooks públicos de n8n)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4)$).*)",
  ],
};
