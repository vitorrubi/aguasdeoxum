"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface Visitor {
    name: string
    phone: string
}

interface AttendanceRecord {
    id: string
    ticket_type: string
    visitor: Visitor
}

interface Session {
    id: string
    opened_at: string
    closed_at: string | null
    gira: string
    consultation_tickets_available: number
    consultation_tickets_used: number
    attendances: AttendanceRecord[]
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

export default function SessionsClient({ sessions }: { sessions: Session[] }) {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-muted/40 p-4">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Histórico de Giras</h1>
                    <Button variant="outline" size="sm" onClick={() => router.push('/')}>Voltar</Button>
                </div>

                {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">Nenhuma sessão encontrada.</p>
                ) : (
                    <Card>
                        <CardContent className="pt-6">
                            <Accordion type="single" collapsible className="w-full">
                                {sessions.map((s) => (
                                    <AccordionItem key={s.id} value={s.id}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex flex-col items-start gap-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{s.gira}</span>
                                                    <Badge variant={s.closed_at ? 'secondary' : 'default'}>
                                                        {s.closed_at ? 'Fechada' : 'Aberta'}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(s.opened_at).toLocaleDateString('pt-BR')} — {s.attendances.length} presente(s)
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {s.attendances.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-2">Nenhum visitante registrado.</p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nome</TableHead>
                                                            <TableHead>Celular</TableHead>
                                                            <TableHead>Ficha</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {s.attendances.map((a) => (
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
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
