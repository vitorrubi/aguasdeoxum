"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getActiveSession() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single()

    if (error) return null
    return data
}

export async function openSession(tickets: number, gira: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sessions')
        .insert({ consultation_tickets_available: tickets, gira })
        .select()
        .single()

    revalidatePath('/')
    return { data, error }
}

export async function closeSession(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sessions')
        .update({ closed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    revalidatePath('/')
    return { data, error }
}
