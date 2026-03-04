'use client'

import { useState } from 'react'
import { Calendar, Tag, AlertCircle, MessageSquare, Save, Loader2, Link2, User, Clock } from 'lucide-react'
import { MoldActive, moldsService } from '@/services/molds.service'

interface MoldCardProps {
    mold: MoldActive
    onUpdate: () => void
}

export default function MoldCard({ mold, onUpdate }: MoldCardProps) {
    const [status, setStatus] = useState(mold.ESTADO || 'EN_ESPERA_MOLDES')
    const [saving, setSaving] = useState(false)

    const handleStatusUpdate = async (newStatus: string) => {
        setSaving(true)
        try {
            const user = JSON.parse(localStorage.getItem('moldapp_user') || '{}').Nombre || 'Sistema'
            await moldsService.updateStatus(mold, newStatus, user)
            setStatus(newStatus)
            onUpdate()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const STATUS_OPTIONS = [
        'EN_REPARACION_RAPIDA',
        'EN_REPARACION_ESPECIAL',
        'EN_ESPERA_PRODUCCION',
        'MOLDE_DESTRUIDO',
        'EN_ESPERA_MOLDES'
    ]

    const getStatusStyles = (st: string) => {
        const s = (st || '').toUpperCase()
        if (s.includes('REPARACION')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        if (s.includes('ESPERA')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        if (s.includes('ENTREGADO') || s.includes('PRODUCCION')) return 'bg-green-500/10 text-green-400 border-green-500/20'
        if (s.includes('DESTRUIDO')) return 'bg-red-500/10 text-red-500 border-red-500/20'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    return (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 group hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col h-full shadow-2xl">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-600/10 transition-colors" />

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-blue-600/5 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Tag className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black leading-[1.1] tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase">{mold.Título}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-gray-500 tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">{mold["CODIGO MOLDE"]}</span>
                            <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">{mold["Prioridad"]}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <select
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border backdrop-blur-md shadow-lg outline-none cursor-pointer hover:scale-105 transition-all ${getStatusStyles(status)}`}
                        value={status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt} className="bg-slate-900 border-none">{opt.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Entrada</span>
                    </div>
                    <p className="text-xs font-black text-white">{mold["FECHA ENTRADA"] ? new Date(mold["FECHA ENTRADA"]).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Esperada</span>
                    </div>
                    <p className="text-xs font-black text-white">{mold["FECHA ESPERADA"] ? new Date(mold["FECHA ESPERADA"]).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 space-y-6">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-red-500" /> Defectos a Reparar
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="px-3 py-1.5 bg-red-500/5 text-red-400 border border-red-500/10 rounded-xl leading-relaxed">
                            {mold["DEFECTOS A REPARAR"] || 'Sin defectos informados'}
                        </span>
                    </div>
                </div>

                <div className="p-5 bg-black/40 border border-white/5 rounded-3xl space-y-3">
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-gray-600" /> Observaciones Planta
                    </p>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed italic line-clamp-3">
                        "{mold.OBSERVACIONES || 'Sin observaciones registradas por el usuario.'}"
                    </p>
                </div>
            </div>

            {/* Footer / Meta */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                        <User className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Responsable</span>
                        <span className="text-[10px] font-bold text-gray-400">{mold.Usuario || 'Anónimo'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        {mold["Tipo de reparacion"]}
                    </span>
                </div>
            </div>

            {saving && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 transition-all">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            )}
        </div>
    )
}
