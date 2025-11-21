import { NextRequest, NextResponse } from "next/server";

import { evolutionClient } from "@/lib/evolution/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { instanceName } = await request.json();

    if (!instanceName) {
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 });
    }

    // 1. Create instance in Evolution API
    const result = await evolutionClient.createInstance(instanceName);

    // 1.5 Configure Webhook (if APP_URL is set)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.includes("localhost")) {
      try {
        await evolutionClient.setWebhook(instanceName, `${appUrl}/api/webhooks/evolution`, true, [
          "MESSAGES_UPSERT",
          "CONNECTION_UPDATE",
        ]);
        console.log(`Webhook configured for ${instanceName}`);
      } catch (webhookError) {
        console.error("Failed to configure webhook:", webhookError);
        // Don't fail the whole request, just log it
      }
    } else {
      console.warn("Skipping webhook setup: NEXT_PUBLIC_APP_URL is localhost or missing");
    }

    // 2. Save to DB
    const supabase = await createClient();
    const { error } = await supabase.from("whatsapp_instances").insert({
      instance_name: instanceName,
      instance_id: result.instance.instanceId,
      status: "created",
      api_key: result.hash.apikey,
    });

    if (error) throw error;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating instance:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instanceName = searchParams.get("instanceName");
    const action = searchParams.get("action"); // 'status' or 'qr'

    if (!instanceName) {
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 });
    }

    if (action === "qr") {
      const qrData = await evolutionClient.connectInstance(instanceName);
      return NextResponse.json(qrData);
    }

    if (action === "status") {
      const statusData = await evolutionClient.fetchInstanceStatus(instanceName);
      return NextResponse.json(statusData);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching instance data:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
