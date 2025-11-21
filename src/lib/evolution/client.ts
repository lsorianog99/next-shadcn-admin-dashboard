import { EvolutionInstance, EvolutionQRCode, SendMessageResponse } from "./types";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

if (!EVOLUTION_API_URL) {
  console.warn("EVOLUTION_API_URL is not set in environment variables");
}

if (!EVOLUTION_API_KEY) {
  console.warn("EVOLUTION_API_KEY is not set in environment variables");
}

const headers = {
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY ?? "",
};

/**
 * Evolution API Client Wrapper
 */
export const evolutionClient = {
  /**
   * Create a new WhatsApp instance
   */
  createInstance: async (instanceName: string): Promise<EvolutionInstance> => {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName,
        token: "", // Optional: specific token for this instance
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Failed to create instance");
    }

    return response.json();
  },

  /**
   * Connect an instance (Get QR Code)
   */
  connectInstance: async (instanceName: string): Promise<EvolutionQRCode> => {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Failed to connect instance");
    }

    return response.json();
  },

  /**
   * Logout/Delete an instance
   */
  deleteInstance: async (instanceName: string): Promise<void> => {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Failed to delete instance");
    }
  },

  /**
   * Fetch instance status
   */
  fetchInstanceStatus: async (instanceName: string) => {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      // If 404, instance might not exist
      if (response.status === 404) return null;
      throw new Error("Failed to fetch instance status");
    }

    return response.json();
  },

  /**
   * Set webhook for an instance
   */
  setWebhook: async (
    instanceName: string,
    webhookUrl: string,
    webhookByEvents: boolean = false,
    events: string[] = ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"],
  ): Promise<void> => {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: webhookByEvents,
        webhook_base64: false,
        events,
        enabled: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Evolution API webhook error response:", error);
      throw new Error(error.message ?? `Failed to set webhook: ${JSON.stringify(error)}`);
    }
  },

  /**
   * Send a text message
   */
  sendTextMessage: async (instanceName: string, number: string, text: string): Promise<SendMessageResponse> => {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        number,
        options: {
          delay: 1200,
          presence: "composing",
        },
        textMessage: {
          text,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Failed to send message");
    }

    return response.json();
  },

  /**
   * Send a media message (image, audio, document)
   */
  sendMediaMessage: async (
    instanceName: string,
    number: string,
    mediaType: "image" | "video" | "audio" | "document",
    mediaUrl: string,
    caption?: string,
    fileName?: string,
  ): Promise<SendMessageResponse> => {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        number,
        options: {
          delay: 1200,
          presence: "composing",
        },
        mediaMessage: {
          mediatype: mediaType,
          caption,
          media: mediaUrl,
          fileName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Failed to send media message");
    }

    return response.json();
  },
};
