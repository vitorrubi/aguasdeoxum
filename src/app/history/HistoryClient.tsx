"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAttendanceHistory } from '@/actions/attendances'
import { formatPhone } from '@/lib/utils'

interface Attendance {
    id: string
    ticket_type: string
    created_at: string
    session?: { gira: string }
    visitor: { name: string; phone: string }
}

export default function HistoryClient() {
    const router = useRouter()
    const [phone, setPhone] = useState('')
    const [history, setHistory] = useState<Attendance[] | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setNotFound(false)
        setLoading(true)
        try {
            const data = await getAttendanceHistory(phone)
            setHistory(data)
            if (!data || data.length === 0) setNotFound(true)
        } catch {
            setNotFound(true)
            setHistory(null)
        } finally {
            setLoading(false)
        }
    }

    const ticketLabel: Record<string, string> = { none: 'Sem ficha', pass: 'Passe', consultation: 'Consulta' }
    const ticketVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
        none: 'outline', pass: 'secondary', consultation: 'default',
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Histórico de Presença</h1>
                    <Button variant="outline" size="sm" onClick={() => router.push('/')}>Voltar</Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="phone">Celular</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <Button type="submit" className="self-end" disabled={loading}>Buscar</Button>
                        </form>
                    </CardContent>
                </Card>

                {notFound && <p className="text-sm text-muted-foreground text-center">Nenhum registro encontrado.</p>}

                {history && history.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{history[0].visitor.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{history[0].visitor.phone} — {history.length} presença(s)</p>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Gira</TableHead>
                                        <TableHead>Ficha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell>{new Date(a.created_at).toLocaleString('pt-BR')}</TableCell>
                                            <TableCell>{a.session?.gira || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={ticketVariant[a.ticket_type]}>{ticketLabel[a.ticket_type]}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
