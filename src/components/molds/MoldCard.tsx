'use client'

import { useState } from 'react'
import { Calendar, Tag, AlertCircle, MessageSquare, Save, Loader2, MoreVertical, Trash2 } from 'lucide-react'
import { MoldActive, moldsService } from '@/services/molds.service'

interface MoldCardProps {
    mold: MoldActive
    onUpdate: () => void
}

export default function MoldCard({ mold, onUpdate }: MoldCardProps) {
    const [comment, setComment] = useState(mold.comentario_seguimiento || '')
    const [saving, setSaving] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleSaveComment = async () => {
        setSaving(true)
        try {
            await moldsService.updateComment(mold.id!, comment)
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'En espera en moldes': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'En reparación': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'En espera en producción': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'Destruido': return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    return (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 group hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                        <Tag className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold leading-none mb-2">{mold.nombre}</h3>
                        <p className="text-sm text-gray-500 font-mono tracking-tighter">{mold.codigo}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(mold.estado)}`}>
                        {mold.estado}
                    </span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                        {mold.tipo_reparacion}
                    </span>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Ingreso
                    </p>
                    <p className="text-xs font-bold text-white">{new Date(mold.fecha_entrada).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" /> Entrega
                    </p>
                    <p className="text-xs font-bold text-white">{new Date(mold.fecha_entrega_esperada).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Defects */}
            <div className="mb-6 flex-1">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400" /> Defectos Registrados
                </p>
                <div className="flex flex-wrap gap-2">
                    {mold.defectos.map((d, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-500/5 text-red-500/70 border border-red-500/10 rounded-lg text-[10px] font-bold">
                            {d}
                        </span>
                    ))}
                    {mold.defectos.length === 0 && <span className="text-xs text-gray-600 italic">Sin defectos asignados</span>}
                </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" /> Comentario Seguimiento
                </p>
                <div className="relative">
                    <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-gray-300 placeholder:text-gray-700 min-h-[80px] outline-none focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                        placeholder="Agregar nota de seguimiento..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onBlur={handleSaveComment}
                    />
                    {saving && (
                        <div className="absolute right-3 bottom-3">
                            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
