import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Visitor { id: string; name: string; phone: string }
interface Session {
  id: string
  consultation_tickets_available: number
  consultation_tickets_used: number
}
interface Attendance {
  id: string
  ticket_type: string
  created_at: string
  visitor: Visitor
}

const ticketLabel: Record<string, string> = {
  none: 'Sem ficha',
  pass: 'Passe',
  consultation: 'Consulta',
}

const ticketVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  none: 'outline',
  pass: 'secondary',
  consultation: 'default',
}

export default function Attendance() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [visitorId, setVisitorId] = useState('')
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSession()
    fetchAttendances()
  }, [])

  async function fetchSession() {
    const { data } = await api.get<Session>('/sessions/active')
    setSession(data)
  }

  async function fetchAttendances() {
    const { data } = await api.get<Attendance[]>(`/sessions/${sessionId}/attendances`)
    setAttendances(data)
  }

  async function handlePhoneBlur() {
    if (phone.length < 8) return
    setIsNew(false)
    setName('')
    setVisitorId('')
    try {
      const { data } = await api.get<Visitor>(`/visitors?phone=${phone}`)
      setName(data.name)
      setVisitorId(data.id)
    } catch {
      setIsNew(true)
    }
  }

  async function handleRegister(ticketType: string) {
    setMessage('')
    try {
      let id = visitorId
      if (isNew) {
        const { data } = await api.post<Visitor>('/visitors', { name, phone })
        id = data.id
        setVisitorId(id)
        setIsNew(false)
      }
      await api.post('/attendances', { visitor_id: id, session_id: sessionId, ticket_type: ticketType })
      setMessage('Presença registrada!')
      setPhone('')
      setName('')
      setVisitorId('')
      fetchAttendances()
      fetchSession()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data ?? 'Erro ao registrar'
      setMessage(msg.trim())
    }
  }

  const ticketsLeft = session ? session.consultation_tickets_available - session.consultation_tickets_used : 0

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Registro de Presença</h1>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>Voltar</Button>
        </div>

        {session && (
          <p className="text-sm text-muted-foreground">
            Fichas de consulta: {session.consultation_tickets_used}/{session.consultation_tickets_available}
          </p>
        )}

        <Card>
          <CardHeader><CardTitle>Identificar Visitante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!isNew}
                placeholder={isNew ? 'Novo visitante — informe o nome' : ''}
              />
            </div>

            {message && (
              <p className={`text-sm ${message.includes('registrada') ? 'text-green-600' : 'text-destructive'}`}>
                {message}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleRegister('none')}
                disabled={!visitorId && !(isNew && name)}
              >
                Sem ficha
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRegister('pass')}
                disabled={!visitorId && !(isNew && name)}
              >
                Ficha de Passe
              </Button>
              <Button
                onClick={() => handleRegister('consultation')}
                disabled={(!visitorId && !(isNew && name)) || ticketsLeft <= 0}
              >
                Ficha de Consulta {ticketsLeft <= 0 && '(esgotada)'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Presentes hoje ({attendances.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Ficha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.visitor.name}</TableCell>
                    <TableCell>{a.visitor.phone}</TableCell>
                    <TableCell>
                      <Badge variant={ticketVariant[a.ticket_type]}>{ticketLabel[a.ticket_type]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
