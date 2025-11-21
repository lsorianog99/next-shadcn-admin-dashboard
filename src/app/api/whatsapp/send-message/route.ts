import { NextRequest, NextResponse } from "next/server";

import { SupabaseClient } from "@supabase/supabase-js";

import { evolutionClient } from "@/lib/evolution/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { chatId, content, messageType = "text", mediaUrl } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get Chat Details (Phone & Instance)
    const chat = await getChatDetails(supabase, chatId);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (!chat.instance_id) {
      return NextResponse.json({ error: "No WhatsApp instance linked to this chat" }, { status: 400 });
    }

    // 2. Send via Evolution API
    const result = await sendMessageViaEvolution(chat.instance_id, chat.whatsapp_phone, content, messageType, mediaUrl);

    // 3. Insert into DB
    const message = await saveMessageToDb(supabase, chatId, content, messageType, result);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

async function getChatDetails(supabase: SupabaseClient, chatId: string) {
  const { data: chat, error } = await supabase
    .from("chats")
    .select("whatsapp_phone, instance_id")
    .eq("id", chatId)
    .single();

  if (error) return null;
  return chat;
}

async function sendMessageViaEvolution(
  instanceId: string,
  phone: string,
  content: string,
  messageType: string,
  mediaUrl?: string,
) {
  if (messageType === "text") {
    return await evolutionClient.sendTextMessage(instanceId, phone, content);
  } else if (["image", "video", "audio", "document"].includes(messageType)) {
    if (!mediaUrl) {
      throw new Error("Media URL required for media messages");
    }
    return await evolutionClient.sendMediaMessage(
      instanceId,
      phone,
      messageType as "image" | "video" | "audio" | "document",
      mediaUrl,
      content, // caption
    );
  }
  throw new Error("Invalid message type");
}

async function saveMessageToDb(
  supabase: SupabaseClient,
  chatId: string,
  content: string,
  messageType: string,
  result: any,
) {
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      content,
      role: "assistant", // Sent by us
      message_type: messageType,
      whatsapp_message_id: result?.key?.id,
      metadata: {
        evolution_id: result?.key?.id,
        status: "sent",
      },
    })
    .select()
    .single();

  if (msgError) throw msgError;
  return message;
}
