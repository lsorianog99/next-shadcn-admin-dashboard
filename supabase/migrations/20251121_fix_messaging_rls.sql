-- Fix RLS policies for messaging tables (chats, messages, whatsapp_webhooks)
-- Date: 2025-11-21
-- Context: Webhooks are failing to insert chats/messages due to RLS blocking INSERT

-- ============================================
-- TABLE: chats
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON chats;

-- Create granular RLS policies for chats
CREATE POLICY "Allow authenticated users to insert chats"
  ON chats FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select chats"
  ON chats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update chats"
  ON chats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete chats"
  ON chats FOR DELETE TO authenticated USING (true);

-- ============================================
-- TABLE: messages
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON messages;

-- Create granular RLS policies for messages
CREATE POLICY "Allow authenticated users to insert messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select messages"
  ON messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update messages"
  ON messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete messages"
  ON messages FOR DELETE TO authenticated USING (true);

-- ============================================
-- TABLE: whatsapp_webhooks
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON whatsapp_webhooks;

-- Create granular RLS policies for whatsapp_webhooks
CREATE POLICY "Allow authenticated users to insert webhooks"
  ON whatsapp_webhooks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select webhooks"
  ON whatsapp_webhooks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update webhooks"
  ON whatsapp_webhooks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete webhooks"
  ON whatsapp_webhooks FOR DELETE TO authenticated USING (true);

-- ============================================
-- NOTES
-- ============================================
-- After applying this migration:
-- 1. Webhooks will be able to insert into chats/messages/whatsapp_webhooks
-- 2. Send message endpoint will be able to insert into messages
-- 3. Auto-webhook configuration should work after QR scan
