import { SupabaseClient } from "@supabase/supabase-js";

import { aiService } from "@/lib/ai/service";
import { WebhookPayload } from "@/lib/evolution/types";
import { createClient } from "@/lib/supabase/server";

interface MessageData {
  message: any;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
}

interface ExtractedContent {
  content: string;
  messageType: string;
}

export const webhookHandler = {
  /**
   * Handle incoming webhook from Evolution API
   */
  handleWebhook: async (payload: WebhookPayload) => {
    const supabase = await createClient();
    const { type, data, instanceId } = payload;

    // 1. Log webhook
    const { data: logData, error: logError } = await supabase
      .from("whatsapp_webhooks")
      .insert({
        instance_id: instanceId,
        event_type: type,
        payload: payload as never,
        processing_status: "processing",
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
      return;
    }

    const webhookId = logData.id;

    try {
      // 2. Process based on event type
      if (type === "messages.upsert") {
        await handleMessageUpsert(data, instanceId);
      }

      // 3. Update log status
      await supabase
        .from("whatsapp_webhooks")
        .update({ processing_status: "processed", processed_at: new Date().toISOString() })
        .eq("id", webhookId);
    } catch (error) {
      console.error("Error processing webhook:", error);

      await supabase
        .from("whatsapp_webhooks")
        .update({
          processing_status: "failed",
          error_log: error instanceof Error ? error.message : "Unknown error",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookId);
    }
  },
};

function extractMessageContent(message: any): ExtractedContent | null {
  if (message.conversation) {
    return { content: message.conversation, messageType: "text" };
  }
  if (message.extendedTextMessage?.text) {
    return { content: message.extendedTextMessage.text, messageType: "text" };
  }
  if (message.imageMessage) {
    return {
      content: message.imageMessage.caption ?? "[Image]",
      messageType: "image",
    };
  }
  if (message.audioMessage) {
    return { content: "[Audio]", messageType: "audio" };
  }
  return null;
}

async function upsertChat(
  supabase: SupabaseClient,
  phone: string,
  pushName: string,
  instanceId: string,
): Promise<string> {
  const { data: existingChat } = await supabase.from("chats").select("id").eq("whatsapp_phone", phone).single();

  if (existingChat) {
    await supabase
      .from("chats")
      .update({
        last_message_at: new Date().toISOString(),
        contact_name: pushName,
      })
      .eq("id", existingChat.id);
    return existingChat.id;
  }

  const { data: newChat, error: createError } = await supabase
    .from("chats")
    .insert({
      whatsapp_phone: phone,
      contact_name: pushName,
      status: "active",
      instance_id: instanceId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return newChat.id;
}

async function handleMessageUpsert(data: any, instanceId: string) {
  const supabase = await createClient();

  const messageData = data as MessageData;
  const { message, key, pushName = "Unknown" } = messageData;

  if (!message || !key) return;
  if (key.fromMe) return;

  const remoteJid = key.remoteJid;
  const phone = remoteJid.split("@")[0];

  const extracted = extractMessageContent(message);
  if (!extracted) return;

  const { content, messageType } = extracted;

  // 1. Upsert Chat/Contact
  const chatId = await upsertChat(supabase, phone, pushName, instanceId);

  // 2. Insert Message
  const { error: msgError } = await supabase.from("messages").insert({
    chat_id: chatId,
    content,
    role: "user",
    message_type: messageType,
    whatsapp_message_id: key.id,
    metadata: {
      pushName,
      remoteJid,
      instanceId,
    },
  });

  if (msgError) {
    if (msgError.code === "23505") return; // Ignore duplicate
    throw msgError;
  }

  // 3. Trigger AI
  await aiService.processMessage(chatId, content, instanceId, remoteJid);
}
