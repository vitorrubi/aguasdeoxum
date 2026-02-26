import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
    const supabase = await createClient()
    const { data: { session: authSession } } = await supabase.auth.getSession()

    if (!authSession) {
        redirect('/login')
    }

    return <HistoryClient />
}
