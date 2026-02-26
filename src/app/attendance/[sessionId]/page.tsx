import { getActiveSession } from '@/actions/sessions'
import { getSessionAttendances } from '@/actions/attendances'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient from './AttendanceClient'

export default async function AttendancePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const supabase = await createClient()
    const { data: { session: authSession } } = await supabase.auth.getSession()

    if (!authSession) {
        redirect('/login')
    }

    const resolvedParams = await params
    const { sessionId } = resolvedParams
    const sessionData = await getActiveSession()
    const attendances = await getSessionAttendances(sessionId)

    return <AttendanceClient sessionId={sessionId} session={sessionData} initialAttendances={attendances} />
}
