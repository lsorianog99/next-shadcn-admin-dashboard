# WhatsApp CRM & Dashboard

Sistema completo de CRM para WhatsApp con cotizaciones automáticas mediante IA (Gemini Pro), integración con n8n, y dashboard de métricas en tiempo real.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 15 (App Router, TurboPack)
- **Lenguaje:** TypeScript (Strict mode)
- **Estilos:** Tailwind CSS v4 + Shadcn UI
- **Backend/BaaS:** Supabase (Auth, Database, Realtime)
- **Iconos:** Lucide React
- **Gestión de Estado:** React Query (TanStack Query) + Context API
- **Integraciones:** n8n para automatización con IA

## 📁 Estructura del Proyecto

```
dashboard/
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Dashboard principal
│   │   │       └── chat/
│   │   │           └── page.tsx      # Interfaz de chat
│   │   └── api/
│   │       └── webhooks/
│   │           └── n8n/
│   │               └── route.ts      # Endpoint para webhooks de n8n
│   ├── features/                      # Arquitectura por features
│   │   ├── chat/                      # Feature de chat
│   │   │   ├── components/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ContactList.tsx
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   └── ChatMessage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-chat.ts
│   │   │   └── types.ts
│   │   └── dashboard/                 # Feature de dashboard
│   │       ├── components/
│   │       │   ├── MetricCard.tsx
│   │       │   ├── ConversationsChart.tsx
│   │       │   ├── QuotesStatusChart.tsx
│   │       │   └── ProductsDistributionChart.tsx
│   │       └── hooks/
│   │           └── use-dashboard-metrics.ts
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              # Cliente Supabase (browser)
│   │       ├── server.ts              # Cliente Supabase (server)
│   │       └── middleware.ts          # Middleware de auth
│   ├── actions/
│   │   └── n8n.ts                     # Server Actions para n8n
│   ├── types/
│   │   └── database.types.ts          # TypeScript types del schema
│   └── middleware.ts                  # Middleware de Next.js
└── supabase/
    └── schema.sql                     # Schema completo de la BD
```

## 🗄️ Base de Datos

El sistema utiliza **7 tablas principales**:

1. **agents** - Configuración de agentes IA (Gemini Pro, GPT-4)
2. **chats** - Conversaciones de WhatsApp
3. **messages** - Mensajes de cada conversación
4. **products** - Catálogo de productos
5. **quotes** - Cotizaciones generadas
6. **quote_items** - Items de cada cotización
7. **webhooks_log** - Log de eventos de n8n

### Aplicar el Schema a Supabase

1. Ve a tu proyecto de Supabase: https://ahxchbpsbrokxgydkdnu.supabase.co

2. Abre el **SQL Editor** desde el panel lateral

3. Copia y pega el contenido de `supabase/schema.sql`

4. Ejecuta el script completo

El schema incluye:
- ✅ Todas las tablas con sus relaciones
- ✅ Índices optimizados para queries
- ✅ Triggers para actualización automática de timestamps
- ✅ Función para generar números de cotización (AUTO-YYYYMMDD-XXX)
- ✅ Row Level Security (RLS) configurado
- ✅ Datos de ejemplo (5 productos y 1 agente IA)

## ⚙️ Configuración

### 1. Variables de Entorno

Las credenciales de Supabase ya están configuradas en `.env`. Solo falta configurar n8n:

```env
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/whatsapp-crm
N8N_WEBHOOK_SECRET=tu-secret-seguro
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en: http://localhost:3000

## 🔌 Integración con n8n

### Actualizar tu Workflow de n8n

Tu workflow actual (`Agente WhatsApp.json`) necesita enviar respuestas al dashboard:

1. **Añadir un nodo HTTP Request** al final del flujo (después de "Enviar Mensaje")

2. **Configurar el nodo:**
   - Method: POST
   - URL: `{TU_DASHBOARD_URL}/api/webhooks/n8n`
   - Headers: `X-Webhook-Secret: {TU_SECRET}`
   - Body (JSON):
   ```json
   {
     "event_type": "message_response",
     "data": {
       "chat_id": "{{ $('Recibir Mensaje').item.json.messages[0].from }}",
       "message": "{{ $('Agente IA').item.json.output }}",
       "message_type": "text"
     }
   }
   ```

### Server Actions Disponibles

```typescript
// Enviar mensaje a n8n para procesamiento
await sendMessageToN8N({
  chatId: string,
  phone: string,
  message: string
});

// Crear cotización desde n8n
await createQuoteFromN8N({
  chatId: string,
  products: Array<{
    sku: string,
    name: string,
    quantity: number,
    unit_price: number,
    unit_cost: number
  }>,
  notes?: string
});

// Obtener catálogo de productos
await getProductsCatalog({
  category?: string,
  searchTerm?: string,
  limit?: number
});
```

## 📊 Features Implementadas

### ✅ Dashboard de Métricas
- Conversaciones nuevas (hoy vs ayer)
- Cotizaciones enviadas (hoy vs ayer)
- Cotizaciones cerradas con revenue
- Tasa de conversión
- Gráfico de conversaciones (últimos 30 días)
- Gráfico de cotizaciones por estado
- Top productos cotizados
- Top productos vendidos

### ✅ Interfaz de Chat
- Lista de conversaciones en tiempo real
- Búsqueda de contactos
- Mensajes con timestamps
- Diferenciación visual usuario/assistant
- Auto-scroll al final
- Soporte para mensajes de cotización
- Estados de conversación (active/archived/closed)

### ✅ Integración en Tiempo Real
- Supabase Realtime para nuevos mensajes
- Actualización automática del dashboard cada 30s
- Optimistic updates con React Query

### ✅ Sistema de Cotizaciones
- Generación automática de número de cotización
- Cálculo de subtotal, IVA (16%) y total
- Tracking de estados (draft/sent/accepted/rejected)
- Asociación con productos del catálogo

## 🎯 Próximos Pasos

1. **Aplicar el schema a Supabase** (instrucciones arriba)

2. **Configurar los webhooks de n8n** (URLs en `.env`)

3. **Importar productos desde Excel**
   - Formato requerido: SKU, Name, Description, Price, Cost, Category, Stock
   - Feature pendiente de implementación

4. **Ajustar el sistema de autenticación**
   - El middleware ya está configurado
   - Las rutas `/auth/login` y `/auth/register` están protegidas

5. **Personalizar el agente IA**
   - Editar el system_prompt en la tabla `agents`
   - Configurar el modelo deseado (gemini-pro, gpt-4, etc.)

## 🐛 Troubleshooting

### Error: Cannot find module '@supabase/ssr'

Ejecuta: `npm install` (ya instalado)

### Los mensajes no llegan en tiempo real

1. Verifica que Supabase Realtime esté habilitado en tu proyecto
2. Revisa las políticas RLS en Supabase
3. Asegúrate de estar autenticado

### El dashboard no muestra métricas

1. Verifica que el schema esté aplicado correctamente
2. Asegúrate de tener datos de prueba en las tablas
3. Revisa la consola del navegador para errores

## 📝 Licencia

Código propietario - WhatsApp CRM Dashboard © 2025
