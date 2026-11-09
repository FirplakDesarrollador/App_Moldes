'use client'

import { useEffect, useState } from 'react'
import { buildDailyIndicators, dailyIndicatorsService } from '@/services/dailyIndicators.service'
import { getDatesInRange, indicatorsService } from '@/services/indicators.service'
import { createIndicatorsClient } from '@/lib/indicatorsSupabase'

interface Props {
    start: string
    end: string
    userName: string
}

export default function DailySpecialIndicators({ start, end, userName }: Props) {
    const [operators, setOperators] = useState<Record<string, number | ''>>({})
    const [busy, setBusy] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [failed, setFailed] = useState(false)
    const [authUserId, setAuthUserId] = useState<string | null>(null)
    const [responsible, setResponsible] = useState<string | null>(null)
    const [checkingAccess, setCheckingAccess] = useState(true)
    const [authBusy, setAuthBusy] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [accessMessage, setAccessMessage] = useState('')
    const validRange = !!start && !!end && start <= end
    const dates = validRange ? getDatesInRange(start, end) : []
    // The current indicator query reads the main database without a plant filter.
    const planta = 'PRINCIPAL'

    useEffect(() => {
        const client = createIndicatorsClient()
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setResponsible(null)
                setCheckingAccess(false)
            }
            setAuthUserId(session?.user.id ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (!authUserId) { setCheckingAccess(false); return }
        let cancelled = false
        setResponsible(null)
        setCheckingAccess(true)
        createIndicatorsClient().from('responsables_indicadores_moldes')
            .select('nombre').eq('user_id', authUserId).maybeSingle()
            .then(({ data, error }) => {
                if (cancelled) return
                setResponsible(!error && data ? data.nombre : null)
                setAccessMessage(error ? 'No se pudo verificar el permiso. Revisa la conexión y la configuración de acceso.' :
                    data ? '' : 'Esta cuenta no tiene permiso para guardar indicadores.')
                setCheckingAccess(false)
            })
        return () => { cancelled = true }
    }, [authUserId])

    async function authorize(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setAuthBusy(true)
        setAccessMessage('')
        try {
            const { error } = await createIndicatorsClient().auth.signInWithPassword({ email: email.trim(), password })
            if (error) setAccessMessage('No se pudo iniciar sesión. Verifica el correo y la contraseña de tu cuenta autorizada.')
        } catch {
            setAccessMessage('No se pudo conectar con Supabase. Intenta nuevamente.')
        } finally {
            setPassword('')
            setAuthBusy(false)
        }
    }

    async function closeAuthorization() {
        setAuthBusy(true)
        try {
            const { error } = await createIndicatorsClient().auth.signOut({ scope: 'local' })
            if (error) setAccessMessage('No se pudo cerrar la autorización. Intenta nuevamente.')
        } finally { setAuthBusy(false) }
    }

    useEffect(() => {
        let cancelled = false
        setOperators({})
        setMessage('')
        setLoading(true)
        if (!responsible) { setLoading(false); return }
        if (!start || !end || start > end) { setLoading(false); return }
        dailyIndicatorsService.load(start, end, planta).then(rows => {
            if (cancelled) return
            setOperators(Object.fromEntries(rows.map(row => [row.fecha, row.operarios_activos ?? ''])))
        }).catch(() => {
            if (cancelled) return
            setFailed(true)
            setMessage('No se pudieron recuperar los operarios guardados. Verifica la conexión y los permisos de la tabla.')
        }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [start, end, responsible])

    async function save() {
        if (!responsible || checkingAccess) return
        setMessage('')
        setFailed(false)
        if (!validRange || dates.some(date => operators[date] === '' || !Number.isSafeInteger(operators[date]) || Number(operators[date]) < 0)) {
            setFailed(true)
            setMessage('Ingresa un número entero de operarios, desde cero, para cada fecha.')
            return
        }
        setBusy(true)
        try {
            const stats = await indicatorsService.getKPIs({ start, end })
            const rows = buildDailyIndicators(stats, dates, operators as Record<string, number>, planta, responsible)
            await dailyIndicatorsService.save(rows)
            setMessage(`Se guardaron los indicadores de ${rows.length} día(s).`)
        } catch {
            setFailed(true)
            setMessage('No se pudieron guardar los indicadores. Verifica la conexión y los permisos de la tabla en Supabase y vuelve a intentar.')
        } finally { setBusy(false) }
    }

    return (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-bold">Registro diario de reparación especial</h2>
            <p className="text-sm text-slate-500">Perfil de la app: {userName}. El guardado está reservado a Sara Aguilar y Brian Sánchez.</p>
            {checkingAccess ? <p role="status">Verificando autorización…</p> : responsible ? (
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-green-600">Guardado autorizado: {responsible}</p>
                    <button type="button" disabled={busy || authBusy} onClick={closeAuthorization} className="text-sm underline">Cerrar autorización</button>
                </div>
            ) : (
                <form onSubmit={authorize} className="flex flex-wrap items-end gap-3">
                    <label className="text-sm">Correo del responsable
                        <input type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)}
                            className="block rounded-lg border bg-transparent p-2" />
                    </label>
                    <label className="text-sm">Contraseña
                        <input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}
                            className="block rounded-lg border bg-transparent p-2" />
                    </label>
                    <button type="submit" disabled={authBusy} className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:opacity-50">{authBusy ? 'Autorizando…' : 'Autorizar guardado'}</button>
                    {authUserId && <button type="button" disabled={authBusy} onClick={closeAuthorization} className="text-sm underline">Cambiar cuenta</button>}
                </form>
            )}
            {accessMessage && <p role="alert" className="text-red-600">{accessMessage}</p>}
            <p className="text-sm text-slate-500">Planta principal. Ingresa los operarios de cada fecha del período y consulta para guardar los indicadores diarios. Los días ya registrados se actualizan.</p>
            <fieldset disabled={busy || loading || !responsible || checkingAccess} className="flex flex-wrap gap-3 max-h-72 overflow-y-auto disabled:opacity-50">
                {dates.map(date => (
                    <label key={date} className="text-sm space-y-1">
                        <span className="block">{date}</span>
                        <input type="number" min="0" step="1" aria-label={`Operarios activos ${date}`}
                            value={operators[date] ?? ''}
                            onChange={event => setOperators(previous => ({ ...previous, [date]: event.target.value === '' ? '' : Number(event.target.value) }))}
                            className="block w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2" />
                    </label>
                ))}
            </fieldset>
            {!validRange && <p role="alert">Selecciona un período válido.</p>}
            <button type="button" disabled={busy || loading || !validRange || !responsible || checkingAccess} onClick={save}
                className="rounded-xl bg-violet-600 px-5 py-3 text-white font-bold disabled:opacity-50">
                {loading ? 'Recuperando operarios…' : busy ? 'Consultando y guardando…' : 'Consultar y guardar días'}
            </button>
            {message && <p role={failed ? 'alert' : 'status'} className={failed ? 'text-red-600' : 'text-green-600'}>{message}</p>}
        </section>
    )
}
