"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSessionAttendances(sessionId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('attendances')
        .select('*, visitor:visitors(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function getAttendanceHistory(phone: string) {
    const supabase = await createClient()
    const { data: visitor } = await supabase
        .from('visitors')
        .select('id, name, phone')
        .eq('phone', phone)
        .single()

    if (!visitor) return []

    const { data: attendances } = await supabase
        .from('attendances')
        .select('*, session:sessions(gira)')
        .eq('visitor_id', visitor.id)
        .order('created_at', { ascending: false })

    return (attendances || []).map(a => ({ ...a, visitor }))
}

export async function registerAttendance(visitorId: string, sessionId: string, ticketType: string) {
    const supabase = await createClient()

    // 1. Check if visitor already registered in session
    const { data: existing } = await supabase
        .from('attendances')
        .select('id')
        .match({ visitor_id: visitorId, session_id: sessionId })
        .single()

    if (existing) throw new Error("Visitante já registrado nesta sessão.")

    if (ticketType === 'consultation') {
        // 2. Check recent consultation (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: recent } = await supabase
            .from('attendances')
            .select('id')
            .eq('visitor_id', visitorId)
            .eq('ticket_type', 'consultation')
            .gte('created_at', sevenDaysAgo.toISOString())
            .limit(1)

        if (recent && recent.length > 0) {
            throw new Error("Visitante já recebeu ficha de consulta nos últimos 7 dias.")
        }

        // 3. Check availability
        const { data: session } = await supabase
            .from('sessions')
            .select('consultation_tickets_available, consultation_tickets_used')
            .eq('id', sessionId)
            .single()

        if (!session || session.consultation_tickets_used >= session.consultation_tickets_available) {
            throw new Error("Fichas de consulta esgotadas.")
        }

        // 4. Increment used tickets
        await supabase
            .from('sessions')
            .update({ consultation_tickets_used: session.consultation_tickets_used + 1 })
            .eq('id', sessionId)
    }

    const { error } = await supabase
        .from('attendances')
        .insert({ visitor_id: visitorId, session_id: sessionId, ticket_type: ticketType })

    if (error) throw new Error("Erro ao registrar presença.")

    revalidatePath(`/attendance/${sessionId}`)
}
