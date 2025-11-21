-- Migration: Native WhatsApp Integration (Evolution API)
-- Date: 2025-11-21

-- ============================================
-- TABLA: whatsapp_instances
-- Gestiona las instancias de conexión con Evolution API
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name VARCHAR(255) NOT NULL,
  instance_id VARCHAR(255) NOT NULL UNIQUE, -- ID en Evolution API
  api_key VARCHAR(255), -- API Key específica de la instancia si aplica
  status VARCHAR(50) DEFAULT 'disconnected', -- connecting, connected, disconnected, qr_ready
  qrcode TEXT, -- Base64 del QR actual
  settings JSONB DEFAULT '{}', -- Configuración específica
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON whatsapp_instances
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: whatsapp_webhooks
-- Log detallado de webhooks recibidos de Evolution API
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id VARCHAR(255) REFERENCES whatsapp_instances(instance_id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- messages.upsert, connection.update, etc.
  payload JSONB NOT NULL,
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed
  error_log TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para webhooks
CREATE INDEX idx_whatsapp_webhooks_status ON whatsapp_webhooks(processing_status);
CREATE INDEX idx_whatsapp_webhooks_created ON whatsapp_webhooks(created_at DESC);

-- RLS
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON whatsapp_webhooks
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- MODIFICACIÓN: chats
-- Vincular chats a una instancia específica
-- ============================================
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS instance_id VARCHAR(255) REFERENCES whatsapp_instances(instance_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chats_instance ON chats(instance_id);

-- ============================================
-- MODIFICACIÓN: messages
-- Añadir ID de mensaje de WhatsApp para evitar duplicados
-- ============================================
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS whatsapp_message_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);
