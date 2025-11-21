import { NextRequest, NextResponse } from "next/server";

import { webhookHandler } from "@/lib/whatsapp/webhook-handler";

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify secret if Evolution API supports/sends it
    // const secret = request.headers.get('x-webhook-secret');

    const payload = await request.json();

    // Async processing to not block the webhook response
    // In Vercel/Serverless, we might need `waitUntil` or similar if execution takes long
    // For now, we await it to ensure it runs, but ideally we'd offload to a queue
    await webhookHandler.handleWebhook(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in webhook route:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", service: "Evolution API Webhook Receiver" });
}
