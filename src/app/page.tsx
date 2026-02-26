import { getActiveSession } from '@/actions/sessions'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session: authSession } } = await supabase.auth.getSession()

  if (!authSession) {
    redirect('/login')
  }

  const activeSession = await getActiveSession()

  return <DashboardClient initialSession={activeSession} />
}
