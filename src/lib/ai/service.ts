import { evolutionClient } from "@/lib/evolution/client";
import { createClient } from "@/lib/supabase/server";

export const aiService = {
  /**
   * Process an incoming message and generate a response
   */
  processMessage: async (chatId: string, messageContent: string, instanceId: string, senderNumber: string) => {
    try {
      console.log(`[AI Service] Processing message for chat ${chatId}: ${messageContent}`);

      // TODO: Implement Gemini Pro integration here
      // 1. Fetch chat history
      // 2. Construct prompt with system instructions
      // 3. Call Gemini API
      // 4. Handle tool calls (product search, quoting)

      // For now, just echo a simple response to prove connectivity
      const response = `[Auto-Reply] Recibí tu mensaje: "${messageContent}". Pronto estaré 100% operativo con IA.`;

      // Send response via Evolution API
      await evolutionClient.sendTextMessage(instanceId, senderNumber, response);

      // Log assistant message to DB
      const supabase = await createClient();
      await supabase.from("messages").insert({
        chat_id: chatId,
        content: response,
        role: "assistant",
        message_type: "text",
        metadata: { generated_by: "system_auto_reply" },
      });

      return { success: true, response };
    } catch (error) {
      console.error("[AI Service] Error processing message:", error);
      return { success: false, error };
    }
  },
};
