import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const tables = [
      "whatsapp_instances",
      "whatsapp_webhooks",
      "chats",
      "messages",
      "quotes",
      "quote_items",
      "products",
      "agents",
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const table of tables) {
      const { error, count } = await supabase.from(table).select("*", { count: "exact", head: true });

      if (error) {
        // eslint-disable-next-line security/detect-object-injection
        results[table] = {
          exists: false,
          error: error.message,
        };
      } else {
        // eslint-disable-next-line security/detect-object-injection
        results[table] = {
          exists: true,
          count: count ?? 0,
        };
      }
    }

    const allExist = Object.values(results).every((r) => r.exists);

    return NextResponse.json({
      status: allExist ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      tables: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
