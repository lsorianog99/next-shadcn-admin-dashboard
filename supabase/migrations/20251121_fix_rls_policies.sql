-- Fix RLS policies for whatsapp_instances to allow INSERT
-- Date: 2025-11-21

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON whatsapp_instances;

-- Create comprehensive RLS policies
CREATE POLICY "Allow authenticated users to insert instances"
  ON whatsapp_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select instances"
  ON whatsapp_instances
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update instances"
  ON whatsapp_instances
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete instances"
  ON whatsapp_instances
  FOR DELETE
  TO authenticated
  USING (true);
