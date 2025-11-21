import { NextRequest, NextResponse } from "next/server";

import { evolutionClient } from "@/lib/evolution/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/whatsapp/webhook-config
 * Manually configure webhook for a connected instance
 */
export async function POST(request: NextRequest) {
  try {
    const { instanceName } = await request.json();

    if (!instanceName) {
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 });
    }

    // Get the app URL for webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL not configured" }, { status: 500 });
    }

    // Don't configure webhook for localhost
    if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
      return NextResponse.json({
        success: false,
        error: "Localhost webhook URLs are not supported. Use ngrok or deploy to Vercel.",
        webhookUrl: `${appUrl}/api/webhooks/evolution`,
      });
    }

    // Configure the webhook
    const webhookUrl = `${appUrl}/api/webhooks/evolution`;

    console.log(`🔧 Configuring webhook for instance: ${instanceName}`);
    console.log(`   Webhook URL: ${webhookUrl}`);

    try {
      await evolutionClient.setWebhook(instanceName, webhookUrl, false, ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]);

      console.log(`✅ Webhook configured successfully for ${instanceName}`);

      return NextResponse.json({
        success: true,
        message: "Webhook configured successfully",
        webhookUrl,
        instanceName,
      });
    } catch (evolutionError) {
      const errorMessage = evolutionError instanceof Error ? evolutionError.message : "Unknown Evolution API error";
      console.error(`❌ Evolution API webhook error for ${instanceName}:`, errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: `Evolution API error: ${errorMessage}`,
          webhookUrl,
          instanceName,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in webhook-config endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/whatsapp/webhook-config
 * List all instances from database
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ instances: data });
  } catch (error) {
    console.error("Error fetching instances:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
