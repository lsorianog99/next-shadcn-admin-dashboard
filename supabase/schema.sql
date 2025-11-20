-- WhatsApp CRM & Dashboard Schema
-- Optimizado para cotizaciones automáticas con IA y métricas en tiempo real

-- ============================================
-- TABLA: agents
-- Configuración de agentes IA (Gemini Pro, GPT-4, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'gemini-pro', -- gemini-pro, gpt-4, etc.
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda de agentes activos
CREATE INDEX idx_agents_active ON agents(is_active) WHERE is_active = true;

-- ============================================
-- TABLA: chats
-- Conversaciones de WhatsApp
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_phone VARCHAR(20) NOT NULL UNIQUE,
  contact_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, archived, closed
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar queries del dashboard
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_chats_agent ON chats(agent_id);

-- ============================================
-- TABLA: messages
-- Mensajes de cada conversación
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, quote, product
  metadata JSONB DEFAULT '{}', -- Para almacenar datos extra como URLs de media, IDs de cotizaciones, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries de mensajes
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TABLA: products
-- Catálogo de productos (importado desde Excel)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  sku VARCHAR(100) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  cost DECIMAL(12, 2) NOT NULL,
  category VARCHAR(255),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- Para datos adicionales como imágenes, especificaciones, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda y filtrado
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('spanish', name));

-- ============================================
-- TABLA: quotes
-- Cotizaciones generadas automáticamente
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL, -- AUTO-YYYYMMDD-XXX
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para métricas del dashboard
CREATE INDEX idx_quotes_chat ON quotes(chat_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_accepted_at ON quotes(accepted_at DESC) WHERE accepted_at IS NOT NULL;

-- ============================================
-- TABLA: quote_items
-- Items individuales de cada cotización
-- ============================================
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
  product_name VARCHAR(500) NOT NULL, -- Snapshot del nombre al momento de cotizar
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL, -- quantity * unit_price
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries de items
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_sku);

-- ============================================
-- TABLA: webhooks_log
-- Log de eventos de n8n para debugging
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- message_received, quote_sent, etc.
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success', -- success, error
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda de logs
CREATE INDEX idx_webhooks_log_event ON webhooks_log(event_type);
CREATE INDEX idx_webhooks_log_created_at ON webhooks_log(created_at DESC);
CREATE INDEX idx_webhooks_log_status ON webhooks_log(status);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar last_message_at en chats cuando se inserta un mensaje
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_last_message_trigger AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Función para generar número de cotización automático
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part VARCHAR(8);
  seq_num INTEGER;
  new_quote_number VARCHAR(50);
BEGIN
  -- Formato: AUTO-YYYYMMDD-XXX
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Obtener el siguiente número secuencial del día
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 15) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM quotes
  WHERE quote_number LIKE 'AUTO-' || date_part || '-%';
  
  new_quote_number := 'AUTO-' || date_part || '-' || LPAD(seq_num::TEXT, 3, '0');
  NEW.quote_number := new_quote_number;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_quote_number_trigger BEFORE INSERT ON quotes
  FOR EACH ROW 
  WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
  EXECUTE FUNCTION generate_quote_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: Permitir todo para usuarios autenticados
-- TODO: Personalizar según tus necesidades de seguridad

CREATE POLICY "Allow all for authenticated users" ON agents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON chats
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON quote_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON webhooks_log
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- DATOS INICIALES (SEEDS)
-- ============================================

-- Insertar agente IA por defecto con Gemini Pro
INSERT INTO agents (name, model, system_prompt, is_active) VALUES
(
  'Agente de Ventas - Gemini Pro',
  'gemini-pro',
  'Eres un asistente virtual especializado en ventas para WhatsApp. Tu objetivo es ayudar a los clientes a encontrar los productos que necesitan y generar cotizaciones precisas. 

INSTRUCCIONES:
1. Saluda amablemente y pregunta cómo puedes ayudar
2. Cuando el cliente pregunte por productos, consulta el catálogo disponible
3. Proporciona información detallada de los productos (nombre, descripción, precio)
4. Si el cliente está interesado, pregunta la cantidad deseada
5. Genera una cotización con los productos seleccionados
6. Mantén un tono profesional pero cercano
7. Si no entiendes la solicitud, pide clarificación

IMPORTANTE: Siempre verifica que los productos existan en el catálogo antes de cotizar.',
  true
)
ON CONFLICT DO NOTHING;

-- Insertar algunos productos de ejemplo
INSERT INTO products (sku, name, description, price, cost, category, stock, is_active) VALUES
('PROD-001', 'Laptop HP 15-dy2795wm', 'Laptop HP con procesador Intel Core i5, 8GB RAM, 256GB SSD, pantalla 15.6"', 12999.00, 9500.00, 'Electrónica', 10, true),
('PROD-002', 'Mouse Logitech MX Master 3', 'Mouse inalámbrico ergonómico con sensor de alta precisión', 1899.00, 1200.00, 'Accesorios', 25, true),
('PROD-003', 'Teclado Mecánico Keychron K2', 'Teclado mecánico inalámbrico 75%, switches Gateron Brown', 2499.00, 1800.00, 'Accesorios', 15, true),
('PROD-004', 'Monitor LG 27" 4K UHD', 'Monitor IPS 27 pulgadas, resolución 4K, HDR10', 8999.00, 6500.00, 'Pantallas', 8, true),
('PROD-005', 'Webcam Logitech C920', 'Webcam Full HD 1080p con micrófono integrado', 1299.00, 900.00, 'Accesorios', 20, true)
ON CONFLICT DO NOTHING;

-- Comentario de finalización
COMMENT ON SCHEMA public IS 'WhatsApp CRM Schema - Noviembre 2025 - Optimizado para cotizaciones automáticas con IA';
