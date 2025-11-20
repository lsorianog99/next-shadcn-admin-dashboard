'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Provider de React Query para el dashboard
 * Configurado con opciones optimizadas para WhatsApp CRM
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Configuración para queries
                        staleTime: 60 * 1000, // Los datos son frescos por 1 minuto
                        gcTime: 5 * 60 * 1000, // Garbage collection después de 5 minutos
                        refetchOnWindowFocus: true, // Refetch al volver a la ventana
                        retry: 1, // Solo 1 reintento en caso de error
                    },
                    mutations: {
                        // Configuración para mutations
                        retry: 0, // No reintentar mutations automáticamente
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
