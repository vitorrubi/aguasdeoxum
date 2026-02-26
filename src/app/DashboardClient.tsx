"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { openSession, closeSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const GIRAS = ["Esquerda", "Marujos", "Ciganos", "Pretos Velhos", "Erês", "Malandros", "Caboclos", "Boiadeiros", "Baianos"]


interface Session {
    id: string
    opened_at: string
    closed_at: string | null
    consultation_tickets_available: number
    consultation_tickets_used: number
    gira: string
}

export default function DashboardClient({ initialSession }: { initialSession: Session | null }) {
    const router = useRouter()
    const [tickets, setTickets] = useState('')
    const [gira, setGira] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleOpenSession() {
        setLoading(true)
        await openSession(Number(tickets), gira)
        setLoading(false)
    }

    async function handleCloseSession() {
        if (!initialSession) return
        setLoading(true)
        await closeSession(initialSession.id)
        setLoading(false)
    }

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4">
            <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Águas de Oxum</h1>
                    <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
                </div>

                {initialSession ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Sessão Ativa - {initialSession.gira}
                                <Badge variant="default">Aberta</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Aberta em {new Date(initialSession.opened_at).toLocaleString('pt-BR')}
                            </p>
                            <div className="flex gap-4 text-center">
                                <div className="flex-1 bg-muted rounded-lg p-3">
                                    <p className="text-2xl font-bold">{initialSession.consultation_tickets_used}</p>
                                    <p className="text-xs text-muted-foreground">Fichas usadas</p>
                                </div>
                                <div className="flex-1 bg-muted rounded-lg p-3">
                                    <p className="text-2xl font-bold">{initialSession.consultation_tickets_available}</p>
                                    <p className="text-xs text-muted-foreground">Fichas disponíveis</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={() => router.push(`/attendance/${initialSession.id}`)} disabled={loading}>
                                    Registrar Presença
                                </Button>
                                <Button variant="destructive" onClick={handleCloseSession} disabled={loading}>
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
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="gira">Gira do dia</Label>
                                    <Select value={gira} onValueChange={setGira}>
                                        <SelectTrigger id="gira">
                                            <SelectValue placeholder="Selecione a gira" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GIRAS.map((g) => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                            </div>
                            <Button className="w-full" onClick={handleOpenSession} disabled={!tickets || !gira || loading}>
                                {loading ? 'Abrindo...' : 'Abrir Sessão'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Button variant="outline" className="w-full" onClick={() => router.push('/history')}>
                    Consultar Histórico
                </Button>
            </div>
        </div>
    )
}
