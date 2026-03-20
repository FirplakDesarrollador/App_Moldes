// PV_MOLDES V2.4
'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Tag, Info, Ruler, AlertCircle, Clock, Edit3, Loader2, Package, CheckCircle2, Activity } from 'lucide-react'
import { Mold, moldsService } from '@/services/molds.service'
import { parseFlexibleDate } from '@/lib/date-utils'

interface MoldDetailsProps {
    mold: Mold
    onClose: () => void
    onEdit: (mold: Mold) => void
}

export default function MoldDetails({ mold, onClose, onEdit }: MoldDetailsProps) {
    const [repairCount, setRepairCount] = useState<number | null>(null)
    const [loadingCount, setLoadingCount] = useState(true)

    useEffect(() => {
        loadRepairCount()
    }, [mold.Nombre])

    const loadRepairCount = async () => {
        setLoadingCount(true)
        try {
            const count = await moldsService.getCountByReference(mold.Nombre)
            setRepairCount(count)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingCount(false)
        }
    }

    const getStatusStyles = (st: string) => {
        const s = (st || '').toUpperCase()
        if (s.includes('REPARACION')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        if (s.includes('ESPERA')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        if (s.includes('ENTREGADO') || s.includes('PRODUCCION')) return 'bg-green-500/10 text-green-400 border-green-500/20'
        if (s.includes('DESTRUIDO')) return 'bg-red-500/10 text-red-500 border-red-500/20'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col max-h-[92vh] relative">

                {/* Glow Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

                {/* Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-600/20">
                            <Tag className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none mb-1">{mold.Nombre}</h2>
                            <p className="text-xs font-mono font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5 w-fit">CÓDIGO: {mold["CODIGO MOLDE"]}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onEdit(mold)}
                            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-600/20 group"
                        >
                            <Edit3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar relative z-10">

                    {/* Metrics / Counter Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-10 rounded-[3rem] border border-blue-500/20 flex items-center justify-between group overflow-hidden relative">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">Inventario en Reparación</h4>
                                <div className="flex items-end gap-3">
                                    {loadingCount ? (
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-1" />
                                    ) : (
                                        <span className="text-6xl font-black text-white leading-none tracking-tighter">
                                            {repairCount}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-blue-500/60 pb-1.5 uppercase">Moldes de esta referencia</span>
                                </div>
                            </div>
                            <div className="p-5 bg-blue-600/20 rounded-full border border-blue-500/30">
                                <Activity className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>

                        <div className={`p-10 rounded-[3rem] border flex items-center justify-between group ${getStatusStyles(mold.ESTADO)}`}>
                            <div className="relative">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70">Estado Operativo</h4>
                                <p className="text-3xl font-black uppercase tracking-tight">
                                    {mold.ESTADO?.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <div className="p-5 bg-white/10 rounded-full border border-white/10">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Column 1: Core Fields */}
                        <div className="space-y-8">
                            <SectionHeader title="Datos de Identificación" icon={Info} />
                            <div className="space-y-4">
                                <DetailItem label="Descripción" value={mold.Nombre} />
                                <DetailItem label="Responsable" value={mold.Usuario} />
                                <DetailItem label="Código Molde" value={mold["CODIGO MOLDE"]} />
                                <DetailItem label="Tipo Reparación" value={mold["Tipo de reparacion"]} />
                            </div>
                        </div>

                        {/* Column 2: Timeline */}
                        <div className="space-y-8">
                            <SectionHeader title="Línea de Tiempo" icon={Calendar} />
                            <div className="space-y-4">
                                <DetailItem label="Fecha Ingreso App" value={parseFlexibleDate(mold["Created"])?.toLocaleDateString() || 'N/A'} />
                                <DetailItem label="Fecha Entrada Taller" value={parseFlexibleDate(mold["FECHA ENTRADA"])?.toLocaleDateString() || mold["FECHA ENTRADA"] || 'N/A'} />
                                <DetailItem label="Fecha Entrega Esperada" value={parseFlexibleDate(mold["FECHA ESPERADA"])?.toLocaleDateString() || mold["FECHA ESPERADA"] || 'N/A'} highlight />
                                <DetailItem label="Fecha Entrega Real" value={parseFlexibleDate(mold["FECHA ENTREGA"])?.toLocaleDateString() || 'PENDIENTE'} />
                            </div>
                        </div>

                        {/* Column 3: Defects & Comments */}
                        <div className="space-y-8">
                            <SectionHeader title="Técnico / Notas" icon={AlertCircle} />
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Defectos Asociados:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {mold["DEFECTOS A REPARAR"]?.split(',').map((d, i) => (
                                            <span key={i} className="px-4 py-2 bg-red-500/5 text-red-500/80 border border-red-500/10 rounded-xl text-[10px] font-black uppercase">
                                                {d.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl min-h-[120px]">
                                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-3 block">Observaciones:</label>
                                    <p className="text-sm font-medium text-gray-400 italic leading-relaxed">
                                        "{mold.OBSERVACIONES || 'Sin comentarios registrados.'}"
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer Meta */}
                <div className="p-10 bg-white/[0.01] border-t border-white/5 flex flex-wrap items-center justify-between gap-6 relative z-10 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-800">SISTEMA:</span>
                            <span>{mold.ID ? `ID-${mold.ID}` : 'REC-PROVISIONAL'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-800">MODIFICADO:</span>
                            <span>{mold.Modified ? new Date(mold.Modified).toLocaleString() : 'ORIGINAL'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600/40">
                        <Package className="w-3 h-3" />
                        <span>MOLD-TRACKER PRO v2.1</span>
                    </div>
                </div>

            </div>
        </div>
    )
}

function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-blue-500/50" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{title}</h3>
            </div>
        </div>
    )
}

function DetailItem({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
    return (
        <div className={`p-5 rounded-2xl border transition-all ${highlight ? 'bg-blue-600/5 border-blue-500/20 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
            <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] mb-1.5">{label}</p>
            <p className={`text-sm font-bold uppercase truncate ${highlight ? 'text-blue-400' : 'text-gray-300'}`}>
                {value || '---'}
            </p>
        </div>
    )
}
