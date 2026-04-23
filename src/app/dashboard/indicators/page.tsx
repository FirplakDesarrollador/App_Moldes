// PV_MOLDES V2.4
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    BarChart3, CheckCircle2, AlertCircle, Loader2, Target,
    Zap, Wrench, Package, Sparkles, CalendarDays, TrendingUp, ArrowRightCircle,
    Users, Activity, Gauge, X
} from 'lucide-react'
import {
    indicatorsService, IndicatorStats, MoldIndicatorRow, RapidaKPIResult, getDatesInRange
} from '@/services/indicators.service'
import Navbar from '@/components/layout/Navbar'

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'Todos',               label: 'Todos',               icon: BarChart3, color: 'blue'   },
    { key: 'REPARACION_RAPIDA',   label: 'Reparación rápida',   icon: Zap,       color: 'amber'  },
    { key: 'REPARACION_ESPECIAL', label: 'Reparación especial', icon: Wrench,    color: 'violet' },
    { key: 'MOLDE_NUEVO',         label: 'Molde nuevo',         icon: Package,   color: 'green'  },
    { key: 'MODELO_NUEVO',        label: 'Modelo nuevo',        icon: Sparkles,  color: 'pink'   },
]

const COLOR: Record<string, { bg: string; text: string; border: string; ring: string; softBg: string }> = {
    blue:   { bg: 'bg-blue-500',   text: 'text-blue-600',   border: 'border-blue-300 dark:border-blue-700',   ring: 'ring-blue-400/30',   softBg: 'bg-blue-50 dark:bg-blue-900/20'   },
    amber:  { bg: 'bg-amber-500',  text: 'text-amber-600',  border: 'border-amber-300 dark:border-amber-700',  ring: 'ring-amber-400/30',  softBg: 'bg-amber-50 dark:bg-amber-900/20'  },
    violet: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-300 dark:border-violet-700', ring: 'ring-violet-400/30', softBg: 'bg-violet-50 dark:bg-violet-900/20'},
    green:  { bg: 'bg-green-500',  text: 'text-green-600',  border: 'border-green-300 dark:border-green-700',  ring: 'ring-green-400/30',  softBg: 'bg-green-50 dark:bg-green-900/20'  },
    pink:   { bg: 'bg-pink-500',   text: 'text-pink-600',   border: 'border-pink-300 dark:border-pink-700',   ring: 'ring-pink-400/30',   softBg: 'bg-pink-50 dark:bg-pink-900/20'    },
}

function getCategory(row: MoldIndicatorRow): string {
    const tipo    = (row.tipo               || '').toUpperCase()
    const tipoRep = (row.tipo_de_reparacion || '').toUpperCase()
    if (tipo === 'MOLDE NUEVO')                                    return 'MOLDE_NUEVO'
    if (tipoRep.includes('MODELO'))                                return 'MODELO_NUEVO'
    if (tipoRep.includes('RAPIDA') || tipoRep.includes('RÁPIDA'))  return 'REPARACION_RAPIDA'
    if (tipoRep.includes('ESPECIAL'))                              return 'REPARACION_ESPECIAL'
    return 'OTRO'
}

function getCategoryLabel(key: string) {
    return CATEGORIES.find(c => c.key === key)?.label ?? key
}

function gaugeColor(v: number) {
    if (v >= 90) return { text: 'text-green-500', stroke: 'stroke-green-500' }
    if (v >= 70) return { text: 'text-yellow-500', stroke: 'stroke-yellow-500' }
    return { text: 'text-red-500', stroke: 'stroke-red-500' }
}

type RowTag = 'comprometido' | 'entregado' | 'ambos'
interface TableRow extends MoldIndicatorRow { tag: RowTag; cumple: boolean }

// ── Rápida KPI Card component ─────────────────────────────────────────────────
interface RapidaCardProps {
    label: string
    value: string
    sub?: string
    icon: React.ReactNode
    colorClass: string
    bgClass: string
    onClick?: () => void
}
function RapidaCard({ label, value, sub, icon, colorClass, bgClass, onClick }: RapidaCardProps) {
    const content = (
        <div className={`rounded-2xl p-5 border shadow-sm space-y-2 transition-all ${bgClass} ${onClick ? 'hover:shadow-md hover:border-amber-400 cursor-pointer active:scale-95' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass} bg-white/40`}>{icon}</div>
            <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">{label}</p>
            {sub && <p className="text-[8px] text-slate-400 italic">{sub}</p>}
        </div>
    )

    if (onClick) return <button onClick={onClick} className="text-left w-full">{content}</button>
    return content
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IndicatorsPage() {
    const router = useRouter()
    const [user, setUser]       = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats]     = useState<IndicatorStats | null>(null)

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    })
    const [selectedCat, setSelectedCat] = useState('Todos')
    const [numOperarios, setNumOperarios] = useState<number | ''>('')

    // ── Rápida-specific state ─────────────────────────────────────────────────
    const [rapidaDateRange, setRapidaDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    })
    const [operariosPorDia, setOperariosPorDia] = useState<Record<string, number | ''>>({})
    const [rapidaLoading, setRapidaLoading]     = useState(false)
    const [rapidaResult, setRapidaResult]       = useState<RapidaKPIResult | null>(null)
    const [rapidaError, setRapidaError]         = useState<string | null>(null)
    const [showRapidaModal, setShowRapidaModal] = useState(false)

    const isRapidaMode = selectedCat === 'REPARACION_RAPIDA'

    // Compute dates for the Rápida range to show per-day operator inputs
    const rapidaDates = useMemo(
        () => getDatesInRange(rapidaDateRange.start, rapidaDateRange.end),
        [rapidaDateRange]
    )

    // When rapidaDates changes, seed any new days with '' and remove removed days
    useEffect(() => {
        if (!isRapidaMode) return
        setOperariosPorDia(prev => {
            const next: Record<string, number | ''> = {}
            rapidaDates.forEach(d => { next[d] = prev[d] ?? '' })
            return next
        })
    }, [rapidaDates, isRapidaMode])

    useEffect(() => {
        const stored = localStorage.getItem('moldapp_user')
        if (!stored) { router.push('/login'); return }
        setUser(JSON.parse(stored))
        loadStats(dateRange)
    }, [router])

    const loadStats = async (range = dateRange) => {
        setLoading(true)
        try {
            setStats(await indicatorsService.getKPIs(range))
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const loadRapidaStats = async () => {
        setRapidaError(null)
        // validate all days have a value
        const missing = rapidaDates.filter(d => operariosPorDia[d] === '' || operariosPorDia[d] === undefined)
        if (missing.length > 0) {
            setRapidaError(`Falta el número de operarios para: ${missing.join(', ')}`)
            return
        }
        setRapidaLoading(true)
        try {
            const ops: Record<string, number> = {}
            rapidaDates.forEach(d => { ops[d] = Number(operariosPorDia[d]) })
            const result = await indicatorsService.getRapidaKPIs(rapidaDateRange, ops)
            setRapidaResult(result)
        } catch (e) {
            console.error(e)
            setRapidaError('Error consultando datos. Intenta de nuevo.')
        } finally {
            setRapidaLoading(false)
        }
    }

    // ── General KPIs (unchanged logic) ───────────────────────────────────────
    const filteredComp = useMemo(() => {
        if (!stats) return []
        return selectedCat === 'Todos'
            ? stats.comprometidos
            : stats.comprometidos.filter(r => getCategory(r) === selectedCat)
    }, [stats, selectedCat])

    const filteredEntr = useMemo(() => {
        if (!stats) return []
        return selectedCat === 'Todos'
            ? stats.entregados
            : stats.entregados.filter(r => getCategory(r) === selectedCat)
    }, [stats, selectedCat])

    const kpis = useMemo(() => {
        const total             = filteredComp.length
        const entregadosEnRango = filteredEntr.length
        const cumplieron        = filteredComp.filter(r =>
            r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada
        ).length
        const pendientes  = filteredComp.filter(r => !r.fecha_entrega).length
        const numOps      = typeof numOperarios === 'number' ? numOperarios : 0
        const productividad = (numOps > 0) ? (entregadosEnRango / numOps) : 0
        return {
            comprometidos: total, entregadosEnRango, cumplieron, pendientes,
            nivel: total > 0 ? (cumplieron / total) * 100 : 0,
            productividad, hasOps: numOps > 0,
        }
    }, [filteredComp, filteredEntr, numOperarios])

    const tableRows = useMemo((): TableRow[] => {
        const compIds = new Set(filteredComp.map(r => r.id))
        const entrIds = new Set(filteredEntr.map(r => r.id))
        const result: TableRow[] = []
        filteredComp.forEach(r => {
            const inB    = entrIds.has(r.id)
            const cumple = !!(r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada)
            result.push({ ...r, tag: inB ? 'ambos' : 'comprometido', cumple })
        })
        filteredEntr.forEach(r => {
            if (!compIds.has(r.id)) {
                const cumple = !!(r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada)
                result.push({ ...r, tag: 'entregado', cumple })
            }
        })
        result.sort((a, b) => (a.fecha_esperada || '').localeCompare(b.fecha_esperada || ''))
        return result
    }, [filteredComp, filteredEntr])

    const activeCat = CATEGORIES.find(c => c.key === selectedCat)!
    const col       = COLOR[activeCat.color]
    const gc        = gaugeColor(kpis.nivel)

    // ── Rápida gauge helpers ──────────────────────────────────────────────────
    const rapidaGaugeColor = (v: number) => {
        if (v >= 0.9) return { text: 'text-green-500', stroke: 'stroke-green-500' }
        if (v >= 0.7) return { text: 'text-yellow-500', stroke: 'stroke-yellow-500' }
        return { text: 'text-red-500', stroke: 'stroke-red-500' }
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar user={user} showBackButton backPath="/dashboard"
                title="Indicadores" subtitle="Nivel de Servicio & KPIs" />

            <main className="pt-32 pb-28 px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

                {/* ── Filter bar ─────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    {!isRapidaMode && (
                        <div className="flex flex-wrap items-end gap-4">
                            {(['start', 'end'] as const).map((key, i) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        {i === 0 ? 'Desde' : 'Hasta'}
                                    </label>
                                    <input
                                        type="date"
                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                                        value={dateRange[key]}
                                        onChange={e => setDateRange(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <div className="space-y-1.5 ml-0 md:ml-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Número de operarios
                                </label>
                                <input
                                    type="number" min="1" placeholder="Ejem: 4"
                                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 w-32"
                                    value={numOperarios}
                                    onChange={e => setNumOperarios(e.target.value === '' ? '' : parseInt(e.target.value))}
                                />
                            </div>
                            <button
                                onClick={() => loadStats()}
                                className="ml-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 text-[10px] uppercase tracking-[0.2em]"
                            >
                                Actualizar Reporte
                            </button>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Categoría:</span>
                        {CATEGORIES.map(cat => {
                            const c    = COLOR[cat.color]
                            const Icon = cat.icon
                            const active = selectedCat === cat.key
                            return (
                                <button key={cat.key} onClick={() => setSelectedCat(cat.key)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all
                                        ${active ? `${c.bg} text-white border-transparent shadow-md ring-4 ${c.ring}` : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />{cat.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── PANEL REPARACIÓN RÁPIDA ── */}
                {isRapidaMode && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-amber-200 dark:border-amber-800/40 shadow-sm p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl"><Zap className="w-4 h-4 text-amber-500" /></div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Reparación Rápida — Entradas</h3>
                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Configura el período y operarios por día</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-4">
                                {(['start', 'end'] as const).map((key, i) => (
                                    <div key={key} className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{i === 0 ? 'Fecha desde' : 'Fecha hasta'}</label>
                                        <input type="date" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/30"
                                            value={rapidaDateRange[key]} onChange={e => setRapidaDateRange(prev => ({ ...prev, [key]: e.target.value }))} />
                                    </div>
                                ))}
                            </div>

                            {rapidaDates.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operarios por día ({rapidaDates.length})</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                        {rapidaDates.map(date => {
                                            const d = new Date(date + 'T00:00:00')
                                            const label = d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })
                                            return (
                                                <div key={date} className="space-y-1">
                                                    <label className="text-[8px] font-black text-amber-600 uppercase tracking-widest block">{label}</label>
                                                    <input type="number" min="0" placeholder="0" value={operariosPorDia[date] ?? ''}
                                                        onChange={e => setOperariosPorDia(prev => ({ ...prev, [date]: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                                        className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl py-3 px-3 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-amber-500/30" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {rapidaError && <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl px-5 py-3">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs font-bold text-red-600">{rapidaError}</p></div>}

                            <button onClick={loadRapidaStats} disabled={rapidaLoading || rapidaDates.length === 0}
                                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                {rapidaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Calcular Indicadores
                            </button>
                        </div>

                        {rapidaResult && !rapidaLoading && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {[
                                        { label: 'Productividad', value: (rapidaResult.productividad * 100).toFixed(1) + '%', sub: `${Math.round(rapidaResult.totalMoldesReparados)} rep. / ${rapidaResult.metaTotal} meta`, icon: Activity, color: rapidaGaugeColor(rapidaResult.productividad) },
                                        { label: 'Nivel de Servicio', value: (rapidaResult.nivelServicio * 100).toFixed(1) + '%', sub: `${rapidaResult.moldesEntregados} entr. / ${rapidaResult.moldesEsperados} esp.`, icon: TrendingUp, color: rapidaGaugeColor(rapidaResult.nivelServicio) },
                                        { label: 'Prod. Hora Hombre', value: rapidaResult.totalOperarios > 0 ? rapidaResult.productividadHH.toFixed(2) : '—', sub: `Meta: 3.4`, icon: Gauge, color: rapidaResult.productividadHH >= 3.4 ? {text: 'text-green-500'} : {text: 'text-amber-500'} },
                                    ].map(g => (
                                        <div key={g.label} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center gap-4 text-center">
                                            <div className="flex items-center gap-2"><g.icon className="w-4 h-4 text-slate-400" /><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{g.label}</h4></div>
                                            <span className={`text-5xl font-black ${g.color.text}`}>{g.value}</span>
                                            <p className="text-[9px] text-slate-400 uppercase font-bold">{g.sub}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <RapidaCard label="Total Moldes Reparados" value={Math.round(rapidaResult.totalMoldesReparados).toString()} sub="Ponderado (Clic ver)" icon={<Package />} colorClass="text-amber-600" bgClass="bg-amber-50 dark:bg-amber-900/20 border-amber-200" onClick={() => setShowRapidaModal(true)} />
                                    <RapidaCard label="Moldes Esperados" value={String(rapidaResult.moldesEsperados)} sub="F. ESPERADA en rango" icon={<CalendarDays />} colorClass="text-blue-600" bgClass="bg-blue-50" />
                                    <RapidaCard label="Moldes Entregados" value={String(rapidaResult.moldesEntregados)} sub="En período comprometido" icon={<CheckCircle2 />} colorClass="text-green-600" bgClass="bg-green-50" />
                                    <RapidaCard label="Meta Total" value={String(rapidaResult.metaTotal)} sub={`24 × ${rapidaResult.numDays} días`} icon={<Target />} colorClass="text-slate-600" bgClass="bg-slate-50" />
                                    <RapidaCard label="Meta por Persona" value="3.4" sub="Valor referencia" icon={<TrendingUp />} colorClass="text-violet-600" bgClass="bg-violet-50" />
                                    <RapidaCard label="Total Operarios" value={String(rapidaResult.totalOperarios)} sub="Suma del período" icon={<Users />} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Desglose de moldes reparados</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'MS (Mármol Sint.)', value: rapidaResult.countMS, weight: '×1', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'FV (Fibra Vidrio)', value: rapidaResult.countFV, weight: '×1', color: 'text-sky-600', bg: 'bg-sky-50' },
                                            { label: 'Desmanchados', value: rapidaResult.countDesmanchado, weight: '×⅓', color: 'text-orange-600', bg: 'bg-orange-50' },
                                        ].map(item => (
                                            <div key={item.label} className={`rounded-2xl p-4 border border-slate-100 dark:border-slate-800 ${item.bg} space-y-1`}>
                                                <div className="flex items-center justify-between"><span className={`text-2xl font-black ${item.color}`}>{item.value}</span><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/60 ${item.color}`}>{item.weight}</span></div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PANEL GENERAL ── */}
                {!isRapidaMode && (
                    <>
                        {loading ? <div className="py-40 flex flex-col items-center gap-6"><Loader2 className="animate-spin text-blue-500" /><p className="text-xs uppercase font-black text-slate-400">Consultando datos...</p></div> : stats && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2"><CalendarDays className="text-blue-500" /><p className="text-3xl font-black text-blue-600">{kpis.comprometidos}</p><p className="text-[9px] font-black uppercase text-slate-600">Comprometidos</p></div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2"><ArrowRightCircle className="text-green-500" /><p className="text-3xl font-black text-green-600">{kpis.entregadosEnRango}</p><p className="text-[9px] font-black uppercase text-slate-600">Entregados</p></div>
                                    <div className={`border p-6 rounded-2xl shadow-sm space-y-2 ${col.softBg} ${col.border}`}><TrendingUp className={gc.text} /><p className={`text-3xl font-black ${gc.text}`}>{Math.round(kpis.nivel)}%</p><p className="text-[9px] font-black uppercase text-slate-600">Nivel de servicio</p></div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2"><Zap className="text-emerald-500" /><p className="text-3xl font-black text-emerald-600">{kpis.hasOps ? kpis.productividad.toFixed(1) : '—'}</p><p className="text-[9px] font-black uppercase text-slate-600">Productividad</p></div>
                                    <div className={`border p-6 rounded-2xl shadow-sm space-y-2 ${col.softBg} ${col.border}`}><activeCat.icon className={col.text} /><p className="text-sm font-black uppercase text-slate-700">{activeCat.label}</p><p className="text-[9px] font-black uppercase text-slate-500">Categoría activa</p></div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                    <div className="xl:col-span-1 space-y-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-5">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cumplimiento</h3>
                                            <span className={`text-5xl font-black ${gc.text}`}>{Math.round(kpis.nivel)}%</span>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 text-green-600"><Target className="w-3" /><span className="text-[9px] font-black uppercase">Meta: 95%</span></div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-4 space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Leyenda</p>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[9px] font-black text-slate-600">Comprometido</span></div>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-[9px] font-black text-slate-600">Entregado</span></div>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500"></span><span className="text-[9px] font-black text-slate-600">Ambos</span></div>
                                        </div>
                                    </div>

                                    <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between"><h3 className="text-sm font-black flex items-center gap-3"><BarChart3 className="w-5 h-5 text-blue-500" /> Detalle del período <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${col.border} ${col.text} ${col.softBg}`}>{activeCat.label}</span></h3></div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left min-w-[800px]">
                                                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Molde', 'F. Esperada', 'F. Real Entrega', 'Estado', 'En período', 'Cumplimiento'].map(h => (<th key={h} className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>))}</tr></thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {tableRows.map((m, i) => {
                                                        const tagColors = { comprometido: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-200' }, entregado: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-600 border-green-200' }, ambos: { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-600 border-violet-200'} }
                                                        const { dot, badge } = tagColors[m.tag]; const tagLabel = m.tag === 'ambos' ? 'Comp+Entr' : m.tag === 'comprometido' ? 'Comprometido' : 'Entregado'
                                                        return (
                                                            <tr key={`gen-${m.id}-${i}`} className="hover:bg-slate-50/60 transition-colors">
                                                                <td className="py-4 px-6"><div className="flex items-start gap-2"><span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`}></span><div><p className="text-xs font-black text-slate-900 uppercase leading-normal">{m.nombre_articulo}</p><p className="text-[10px] font-mono text-slate-400">{m.serial}</p></div></div></td>
                                                                <td className="py-4 px-6 text-xs text-slate-500">{m.fecha_esperada ? new Date(m.fecha_esperada + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</td>
                                                                <td className="py-4 px-6 text-xs font-bold text-slate-700">{m.fecha_entrega ? new Date(m.fecha_entrega + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</td>
                                                                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-slate-100 text-slate-600 uppercase border border-slate-200">{m.estado}</span></td>
                                                                <td className="py-4 px-6"><span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${badge}`}>{tagLabel}</span></td>
                                                                <td className="py-4 px-6">{m.cumple ? <div className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase">Cumple</span></div> : <div className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase">No cumple</span></div>}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── MODAL DETALLE REPARADOS (RÁPIDA) ── */}
                {showRapidaModal && rapidaResult && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRapidaModal(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-[1400px] max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-sm font-black flex items-center gap-3"><BarChart3 className="w-5 h-5 text-amber-500" /> Detalle de Moldes Reparados <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border border-amber-200 text-amber-600 bg-amber-50">REPARACIÓN RÁPIDA</span></h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Ponderado: {Math.round(rapidaResult.totalMoldesReparados)}</span>
                                    <button onClick={() => setShowRapidaModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                        <tr className="bg-slate-50 border-b border-slate-100">{['Molde', 'Ponderación', 'F. Ingreso', 'F. Esperada', 'F. Entrega', 'Estado', 'Cumplimiento'].map(h => (<th key={h} className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rapidaResult.reparados.map((m, i) => {
                                            const cumple = m.fecha_entrega && m.fecha_esperada && m.fecha_entrega <= m.fecha_esperada
                                            const format = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO') : '—'
                                            return (
                                                <tr key={`rap-${m.id}-${i}`} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-4 px-6"><div className="flex items-start gap-2"><span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500"></span><div><p className="text-xs font-black text-slate-900 uppercase leading-normal">{m.titulo}</p><p className="text-[10px] font-mono text-slate-400">{m.codigo}</p></div></div></td>
                                                    <td className="py-4 px-6"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${m.tipo_calculado === 'MS' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : m.tipo_calculado === 'FV' ? 'bg-sky-50 text-sky-600 border-sky-200' : m.tipo_calculado === 'Brillado' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{m.tipo_calculado}</span></td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">{format(m.fecha_entrada)}</td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">{format(m.fecha_esperada)}</td>
                                                    <td className="py-4 px-6 text-xs font-bold text-slate-700">{format(m.fecha_entrega)}</td>
                                                    <td className="py-4 px-6"><span className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-green-500/10 text-green-600 border border-green-500/20 uppercase">ENTREGADO</span></td>
                                                    <td className="py-4 px-6">{cumple ? <div className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase">Cumple</span></div> : <div className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase">No cumple</span></div>}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Total registros: {rapidaResult.reparados.length}</span>
                                <span>Firplak S.A. - Indicadores</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
