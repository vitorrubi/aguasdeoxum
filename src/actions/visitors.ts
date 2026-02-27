"use server"

import { createClient } from '@/lib/supabase/server'

export async function getVisitorByPhone(phone: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('phone', phone)
        .single()

    if (error) return null
    return data
}

export async function createVisitor(name: string, phone: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('visitors')
        .insert({ name, phone })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function getAllVisitors() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('visitors')
        .select('id, name, phone')
        .order('name', { ascending: true })

    if (error) return []
    return data
}
