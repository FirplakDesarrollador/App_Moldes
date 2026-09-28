// PV_MOLDES V2.4
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    BarChart3, CheckCircle2, AlertCircle, Loader2, Target,
    Zap, Wrench, Package, Sparkles, CalendarDays, TrendingUp, ArrowRightCircle,
} from 'lucide-react'
import { indicatorsService, IndicatorStats, MoldIndicatorRow } from '@/services/indicators.service'
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

// ── Classify row into category key ────────────────────────────────────────────
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

// ── Row tag: which set does the record appear in? ─────────────────────────────
type RowTag = 'comprometido' | 'entregado' | 'ambos'

interface TableRow extends MoldIndicatorRow {
    tag: RowTag
    cumple: boolean
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

    // ── Filter each set by selected category ──────────────────────────────────
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

    // ── KPI: nivel de servicio calculado SOLO sobre comprometidos ─────────────
    // Cumple: the record is in comprometidos AND fecha_entrega <= fecha_esperada
    const kpis = useMemo(() => {
        const total   = filteredComp.length
        const entregadosEnRango = filteredEntr.length

        // Of the comprometidos, how many were delivered on or before their expected date?
        const cumplieron = filteredComp.filter(r =>
            r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada
        ).length

        const pendientes = filteredComp.filter(r => !r.fecha_entrega).length
        
        // Productividad calculation
        const numOps = typeof numOperarios === 'number' ? numOperarios : 0
        const productividad = (numOps > 0) ? (entregadosEnRango / numOps) : 0

        return {
            comprometidos:      total,
            entregadosEnRango,  // shown in card 2 (informativo)
            cumplieron,         // used for nivel de servicio
            pendientes,
            nivel: total > 0 ? (cumplieron / total) * 100 : 0,
            productividad,
            hasOps: numOps > 0
        }
    }, [filteredComp, filteredEntr, numOperarios])

    // ── Build unified table: union of A ∪ B, deduplicated ────────────────────
    const tableRows = useMemo((): TableRow[] => {
        const compIds = new Set(filteredComp.map(r => r.id))
        const entrIds = new Set(filteredEntr.map(r => r.id))

        const result: TableRow[] = []

        // Add comprometidos
        filteredComp.forEach(r => {
            const inB   = entrIds.has(r.id)
            const cumple = !!(r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada)
            result.push({ ...r, tag: inB ? 'ambos' : 'comprometido', cumple })
        })

        // Add entregados that are NOT already in comprometidos
        filteredEntr.forEach(r => {
            if (!compIds.has(r.id)) {
                // Not committed for this period but delivered in it
                const cumple = !!(r.fecha_entrega && r.fecha_esperada && r.fecha_entrega <= r.fecha_esperada)
                result.push({ ...r, tag: 'entregado', cumple })
            }
        })

        // sort by fecha_esperada asc
        result.sort((a, b) =>
            (a.fecha_esperada || '').localeCompare(b.fecha_esperada || '')
        )

        return result
    }, [filteredComp, filteredEntr])

    const activeCat = CATEGORIES.find(c => c.key === selectedCat)!
    const col       = COLOR[activeCat.color]
    const gc        = gaugeColor(kpis.nivel)

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar user={user} showBackButton backPath="/dashboard"
                title="Indicadores" subtitle="Nivel de Servicio & KPIs" />

            <main className="pt-32 pb-28 px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

                {/* ── Filter bar ─────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
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
                                type="number"
                                min="1"
                                placeholder="Ejem: 4"
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 w-32"
                                value={numOperarios}
                                onChange={e => {
                                    const val = e.target.value === '' ? '' : parseInt(e.target.value)
                                    setNumOperarios(val as number | '')
                                }}
                            />
                        </div>

                        <button
                            onClick={() => loadStats()}
                            className="ml-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 text-[10px] uppercase tracking-[0.2em]"
                        >
                            Actualizar Reporte
                        </button>
                    </div>

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

                {loading ? (
                    <div className="py-40 flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Consultando BD_moldes...</p>
                    </div>
                ) : stats && (
                    <>
                        {/* ── 5 KPI cards ──────────────────────────────────── */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* Comprometidos */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2 shadow-sm">
                                <CalendarDays className="w-5 h-5 text-blue-500" />
                                <p className="text-3xl font-black text-blue-600">{kpis.comprometidos}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">Comprometidos para la fecha</p>
                                <p className="text-[8px] text-slate-400">FECHA ESPERADA en el rango</p>
                            </div>
                            {/* Entregados a tiempo */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <p className="text-3xl font-black text-green-600">{kpis.cumplieron}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">Entregados a tiempo</p>
                                <p className="text-[8px] text-slate-400">Cumplieron compromiso</p>
                            </div>
                            {/* Nivel de servicio */}
                            <div className={`border rounded-2xl p-6 space-y-2 shadow-sm ${col.softBg} ${col.border}`}>
                                <TrendingUp className={`w-5 h-5 ${gc.text}`} />
                                <p className={`text-3xl font-black ${gc.text}`}>{Math.round(kpis.nivel)}%</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">Nivel de servicio</p>
                                <p className="text-[8px] text-slate-400">{kpis.cumplieron} cumplieron / {kpis.comprometidos} comprometidos</p>
                            </div>
                            {/* Productividad - NEW */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2 shadow-sm relative overflow-hidden">
                                <Zap className="w-5 h-5 text-emerald-500" />
                                <div className="space-y-1">
                                    {kpis.hasOps ? (
                                        <>
                                            <p className="text-3xl font-black text-emerald-600">{Number(kpis.productividad.toFixed(1))}</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">Productividad</p>
                                            <p className="text-[8px] text-slate-400">{Number(kpis.productividad.toFixed(1))} moldes por operario por día</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-black text-amber-500 uppercase py-2">Ingresar operarios</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Productividad</p>
                                            <p className="text-[8px] text-slate-400">Falta dato de personal</p>
                                        </>
                                    )}
                                </div>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                            </div>
                            {/* Active category */}
                            <div className={`border rounded-2xl p-6 space-y-2 shadow-sm ${col.softBg} ${col.border}`}>
                                <activeCat.icon className={`w-5 h-5 ${col.text}`} />
                                <p className={`text-sm font-black ${col.text} uppercase leading-tight`}>{activeCat.label}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Categoría activa</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    <span className="text-[8px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full text-slate-500">
                                        Pend: {kpis.pendientes}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Gauge + table ─────────────────────────────────── */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                            {/* Gauge */}
                            <div className="xl:col-span-1 space-y-4">
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center gap-5">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Nivel de Servicio</h3>
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
                                            <circle cx="88" cy="88" r="72" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="14" />
                                            <circle cx="88" cy="88" r="72"
                                                className={`fill-none transition-all duration-1000 ${gc.stroke}`}
                                                strokeWidth="14"
                                                strokeDasharray={2 * Math.PI * 72}
                                                strokeDashoffset={2 * Math.PI * 72 * (1 - kpis.nivel / 100)}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-black ${gc.text}`}>{Math.round(kpis.nivel)}%</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Cumplimiento</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 text-green-600">
                                        <Target className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Meta: 95%</span>
                                    </div>
                                </div>

                                {/* Formula box */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-2 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Fórmula</p>
                                    <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <p className="text-base font-black text-green-600">{kpis.cumplieron} cumplieron</p>
                                        <p className="text-[9px] text-slate-400">de los comprometidos</p>
                                    </div>
                                    <p className="text-base font-black text-blue-600 pt-1">{kpis.comprometidos} comprometidos</p>
                                    <p className="text-[8px] text-slate-400 italic pt-1">Solo mide comprometidos del período</p>
                                </div>

                                {/* Legend */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Leyenda de tabla</p>
                                    {[
                                        { label: 'Comprometido',     dot: 'bg-blue-500',   desc: 'FECHA ESPERADA en rango' },
                                        { label: 'Entregado',        dot: 'bg-green-500',  desc: 'FECHA ENTREGA en rango' },
                                        { label: 'Comprometido + Entregado', dot: 'bg-violet-500', desc: 'Cumple ambos criterios' },
                                    ].map(l => (
                                        <div key={l.label} className="flex items-start gap-2">
                                            <span className={`mt-1 w-2 h-2 rounded-full ${l.dot} shrink-0`}></span>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-600 dark:text-slate-300">{l.label}</p>
                                                <p className="text-[8px] text-slate-400">{l.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detail table */}
                            <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                                    <h3 className="text-base font-black flex items-center gap-3">
                                        <BarChart3 className="w-5 h-5 text-blue-500" />
                                        Comprometidos &amp; Entregados del período
                                        <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${col.border} ${col.text} ${col.softBg}`}>
                                            {activeCat.label}
                                        </span>
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-300/50 rounded-full text-[9px] font-black uppercase">
                                            Comprometidos: {kpis.comprometidos}
                                        </span>
                                        <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-300/50 rounded-full text-[9px] font-black uppercase">
                                            A tiempo: {kpis.cumplieron}
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[820px]">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
                                                {['Molde', 'Categoría', 'F. Esperada', 'F. Real Entrega', 'Estado', 'En período', 'Cumplimiento'].map(h => (
                                                    <th key={h} className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {tableRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-20 text-center text-slate-400 text-xs font-bold uppercase">
                                                        No hay registros para esta categoría y período.
                                                    </td>
                                                </tr>
                                            ) : tableRows.map((m, i) => {
                                                const catLabel = getCategoryLabel(getCategory(m))
                                                const tagColors = {
                                                    comprometido: { dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-600 border-blue-200'          },
                                                    entregado:    { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-600 border-green-200'        },
                                                    ambos:        { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-600 border-violet-200'      },
                                                }
                                                const { dot, badge } = tagColors[m.tag]
                                                const tagLabel = m.tag === 'ambos' ? 'Comp+Entr' : m.tag === 'comprometido' ? 'Comprometido' : 'Entregado'

                                                return (
                                                    <tr key={`${m.id}-${i}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-start gap-2">
                                                                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`}></span>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase truncate max-w-[160px]">
                                                                        {m.nombre_articulo || 'Sin título'}
                                                                    </p>
                                                                    <p className="text-[10px] font-mono text-slate-400">{m.serial || '--'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">{catLabel}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                                            {m.fecha_esperada
                                                                ? new Date(m.fecha_esperada + 'T00:00:00').toLocaleDateString('es-CO')
                                                                : '—'}
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            {m.fecha_entrega ? (
                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                    {new Date(m.fecha_entrega + 'T00:00:00').toLocaleDateString('es-CO')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">Sin entregar</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border whitespace-nowrap ${
                                                                (m.estado || '').toUpperCase().includes('ENTREGADO')
                                                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            }`}>
                                                                {m.estado || 'PROCESO'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border whitespace-nowrap ${badge}`}>
                                                                {tagLabel}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {m.tag === 'entregado' ? (
                                                                // Entregado en rango but not committed for this period — informational
                                                                <span className="text-[9px] font-black text-slate-400 uppercase italic">Fuera de compromiso</span>
                                                            ) : m.cumple ? (
                                                                <div className="inline-flex items-center gap-1.5 text-green-500">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span className="text-[9px] font-black uppercase">CUMPLE</span>
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 text-red-400">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                    <span className="text-[9px] font-black uppercase">No cumple</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
