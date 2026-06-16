// PV_MOLDES V2.4
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2, AlertCircle, CheckCircle2, BarChart3, Package, Search, X } from 'lucide-react'
import { indicatorsService, IndisponibilidadResult } from '@/services/indicators.service'
import Navbar from '@/components/layout/Navbar'

export default function IndisponibilidadPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    })
    const [referenciasOptions, setReferenciasOptions] = useState<string[]>([])
    const [selectedReferencia, setSelectedReferencia] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [result, setResult] = useState<IndisponibilidadResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [refLoading, setRefLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const comboRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const stored = localStorage.getItem('moldapp_user')
        if (!stored) { router.push('/login'); return }
        setUser(JSON.parse(stored))
        indicatorsService.getReferencias()
            .then(setReferenciasOptions)
            .catch(console.error)
            .finally(() => setRefLoading(false))
    }, [router])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
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
            const res = await indicatorsService.getIndisponibilidadByRef(selectedReferencia, dateRange)
            setResult(res)
        } catch (e) {
            console.error(e)
            setError('Error al consultar los datos. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const indiceColor = result
        ? result.indice >= 30 ? 'text-red-500' : result.indice >= 15 ? 'text-amber-500' : 'text-green-500'
        : 'text-slate-700'

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar user={user} showBackButton backPath="/dashboard"
                title="Índice de Indisponibilidad" subtitle="Análisis por referencia de molde" />

            <main className="pt-32 pb-28 px-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">

                {/* ── Filtros ── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
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

                        {/* Combobox referencia */}
                        <div className="space-y-1.5 flex-1 min-w-[260px]" ref={comboRef}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Referencia de molde
                            </label>
                            <div className="relative">
                                <div className={`flex items-center gap-2 bg-white dark:bg-slate-950 border rounded-xl px-4 py-3 transition-all
                                    ${showDropdown ? 'border-violet-400 ring-2 ring-violet-500/20' : 'border-slate-200 dark:border-slate-800'}
                                    ${selectedReferencia ? 'border-violet-300' : ''}`}
                                >
                                    {refLoading
                                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                                        : <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    }
                                    <input
                                        type="text"
                                        placeholder={refLoading ? 'Cargando referencias...' : 'Buscar referencia...'}
                                        disabled={refLoading}
                                        className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-normal min-w-0"
                                        value={searchInput}
                                        onChange={e => {
                                            setSearchInput(e.target.value)
                                            setSelectedReferencia('')
                                            setShowDropdown(true)
                                            setResult(null)
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {searchInput && (
                                        <button onClick={handleClearRef} className="shrink-0 p-0.5 rounded-full hover:bg-slate-100 transition-colors">
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown */}
                                {showDropdown && !refLoading && (
                                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                                        {filteredOptions.length === 0 ? (
                                            <div className="px-5 py-4 text-[10px] text-slate-400 font-bold uppercase">
                                                Sin resultados para "{searchInput}"
                                            </div>
                                        ) : (
                                            <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                                                {filteredOptions.map(ref => (
                                                    <li key={ref}>
                                                        <button
                                                            onMouseDown={e => { e.preventDefault(); handleSelectRef(ref) }}
                                                            className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors
                                                                ${selectedReferencia === ref ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}
                                                        >
                                                            {ref}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {filteredOptions.length} de {referenciasOptions.length} referencias
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleCalcular}
                            disabled={loading || !selectedReferencia}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-600/20 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                            Calcular
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl px-5 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* ── Resultados ── */}
                {loading && (
                    <div className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calculando...</p>
                    </div>
                )}

                {result && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                        {/* Encabezado referencia */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <Package className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referencia analizada</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{selectedReferencia}</p>
                            </div>
                        </div>

                        {/* KPI cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800/40 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
                                    <Activity className="w-5 h-5 text-violet-500" />
                                </div>
                                <p className={`text-5xl font-black ${indiceColor}`}>{result.indice.toFixed(1)}%</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Índice de Indisponibilidad</p>
                                <p className="text-[9px] text-slate-400">Promedio días fuera / {result.daysInMonth} días del mes</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <BarChart3 className="w-5 h-5 text-slate-500" />
                                </div>
                                <p className="text-5xl font-black text-slate-700 dark:text-white">{result.promedioDiasFuera.toFixed(1)}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Promedio días fuera</p>
                                <p className="text-[9px] text-slate-400">por molde · {result.totalMoldes} moldes en referencia</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 text-center">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                </div>
                                <p className="text-5xl font-black text-orange-500">{result.enReparacionActual}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">En reparación ahora</p>
                                <p className="text-[9px] text-slate-400">de {result.totalMoldes} totales</p>
                            </div>
                        </div>

                        {/* Interpretación */}
                        <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
                            result.indice >= 30
                                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                                : result.indice >= 15
                                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30'
                                : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30'
                        }`}>
                            {result.indice >= 15
                                ? <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${result.indice >= 30 ? 'text-red-500' : 'text-amber-500'}`} />
                                : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                            }
                            <div className="space-y-1">
                                <p className={`text-xs font-black uppercase tracking-wide ${
                                    result.indice >= 30 ? 'text-red-700' : result.indice >= 15 ? 'text-amber-700' : 'text-green-700'
                                }`}>
                                    {result.indice >= 30
                                        ? 'Indisponibilidad crítica'
                                        : result.indice >= 15
                                        ? 'Indisponibilidad moderada'
                                        : 'Indisponibilidad baja'}
                                </p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                                    En promedio, cada molde de esta referencia estuvo <strong>{result.promedioDiasFuera.toFixed(1)} días</strong> en reparación
                                    durante el período analizado ({result.daysInMonth} días del mes),
                                    lo que representa un <strong>{result.indice.toFixed(1)}%</strong> de indisponibilidad.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
