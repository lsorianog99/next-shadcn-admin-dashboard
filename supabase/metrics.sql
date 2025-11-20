-- Vista 1: Conversión de Ventas
CREATE VIEW kpi_conversion AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'accepted') as won,
  COUNT(*) FILTER (WHERE status = 'rejected') as lost,
  COUNT(*) as total_quotes,
  (COUNT(*) FILTER (WHERE status = 'accepted')::float / NULLIF(COUNT(*),0)::float) * 100 as rate
FROM quotes;

-- Vista 2: Top Productos Cotizados (Usando quote_items)
CREATE VIEW kpi_top_products AS
SELECT 
  product_name, 
  COUNT(*) as times_quoted,
  SUM(subtotal) as potential_revenue
FROM quote_items
GROUP BY product_name
ORDER BY times_quoted DESC
LIMIT 5;

-- Vista 3: Rendimiento de Agentes
CREATE VIEW kpi_agent_performance AS
SELECT 
  a.name as agent_name,
  COUNT(c.id) as total_chats,
  MAX(c.last_message_at) as last_activity
FROM agents a
LEFT JOIN chats c ON a.id = c.agent_id
GROUP BY a.name;