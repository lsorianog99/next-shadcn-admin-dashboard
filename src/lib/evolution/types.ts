export interface EvolutionInstance {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
}

export interface EvolutionInstanceStatus {
  instance: {
    instanceName: string;
    instanceId: string;
    status: "close" | "open" | "connecting" | "qr";
  };
}

export interface EvolutionQRCode {
  pairingCode: string;
  code: string; // Base64
  count: number;
}

export interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: unknown;
  messageTimestamp: number;
  status: string;
}

export interface WebhookMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption: string;
      url: string;
    };
    audioMessage?: {
      url: string;
    };
  };
  messageType: string;
  messageTimestamp: number;
  instanceId: string;
  source: string;
}

export interface WebhookPayload {
  type: string;
  data: WebhookMessage | unknown;
  instanceId: string;
  sender: string; // JID
  apikey: string;
}
