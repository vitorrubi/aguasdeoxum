import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Session {
  id: string
  opened_at: string
  closed_at: string | null
  consultation_tickets_available: number
  consultation_tickets_used: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [tickets, setTickets] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveSession()
  }, [])

  async function fetchActiveSession() {
    try {
      const { data } = await api.get<Session>('/sessions/active')
      setSession(data)
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  async function openSession() {
    const { data } = await api.post<Session>('/sessions', {
      consultation_tickets_available: Number(tickets),
    })
    setSession(data)
    setTickets('')
  }

  async function closeSession() {
    if (!session) return
    await api.patch(`/sessions/${session.id}/close`)
    setSession(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Águas de Oxum</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
        </div>

        {session ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sessão Ativa
                <Badge variant="default">Aberta</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Aberta em {new Date(session.opened_at).toLocaleString('pt-BR')}
              </p>
              <div className="flex gap-4 text-center">
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <p className="text-2xl font-bold">{session.consultation_tickets_used}</p>
                  <p className="text-xs text-muted-foreground">Fichas usadas</p>
                </div>
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <p className="text-2xl font-bold">{session.consultation_tickets_available}</p>
                  <p className="text-xs text-muted-foreground">Fichas disponíveis</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => navigate(`/attendance/${session.id}`)}>
                  Registrar Presença
                </Button>
                <Button variant="destructive" onClick={closeSession}>
                  Fechar Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Abrir Nova Sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tickets">Fichas de consulta disponíveis</Label>
                <Input
                  id="tickets"
                  type="number"
                  min="0"
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <Button className="w-full" onClick={openSession} disabled={!tickets}>
                Abrir Sessão
              </Button>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate('/history')}>
          Consultar Histórico
        </Button>
      </div>
    </div>
  )
}
