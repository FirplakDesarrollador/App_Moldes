'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, TrendingUp, Activity, Calendar, Filter, Loader2, Target, CheckCircle2, AlertCircle, Clock, BarChart3, PieChart } from 'lucide-react'
import { indicatorsService, IndicatorStats } from '@/services/indicators.service'
import Navbar from '@/components/layout/Navbar'

export default function IndicatorsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<IndicatorStats | null>(null)

    // Filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
        loadStats()
    }, [router])

    const loadStats = async () => {
        setLoading(true)
        try {
            const data = await indicatorsService.getKPIs(dateRange)
            setStats(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getGaugeColor = (value: number) => {
        if (value >= 90) return 'text-green-500'
        if (value >= 70) return 'text-yellow-500'
        return 'text-red-500'
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Indicadores"
                subtitle="Nivel de Servicio & KPIs"
            />

            <main className="pt-32 pb-28 px-6 max-w-7xl mx-auto">
                <div className="space-y-8 animate-in fade-in duration-700">

                    {/* Filters Bar */}
                    <div className="p-8 glass-card rounded-[2.5rem] border border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-3xl">
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Desde</label>
                                <input
                                    type="date"
                                    className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-3 px-6 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Hasta</label>
                                <input
                                    type="date"
                                    className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-3 px-6 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            onClick={loadStats}
                            className="w-full md:w-64 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase text-[10px] tracking-[0.2em]"
                        >
                            Actualizar Reporte
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-6">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            </div>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Analizando desempeño...</p>
                        </div>
                    ) : stats && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                            {/* Left Column: Gauge & Main stats */}
                            <div className="xl:col-span-1 space-y-8">
                                <div className="p-10 glass-card rounded-[3rem] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-8 bg-black/5 dark:bg-black/40">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Nivel de Servicio</h3>
                                    <div className="relative w-56 h-56 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="112" cy="112" r="95" className="stroke-black/5 dark:stroke-white/5 fill-none" strokeWidth="16" />
                                            <circle
                                                cx="112" cy="112" r="95"
                                                className={`fill-none transition-all duration-1000 ${getGaugeColor(stats.nivelServicio).replace('text-', 'stroke-')}`}
                                                strokeWidth="16"
                                                strokeDasharray={2 * Math.PI * 95}
                                                strokeDashoffset={2 * Math.PI * 95 * (1 - stats.nivelServicio / 100)}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-6xl font-black ${getGaugeColor(stats.nivelServicio)}`}>{Math.round(stats.nivelServicio)}%</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Cumplimiento</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-6 py-2 bg-green-500/10 rounded-full border border-green-500/20 text-green-500 dark:text-green-400">
                                        <Target className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Meta Corporativa: 95%</span>
                                    </div>
                                </div>

                                <div className="p-8 glass-card rounded-[2.5rem] border border-black/5 dark:border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                            <CheckCircle2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalEntregadasATiempo}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-300">Entregados a Tiempo</p>
                                        <p className="text-[10px] text-gray-500 font-medium">De {stats.totalComprometidas} moldes totales programados para este periodo.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Center/Right: Category Breakdown & Details */}
                            <div className="xl:col-span-2 space-y-8">
                                {/* Categories Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(stats.desglosePorCategoria).map(([cat, val], idx) => (
                                        <div key={idx} className="p-6 glass-card rounded-3xl border border-black/5 dark:border-white/5 space-y-4 hover:border-blue-500/30 transition-all group">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{val}</div>
                                            <p className="text-[8px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest leading-tight">{cat.replace(/_/g, ' ')}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Detailed Table */}
                                <div className="p-8 glass-card rounded-[2.5rem] border border-black/5 dark:border-white/5 min-h-[500px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black flex items-center gap-3">
                                            <BarChart3 className="w-6 h-6 text-blue-500" /> Trazabilidad de Cumplimiento
                                        </h3>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase">Pendientes: {stats.totalPendientes}</span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto min-w-full">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-black/10 dark:border-white/10">
                                                    <th className="py-4 px-2 text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Molde</th>
                                                    <th className="py-4 px-2 text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">F. Esperada</th>
                                                    <th className="py-4 px-2 text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest text-center">Estatus</th>
                                                    <th className="py-4 px-2 text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest text-right">On-Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                {stats.detalles.map((m, i) => {
                                                    const entrega = m.Fecha_de_entrega ? new Date(m.Fecha_de_entrega) : null
                                                    const esperada = new Date(m.Fecha_esperada)
                                                    const onTime = entrega && entrega <= esperada

                                                    return (
                                                        <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                                            <td className="py-4 px-2">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase">{m.nombre_articulo}</p>
                                                                <p className="text-[10px] font-mono text-gray-500 dark:text-gray-600">{m.serial}</p>
                                                            </td>
                                                            <td className="py-4 px-2 text-xs font-medium text-gray-400">
                                                                {esperada.toLocaleDateString()}
                                                            </td>
                                                            <td className="py-4 px-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${m.estado?.includes('ENTREGADO')
                                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                                    }`}>
                                                                    {m.estado || 'PROCESO'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-2 text-right">
                                                                {onTime ? (
                                                                    <div className="inline-flex items-center gap-1.5 text-green-500">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-tighter">CUMPLE</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-1.5 text-red-500/50">
                                                                        <AlertCircle className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-tighter">PEND/VENC</span>
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
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
