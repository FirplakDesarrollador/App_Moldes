'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, LogOut, Package, ClipboardList, TrendingUp, Settings, Activity, CheckCircle2, ChevronDown, Save, Loader2, Search, X, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { auditService, AuditRecord } from '@/services/audit.service'

const AUDIT_QUESTIONS = [
    {
        id: 'ENC_01',
        seccion: 'Encerado',
        pregunta: '¿Se enceró correctamente el molde cuando se notifica la tablet?',
        responsableTitle: 'Operario Tablet'
    },
    {
        id: 'ENC_02',
        seccion: 'Encerado',
        pregunta: '¿Se enceraron correctamente las pestañas, el mamonete y el molde a pintar está sin defectos?',
        responsableTitle: 'Operario Encerado'
    },
    {
        id: 'PRE_01',
        seccion: 'Prensado',
        pregunta: '¿El operario prensa correctamente sobre las platinas y en simultáneo?',
        responsableTitle: 'Operario Prensado',
        hasGeneralComment: true,
        commentLabel: 'Comentarios Prensado'
    },
    {
        id: 'REC_01',
        seccion: 'Recogida de mezcla',
        pregunta: '¿El operario retira correctamente la masa del contramolde y el flanche dejándolo limpio?',
        responsableTitle: 'Operario Recogedor Mezcla'
    },
    {
        id: 'DES_01',
        seccion: 'Desprensado',
        pregunta: '¿El operario cuida las pestañas del molde al quitar la rebaba?',
        responsableTitle: 'Operario Desprensado'
    },
    {
        id: 'DES_02',
        seccion: 'Desprensado',
        pregunta: '¿El operario maneja bien el contramolde sin golpearlo, limpiándolo y guardándolo adecuadamente?',
        responsableTitle: 'Operario Desprensado 2',
        hasGeneralComment: true,
        commentLabel: 'Manejo de Contramolde'
    },
    {
        id: 'DESM_01',
        seccion: 'Desmolde',
        pregunta: '¿El operario desmolda correctamente, cumpliendo el estándar y sin maltratar el molde?',
        responsableTitle: 'Operario Desmolde',
        hasGeneralComment: true,
        commentLabel: 'Comentarios Desmolde'
    },
    {
        id: 'DESM_02',
        seccion: 'Desmolde',
        pregunta: '¿El operario manipula adecuadamente el molde sin tocar la parte interior y lo marca con cinta si el desmolde no es fácil?',
        responsableTitle: 'Operario Retorno Molde'
    }
]

export default function AuditPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [personnel, setPersonnel] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form state
    const [auditState, setAuditState] = useState<Record<string, { ejecutado: boolean, responsable: string, comentario: string }>>({})
    const [selectedMold, setSelectedMold] = useState<any>(null)
    const [moldSearchQuery, setMoldSearchQuery] = useState('')
    const [moldResults, setMoldResults] = useState<any[]>([])
    const [searchingMolds, setSearchingMolds] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
        loadData()
    }, [router])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await auditService.getPersonnel()
            setPersonnel(data)

            // Initialize audit state
            const initialState: any = {}
            AUDIT_QUESTIONS.forEach(q => {
                initialState[q.id] = { ejecutado: false, responsable: '', comentario: '' }
            })
            setAuditState(initialState)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const searchMolds = async (query: string) => {
        if (query.length < 2) {
            setMoldResults([])
            return
        }
        setSearchingMolds(true)
        const { data } = await supabase
            .from('base_datos_moldes')
            .select('ID, Nombre, "CODIGO MOLDE"')
            .or(`Nombre.ilike.%${query}%, "CODIGO MOLDE".ilike.%${query}%`)
            .limit(5)
        setMoldResults(data || [])
        setSearchingMolds(false)
    }

    const handleSave = async () => {
        if (!selectedMold) {
            setMessage({ type: 'error', text: 'Debes seleccionar un molde primero.' })
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            const records: AuditRecord[] = AUDIT_QUESTIONS.map(q => ({
                id_molde: selectedMold.ID.toString(),
                fecha: new Date().toISOString().split('T')[0],
                pregunta_id: q.id,
                seccion: q.seccion,
                pregunta: q.pregunta,
                ejecutado: auditState[q.id].ejecutado,
                responsable_id: auditState[q.id].responsable,
                responsable_nombre: personnel.find(p => p.Cedula.toString() === auditState[q.id].responsable)?.Nombre || '',
                comentario: auditState[q.id].comentario,
                usuario_registro: user.Nombre
            }))

            await auditService.saveAuditBatch(records)
            setMessage({ type: 'success', text: 'Auditoría guardada exitosamente.' })
            // Reset
            loadData()
            setSelectedMold(null)
            setMoldSearchQuery('')
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al guardar auditoría: ' + error.message })
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        router.push('/login')
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium text-sm">Volver al Panel</span>
                        </button>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="font-black tracking-tighter text-xl">MoldApp <span className="text-blue-500">Audit</span></span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <div className="space-y-8">
                    {/* Header: Select Mold */}
                    <div className="p-8 glass-card rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Seleccionar Molde para Auditoría</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nombre o código del molde..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    value={selectedMold ? `${selectedMold.Nombre} [${selectedMold['CODIGO MOLDE']}]` : moldSearchQuery}
                                    onChange={(e) => {
                                        setMoldSearchQuery(e.target.value)
                                        setSelectedMold(null)
                                        searchMolds(e.target.value)
                                    }}
                                />
                                {selectedMold && (
                                    <button onClick={() => { setSelectedMold(null); setMoldSearchQuery('') }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                            {moldResults.length > 0 && !selectedMold && (
                                <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {moldResults.map((m, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { setSelectedMold(m); setMoldResults([]) }}
                                            className="p-4 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 last:border-0"
                                        >
                                            <p className="text-sm font-bold">{m.Nombre}</p>
                                            <p className="text-xs text-gray-500">{m['CODIGO MOLDE']}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-6">
                        {AUDIT_QUESTIONS.reduce((acc: any[], q) => {
                            const lastSection = acc[acc.length - 1]
                            if (!lastSection || lastSection.title !== q.seccion) {
                                acc.push({ title: q.seccion, questions: [q] })
                            } else {
                                lastSection.questions.push(q)
                            }
                            return acc
                        }, []).map((section, si) => (
                            <div key={si} className="space-y-4">
                                <div className="flex items-center gap-3 px-4">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">{section.title}</h3>
                                </div>
                                <div className="space-y-4">
                                    {section.questions.map((q: any) => (
                                        <div key={q.id} className="p-6 glass-card rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm font-medium leading-relaxed">{q.pregunta}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{q.responsableTitle}:</span>
                                                    <select
                                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none hover:bg-white/10 transition-colors"
                                                        value={auditState[q.id]?.responsable}
                                                        onChange={(e) => setAuditState({ ...auditState, [q.id]: { ...auditState[q.id], responsable: e.target.value } })}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {personnel.map((p, pi) => (
                                                            <option key={pi} value={p.Cedula}>{p.Nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <button
                                                    onClick={() => setAuditState({ ...auditState, [q.id]: { ...auditState[q.id], ejecutado: !auditState[q.id].ejecutado } })}
                                                    className={`relative w-24 h-10 rounded-full p-1 transition-all duration-300 ${auditState[q.id].ejecutado ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}
                                                >
                                                    <div className={`absolute top-1 bottom-1 w-8 flex items-center justify-center rounded-full transition-all duration-300 ${auditState[q.id].ejecutado ? 'right-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'left-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
                                                        {auditState[q.id].ejecutado ? <CheckCircle2 className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <span className={`absolute left-0 right-0 top-0 bottom-0 text-[10px] font-black uppercase tracking-tighter flex items-center justify-center pointer-events-none ${auditState[q.id].ejecutado ? 'mr-8 text-green-400' : 'ml-8 text-red-100'}`}>
                                                        {auditState[q.id].ejecutado ? 'SÍ' : 'NO'}
                                                    </span>
                                                </button>

                                                <div className="relative group/comment">
                                                    <button className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover/comment:opacity-100 transition-opacity z-10 pointer-events-none group-focus-within/comment:opacity-100 group-focus-within/comment:pointer-events-auto">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{q.commentLabel || 'Observaciones'}</label>
                                                        <textarea
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs h-20 outline-none focus:ring-1 focus:ring-blue-500/50"
                                                            placeholder="Escribe aquí..."
                                                            value={auditState[q.id].comentario}
                                                            onChange={(e) => setAuditState({ ...auditState, [q.id]: { ...auditState[q.id], comentario: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {message && (
                        <div className={`p-4 rounded-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedMold}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 uppercase tracking-[0.2em] text-sm"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Auditoría
                    </button>
                </div>
            </main>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50">
                <button onClick={() => router.push('/dashboard/molds')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <Package className="w-4 h-4" /> Moldes
                </button>
                <button onClick={() => router.push('/dashboard/raw-materials')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <TrendingUp className="w-4 h-4" /> Consumo
                </button>
                <button onClick={() => router.push('/dashboard/history')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <ClipboardList className="w-4 h-4" /> Histórico
                </button>
                <div className="px-6 py-3 bg-white/10 text-white rounded-2xl transition-all font-black text-xs flex items-center gap-2 shadow-lg shadow-white/5">
                    <Activity className="w-4 h-4 text-blue-400" /> Auditoría
                </div>
            </div>
        </div>
    )
}
