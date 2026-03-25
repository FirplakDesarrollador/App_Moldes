'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    RefreshCw, Search, Wifi, WifiOff, Loader2,
    Package, CheckCircle2, XCircle, AlertTriangle, Database,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

// ── Types ────────────────────────────────────────────────────────────────────
interface SAPItem {
    ItemCode: string
    ItemDescription: string
    InternalSerialNumber: string
    Status: string
    Frozen?: 'tNO' | 'tYES'
    UpdateDate?: string | null
    ManageSerialNumbers?: 'tYES' | 'tNO'
    [key: string]: any // Fallback for UDFs like U_Estado
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

// ── Helpers ──────────────────────────────────────────────────────────────────
function frozenLabel(f: string) {
    return f === 'tYES' ? 'Inactivo' : 'Activo'
}
function formatDate(d: string | null) {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('es-CO') } catch { return d }
}
function itemTypeLabel(t: string) {
    const map: Record<string, string> = {
        itItems: 'Artículo', itLabor: 'Mano de obra', itTravel: 'Viaje', itFixedAssets: 'Activo', itResource: 'Recurso',
    }
    return map[t] ?? t
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SAPItemsPage() {
    const router = useRouter()
    const [user, setUser]     = useState<any>(null)
    const [status, setStatus] = useState<ConnectionStatus>('idle')
    const [items, setItems]   = useState<SAPItem[]>([])
    const [errorMsg, setErrorMsg] = useState('')
    const [lastSync, setLastSync] = useState<Date | null>(null)

    // Filters
    const [search, setSearch]           = useState('')
    const [filterFrozen, setFilterFrozen] = useState<'all' | 'active' | 'inactive'>('all')

    useEffect(() => {
        const stored = localStorage.getItem('moldapp_user')
        if (!stored) { router.push('/login'); return }
        setUser(JSON.parse(stored))
        loadItems()
    }, [router])

    const loadItems = async () => {
        setStatus('connecting')
        setErrorMsg('')
        try {
            const res = await fetch('/api/sap-items')
            const data = await res.json()
            if (!res.ok || !data.success) {
                setErrorMsg(data.error || 'Error desconocido')
                setStatus('error')
                return
            }
            setItems(data.items ?? [])
            setLastSync(new Date())
            setStatus('connected')
        } catch (e: any) {
            setErrorMsg(e.message || 'Error de red')
            setStatus('error')
        }
    }

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return items.filter(item => {
            const q = search.toLowerCase()
            const serial = item.InternalSerialNumber || item.MfrSerialNo || item.SerialNumber || item.IntrSerial || ''
            const matchSearch = !q ||
                (item.ItemCode || '').toLowerCase().includes(q) ||
                (item.ItemDescription || '').toLowerCase().includes(q) ||
                serial.toLowerCase().includes(q)
            
            // Reusing the frozen filter to filter by status conceptually if needed,
            // but effectively keeping the UI intact.
            const matchFrozen =
                filterFrozen === 'all' ||
                (filterFrozen === 'active'   && String(item.Status).includes('Available')) ||
                (filterFrozen === 'inactive' && !String(item.Status).includes('Available'))
            return matchSearch && matchFrozen
        })
    }, [items, search, filterFrozen])

    // ── Status badge ──────────────────────────────────────────────────────────
    const statusBadge = {
        idle:       { icon: WifiOff,       text: 'Sin conectar',   cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' },
        connecting: { icon: Loader2,       text: 'Conectando…',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-700', spin: true },
        connected:  { icon: Wifi,          text: 'Conectado',      cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-700' },
        error:      { icon: WifiOff,       text: 'Error de conexión', cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-700' },
    }[status]

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar user={user} showBackButton backPath="/dashboard"
                title="Estado Molde SAP" subtitle="Consulta en tiempo real desde SAP Business One" />

            <main className="pt-32 pb-28 px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

                {/* ── Toolbar ──────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">

                    {/* Status badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusBadge.cls}`}>
                        <statusBadge.icon className={`w-4 h-4 ${(statusBadge as any).spin ? 'animate-spin' : ''}`} />
                        {statusBadge.text}
                        {status === 'connected' && lastSync && (
                            <span className="ml-1 normal-case font-medium opacity-60">
                                — {lastSync.toLocaleTimeString('es-CO')}
                            </span>
                        )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre…"
                            className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/30 w-72"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Frozen filter */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase">
                        {(['all', 'active', 'inactive'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterFrozen(f)}
                                className={`px-4 py-2.5 transition-colors ${
                                    filterFrozen === f
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
                            </button>
                        ))}
                    </div>

                    {/* Reload */}
                    <button
                        onClick={loadItems}
                        disabled={status === 'connecting'}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 text-[10px] uppercase tracking-[0.15em]"
                    >
                        <RefreshCw className={`w-4 h-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                        Recargar
                    </button>
                </div>

                {/* ── Summary cards ─────────────────────────────────────────── */}
                {status === 'connected' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Series SAP', value: items.length, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'Disponibles',  value: items.filter(i => String(i.Status).includes('Available')).length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                            { label: 'Ocupados / Otros', value: items.filter(i => !String(i.Status).includes('Available')).length, icon: XCircle,    color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/20'   },
                            { label: 'Con serial', value: items.length, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                        ].map(c => (
                            <div key={c.label} className={`${c.bg} border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-2 shadow-sm`}>
                                <c.icon className={`w-5 h-5 ${c.color}`} />
                                <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── States ───────────────────────────────────────────────── */}
                {status === 'connecting' && (
                    <div className="py-40 flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Autenticando con SAP y consultando Items…</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-24 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-base font-black text-slate-700 dark:text-slate-300">{errorMsg || 'Error de conexión con SAP'}</p>
                        <p className="text-xs text-slate-400 max-w-md">Verifica que el servidor SAP esté disponible y que las credenciales en <code>.env</code> sean correctas.</p>
                        <button
                            onClick={loadItems}
                            className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="py-24 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Haz clic en Recargar para consultar SAP</p>
                    </div>
                )}

                {/* ── Items table ───────────────────────────────────────────── */}
                {status === 'connected' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-base font-black flex items-center gap-3">
                                <Package className="w-5 h-5 text-blue-500" />
                                Items en SAP
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-700 rounded-full text-[9px] font-black uppercase">
                                    Mostrando {filtered.length} de {items.length}
                                </span>
                            </h3>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No se encontraron items para mostrar</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
                                            {['Número de artículo', 'Descripción', 'Número de serie', 'Estado', 'Estado Molde'].map(h => (
                                                <th key={h} className="py-4 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filtered.map((item, i) => {
                                            const estado = String(item.Status).replace('bost_', '')
                                            const estadoMolde = item.U_ESTADO_MOLDE || item.U_ESTADO || item.U_EstadoMolde || item.U_Estado || '—'
                                            
                                            return (
                                            <tr key={item.InternalSerialNumber ?? i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-4 px-5">
                                                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                                                        {item.ItemCode}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 max-w-[280px]">
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.ItemDescription}>
                                                        {item.ItemDescription || '—'}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                                        {item.InternalSerialNumber || item.MfrSerialNo || item.SerialNumber || item.IntrSerial || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border whitespace-nowrap ${
                                                        estado.toLowerCase().includes('available')
                                                            ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                                                            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                                                    }`}>
                                                        {estado === 'Available' ? 'Disponible' : estado}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">
                                                        {estadoMolde}
                                                    </span>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
