"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getVisitorByPhone, createVisitor } from '@/actions/visitors'
import { registerAttendance } from '@/actions/attendances'
import { formatPhone } from '@/lib/utils'

interface Session {
    id: string
    opened_at: string
    closed_at: string | null
    consultation_tickets_available: number
    consultation_tickets_used: number
    gira: string
}

interface Attendance {
    id: string
    ticket_type: string
    created_at: string
    visitor: { name: string; phone: string }
}

export default function AttendanceClient({ sessionId, session, initialAttendances }: { sessionId: string, session: Session | null, initialAttendances: Attendance[] }) {
    const router = useRouter()
    const [phone, setPhone] = useState('')
    const [name, setName] = useState('')
    const [isNew, setIsNew] = useState(false)
    const [visitorId, setVisitorId] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handlePhoneBlur() {
        if (phone.replace(/\D/g, '').length < 10) return
        setIsNew(false)
        setName('')
        setVisitorId('')
        try {
            const data = await getVisitorByPhone(phone)
            if (data) {
                setName(data.name)
                setVisitorId(data.id)
            } else {
                setIsNew(true)
            }
        } catch {
            setIsNew(true)
        }
    }

    async function handleRegister(ticketType: string) {
        setMessage('')
        setLoading(true)
        try {
            let id = visitorId
            if (isNew) {
                const newVisitor = await createVisitor(name, phone)
                id = newVisitor.id
                setVisitorId(id)
                setIsNew(false)
            }
            await registerAttendance(id, sessionId, ticketType)
            setMessage('Presença registrada!')
            setPhone('')
            setName('')
            setVisitorId('')
            setTimeout(() => setMessage(''), 3000)
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : 'Erro ao registrar')
        } finally {
            setLoading(false)
        }
    }

    const ticketsLeft = session ? session.consultation_tickets_available - session.consultation_tickets_used : 0

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

    return (
        <div className="min-h-screen bg-muted/40 p-4">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Registro de Presença</h1>
                    <Button variant="outline" size="sm" onClick={() => router.push('/')}>Voltar</Button>
                </div>

                {session && (
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <p>Fichas de consulta: {session.consultation_tickets_used}/{session.consultation_tickets_available}</p>
                        <p>Gira: <span className="font-medium text-foreground">{session.gira}</span></p>
                    </div>
                )}

                <Card>
                    <CardHeader><CardTitle>Identificar Visitante</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="phone">Celular</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
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
                                disabled={!visitorId && !(isNew && name) || loading}
                            >
                                Sem ficha
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleRegister('pass')}
                                disabled={!visitorId && !(isNew && name) || loading}
                            >
                                Ficha de Passe
                            </Button>
                            <Button
                                onClick={() => handleRegister('consultation')}
                                disabled={(!visitorId && !(isNew && name)) || ticketsLeft <= 0 || loading}
                            >
                                Ficha de Consulta {ticketsLeft <= 0 && '(esgotada)'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Presentes hoje ({initialAttendances?.length || 0})</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Celular</TableHead>
                                    <TableHead>Gira</TableHead>
                                    <TableHead>Ficha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialAttendances?.map((a: Attendance) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.visitor.name}</TableCell>
                                        <TableCell>{a.visitor.phone}</TableCell>
                                        <TableCell>{session?.gira || '-'}</TableCell>
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
