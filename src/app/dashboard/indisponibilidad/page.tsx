// PV_MOLDES V2.4
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2, AlertCircle, CheckCircle2, BarChart3, Package, Search, X, RefreshCw, Download } from 'lucide-react'
import { indicatorsService, IndisponibilidadResult, IndisponibilidadRow } from '@/services/indicators.service'
import Navbar from '@/components/layout/Navbar'

function indiceColor(v: number) {
    if (v >= 30) return { text: 'text-red-500',   badge: 'bg-red-50 text-red-600 border-red-200'   }
    if (v >= 15) return { text: 'text-amber-500',  badge: 'bg-amber-50 text-amber-600 border-amber-200' }
    return            { text: 'text-green-500',  badge: 'bg-green-50 text-green-600 border-green-200' }
}

export default function IndisponibilidadPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    const defaultRange = {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    }

    const [dateRange, setDateRange] = useState(defaultRange)

    // ── Combobox state ────────────────────────────────────────────────────────
    const [referenciasOptions, setReferenciasOptions] = useState<string[]>([])
    const [selectedReferencia, setSelectedReferencia] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [refLoading, setRefLoading] = useState(true)
    const comboRef = useRef<HTMLDivElement>(null)

    // ── Individual result state ───────────────────────────────────────────────
    const [result, setResult] = useState<IndisponibilidadResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ── Table state ───────────────────────────────────────────────────────────
    const [tableRows, setTableRows] = useState<IndisponibilidadRow[]>([])
    const [tableLoading, setTableLoading] = useState(false)
    const [tableRange, setTableRange] = useState(defaultRange)

    useEffect(() => {
        const stored = localStorage.getItem('moldapp_user')
        if (!stored) { router.push('/login'); return }
        setUser(JSON.parse(stored))
        indicatorsService.getReferencias()
            .then(setReferenciasOptions)
            .catch(console.error)
            .finally(() => setRefLoading(false))
        loadTable(defaultRange)
    }, [router])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node))
                setShowDropdown(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filteredOptions = useMemo(() => {
        const q = searchInput.toLowerCase().trim()
        if (!q) return referenciasOptions
        return referenciasOptions.filter(r => r.toLowerCase().includes(q))
    }, [searchInput, referenciasOptions])

    const handleSelectRef = (ref: string) => {
        setSelectedReferencia(ref)
        setSearchInput(ref)
        setShowDropdown(false)
        setResult(null)
        setError(null)
    }

    const handleClearRef = () => {
        setSelectedReferencia('')
        setSearchInput('')
        setResult(null)
        setError(null)
    }

    const handleCalcular = async () => {
        if (!selectedReferencia) { setError('Selecciona una referencia de molde.'); return }
        setError(null)
        setLoading(true)
        try {
            setResult(await indicatorsService.getIndisponibilidadByRef(selectedReferencia, dateRange))
        } catch (e) {
            console.error(e)
            setError('Error al consultar los datos. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        const lines = ['Referencia,Indice_Indisponibilidad']
        for (const row of tableRows) {
            const ref = `"${row.referencia.replace(/"/g, '""')}"`
            const indice = (row.indice / 100).toFixed(4)
            lines.push(`${ref},${indice}`)
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `indisponibilidad_${tableRange.start}_${tableRange.end}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const loadTable = async (range = tableRange) => {
        setTableLoading(true)
        try {
            setTableRows(await indicatorsService.getAllIndisponibilidad(range))
        } catch (e) {
            console.error(e)
        } finally {
            setTableLoading(false)
        }
    }

    const ic = result ? indiceColor(result.indice) : { text: 'text-slate-700', badge: '' }

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar user={user} showBackButton backPath="/dashboard"
                title="Índice de Indisponibilidad" subtitle="Análisis por referencia de molde" />

            <main className="pt-32 pb-28 px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

                {/* ── Filtros / cálculo individual ── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis por referencia</p>
                    <div className="flex flex-wrap items-end gap-4">
                        {(['start', 'end'] as const).map((key, i) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    {i === 0 ? 'Desde' : 'Hasta'}
                                </label>
                                <input
                                    type="date"
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={dateRange[key]}
                                    onChange={e => setDateRange(prev => ({ ...prev, [key]: e.target.value }))}
                                />
                            </div>
                        ))}

                        {/* Combobox */}
                        <div className="space-y-1.5 flex-1 min-w-[240px]" ref={comboRef}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Referencia de molde
                            </label>
                            <div className="relative">
                                <div className={`flex items-center gap-2 bg-white dark:bg-slate-950 border rounded-xl px-4 py-3 transition-all
                                    ${showDropdown ? 'border-violet-400 ring-2 ring-violet-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                                    {refLoading
                                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                                        : <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                    <input
                                        type="text"
                                        placeholder={refLoading ? 'Cargando...' : 'Buscar referencia...'}
                                        disabled={refLoading}
                                        className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-normal min-w-0"
                                        value={searchInput}
                                        onChange={e => { setSearchInput(e.target.value); setSelectedReferencia(''); setShowDropdown(true); setResult(null) }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {searchInput && (
                                        <button onClick={handleClearRef} className="shrink-0 p-0.5 rounded-full hover:bg-slate-100">
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                {showDropdown && !refLoading && (
                                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                                        {filteredOptions.length === 0 ? (
                                            <div className="px-5 py-4 text-[10px] text-slate-400 font-bold uppercase">Sin resultados</div>
                                        ) : (
                                            <ul className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                                                {filteredOptions.map(ref => (
                                                    <li key={ref}>
                                                        <button
                                                            onMouseDown={e => { e.preventDefault(); handleSelectRef(ref) }}
                                                            className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors
                                                                ${selectedReferencia === ref ? 'bg-violet-50 text-violet-700' : 'text-slate-700 dark:text-slate-300'}`}
                                                        >{ref}</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">{filteredOptions.length} de {referenciasOptions.length}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={handleCalcular} disabled={loading || !selectedReferencia}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-600/20 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                            Calcular
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* ── Resultado individual ── */}
                {loading && (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calculando...</p>
                    </div>
                )}

                {result && !loading && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <Package className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referencia analizada</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{selectedReferencia}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white dark:bg-slate-900 border border-violet-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-violet-50 rounded-2xl"><Activity className="w-5 h-5 text-violet-500" /></div>
                                <p className={`text-5xl font-black ${ic.text}`}>{result.indice.toFixed(1)}%</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Índice de Indisponibilidad</p>
                                <p className="text-[9px] text-slate-400">Promedio días fuera / {result.daysInMonth} días del mes</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-slate-50 rounded-2xl"><BarChart3 className="w-5 h-5 text-slate-500" /></div>
                                <p className="text-5xl font-black text-slate-700 dark:text-white">{result.promedioDiasFuera.toFixed(1)}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Promedio días fuera</p>
                                <p className="text-[9px] text-slate-400">por molde · {result.totalMoldes} moldes</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-orange-50 rounded-2xl"><AlertCircle className="w-5 h-5 text-orange-500" /></div>
                                <p className="text-5xl font-black text-orange-500">{result.enReparacionActual}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">En reparación ahora</p>
                                <p className="text-[9px] text-slate-400">de {result.totalMoldes} totales</p>
                            </div>
                        </div>
                        <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
                            result.indice >= 30 ? 'bg-red-50 border-red-200' : result.indice >= 15 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                        }`}>
                            {result.indice >= 15
                                ? <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${result.indice >= 30 ? 'text-red-500' : 'text-amber-500'}`} />
                                : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
                            <div className="space-y-1">
                                <p className={`text-xs font-black uppercase ${result.indice >= 30 ? 'text-red-700' : result.indice >= 15 ? 'text-amber-700' : 'text-green-700'}`}>
                                    {result.indice >= 30 ? 'Indisponibilidad crítica' : result.indice >= 15 ? 'Indisponibilidad moderada' : 'Indisponibilidad baja'}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                    En promedio, cada molde estuvo <strong>{result.promedioDiasFuera.toFixed(1)} días</strong> en reparación
                                    en el período ({result.daysInMonth} días del mes), representando un <strong>{result.indice.toFixed(1)}%</strong> de indisponibilidad.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tabla comparativa todas las referencias ── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-violet-500" />
                                Referencias con indisponibilidad &gt; 0%
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {tableRows.length} referencias · período {tableRange.start} → {tableRange.end}
                            </p>
                        </div>
                        {(['start', 'end'] as const).map((key, i) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{i === 0 ? 'Desde' : 'Hasta'}</label>
                                <input type="date"
                                    className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={tableRange[key]}
                                    onChange={e => setTableRange(prev => ({ ...prev, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <button onClick={() => loadTable(tableRange)} disabled={tableLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-wider shadow shadow-violet-600/20">
                            {tableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Actualizar
                        </button>
                        <button onClick={exportCSV} disabled={tableRows.length === 0 || tableLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-wider shadow shadow-emerald-600/20">
                            <Download className="w-3.5 h-3.5" />
                            Exportar CSV
                        </button>
                    </div>

                    {tableLoading ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculando todas las referencias...</p>
                        </div>
                    ) : tableRows.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                            <CheckCircle2 className="w-8 h-8 text-green-400 opacity-40" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sin indisponibilidad en este período</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                        {['#', 'Referencia', 'Moldes', 'Días prom. fuera', 'Índice', 'En reparación'].map(h => (
                                            <th key={h} className="py-3 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {tableRows.map((row, i) => {
                                        const c = indiceColor(row.indice)
                                        return (
                                            <tr key={row.referencia}
                                                className="hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors cursor-pointer"
                                                onClick={() => { handleSelectRef(row.referencia); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                            >
                                                <td className="py-4 px-5 text-[10px] font-black text-slate-400">{i + 1}</td>
                                                <td className="py-4 px-5">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{row.referencia}</p>
                                                </td>
                                                <td className="py-4 px-5 text-xs font-bold text-slate-500">{row.totalMoldes}</td>
                                                <td className="py-4 px-5 text-xs font-black text-slate-700">{row.promedioDiasFuera.toFixed(1)} días</td>
                                                <td className="py-4 px-5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${c.badge}`}>
                                                        {row.indice.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    {row.enReparacionActual > 0 ? (
                                                        <span className="text-xs font-black text-orange-500">{row.enReparacionActual} / {row.totalMoldes}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-bold">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
