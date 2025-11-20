'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server Actions para autenticación con Supabase
 */

export async function loginWithEmail(email: string, password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            success: false,
            error: error.message,
        };
    }

    // Redirigir al dashboard después del login exitoso
    redirect('/dashboard');
}

export async function registerWithEmail(
    email: string,
    password: string,
    name?: string
) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });

    if (error) {
        return {
            success: false,
            error: error.message,
        };
    }

    return {
        success: true,
        message:
            'Account created successfully. Please check your email to verify your account.',
    };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/auth/v2/login');
}

export async function getUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}
