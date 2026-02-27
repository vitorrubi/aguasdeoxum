import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllSessions } from '@/actions/sessions'
import SessionsClient from './SessionsClient'

export default async function SessionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const sessions = await getAllSessions()

    return <SessionsClient sessions={sessions} />
}
