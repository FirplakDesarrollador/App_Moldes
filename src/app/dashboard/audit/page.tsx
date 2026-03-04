'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, TrendingUp, Activity, CheckCircle2, ChevronDown, Save, Loader2, Search, X, MessageSquare, AlertCircle, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { auditService, AuditData } from '@/services/audit.service'
import Navbar from '@/components/layout/Navbar'

// Definición de las secciones y preguntas solicitadas
const AUDIT_SYSTEM = [
    {
        titulo: 'ENCERADO / PRENSADO',
        preguntas: [
            { id: 'tablet', label: 'P1. ¿Se enceró correctamente el molde cuando se notifica en la tablet?', roleFilter: ['Administrador de programacion MS', 'Moldeador'] },
            { id: 'encerado', label: 'P2. ¿Se enceraron correctamente las pestañas y el mamonete? ¿Y el molde a pintar está sin defectos?', roleFilter: ['Encerador de moldes MS', 'Encerador de CM MS', 'Encerador de moldes FV', 'Encerador de moldes RTM'] },
            { id: 'prensado', label: 'P3. ¿El operario prensa correctamente sobre las platinas y en simultáneo?', roleFilter: ['Prensador A', 'Prensador B'], hasComment: 'comentario_prensado', commentPlaceholder: 'Comentarios Prensado (textarea)...' },
        ]
    },
    {
        titulo: 'MANEJO DE CONTRAMOLDES',
        preguntas: [
            { id: 'recuperador', label: 'P4. ¿El operario retira correctamente la masa del contramolde y el planche dejándolo limpio?', roleFilter: ['Recogedor de mezcla'] },
            { id: 'despinzado', label: 'P5. ¿El operario cuida las pestañas del molde al quitar la rebaba?', roleFilter: ['Desprensador A', 'Desprensador B'] },
            { id: 'desprensado_2', label: 'P6. ¿El operario maneja bien el contramolde sin golpearlo en el piso, limpiándolo y guardándolo adecuadamente?', roleFilter: ['Desprensador A', 'Desprensador B'], hasComment: 'comentario_contramolde', commentPlaceholder: 'Comentarios Manejo de Contramolde (textarea)...' },
        ]
    },
    {
        titulo: 'DESMOLDE',
        preguntas: [
            { id: 'desmolde', label: 'P7. ¿El operario desmolda correctamente cumpliendo el estándar sin maltratar el molde?', roleFilter: ['Desmoldador MS', 'Desmoldador FV', 'Desmoldador RTM'], hasComment: 'comentario_desmolde', commentPlaceholder: 'Comentarios Desmolde (textarea)...' },
        ]
    },
    {
        titulo: 'ADICIONAL (Retorno de molde)',
        preguntas: [
            { id: 'retorno', label: 'P8. ¿El operario manipula adecuadamente el molde sin tocar la parte interior y marcándolo con cinta en caso de que el desmolde no sea fácil?', roleFilter: ['Moldeador', 'Desmoldador MS'] },
        ]
    }
]

const ALL_QUESTIONS = AUDIT_SYSTEM.flatMap(s => s.preguntas);

export default function AuditPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [allPersonnel, setAllPersonnel] = useState<any[]>([])
    const [fallbackPersonnel, setFallbackPersonnel] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)

    // Form state
    const [auditState, setAuditState] = useState<Record<string, { ok: boolean, op_id: string, touched: boolean }>>({})
    const [comments, setComments] = useState<Record<string, string>>({
        comentario_prensado: '',
        comentario_contramolde: '',
        comentario_desmolde: ''
    })

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
            let personnelData = await auditService.getPersonnel()

            if (!personnelData || personnelData.length === 0) {
                const { data } = await supabase.from('Personal app moldes').select('Nombre, Cedula')
                if (data && data.length > 0) {
                    personnelData = data.map(d => ({ ...d, NombreCompleto: d.Nombre, ID: d.Cedula }))
                    setFallbackPersonnel(true)
                }
            }

            setAllPersonnel(personnelData || [])

            const initialState: any = {}
            ALL_QUESTIONS.forEach(q => {
                initialState[q.id] = { ok: false, op_id: '', touched: false }
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
            .from('Base_datos_moldes_dinámica')
            .select('*')
            .or(`Título.ilike.%${query}%, "CODIGO MOLDE".ilike.%${query}%`)
            .limit(5)

        const unique = (data || []).reduce((acc: any[], current: any) => {
            const code = current["CODIGO MOLDE"]
            if (!acc.find(item => item["CODIGO MOLDE"] === code)) acc.push(current)
            return acc
        }, [])

        setMoldResults(unique)
        setSearchingMolds(false)
    }

    const handleSave = async () => {
        if (!selectedMold) {
            setMessage({ type: 'warning', text: 'Selecciona un molde antes de guardar.' })
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        const incomplete = ALL_QUESTIONS.filter(q => {
            const state = auditState[q.id]
            return !state.touched || !state.op_id
        })

        if (incomplete.length > 0) {
            setMessage({ type: 'error', text: `Faltan ${incomplete.length} preguntas por responder o asignar operario.` })
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            const auditData: AuditData = {
                auditor_id: user.Cedula,
                auditor_nombre: user.Nombre || user.NombreCompleto,
                id_molde: selectedMold["CODIGO MOLDE"],
                tablet_ok: auditState.tablet.ok,
                tablet_op_id: auditState.tablet.op_id,
                encerado_ok: auditState.encerado.ok,
                encerado_op_id: auditState.encerado.op_id,
                prensado_ok: auditState.prensado.ok,
                prensado_op_id: auditState.prensado.op_id,
                comentario_prensado: comments.comentario_prensado,
                recuperador_ok: auditState.recuperador.ok,
                recuperador_op_id: auditState.recuperador.op_id,
                despinzado_ok: auditState.despinzado.ok,
                despinzado_op_id: auditState.despinzado.op_id,
                desprensado_2_ok: auditState.desprensado_2.ok,
                desprensado_2_op_id: auditState.desprensado_2.op_id,
                comentario_contramolde: comments.comentario_contramolde,
                desmolde_ok: auditState.desmolde.ok,
                desmolde_op_id: auditState.desmolde.op_id,
                comentario_desmolde: comments.comentario_desmolde,
                retorno_molde_ok: auditState.retorno.ok,
                retorno_molde_op_id: auditState.retorno.op_id,
            }

            await auditService.saveAudit(auditData)
            setMessage({ type: 'success', text: 'Auditoría registrada exitosamente.' })
            window.scrollTo({ top: 0, behavior: 'smooth' })

            setComments({ comentario_prensado: '', comentario_contramolde: '', comentario_desmolde: '' })
            const resetState: any = {}
            ALL_QUESTIONS.forEach(q => resetState[q.id] = { ok: false, op_id: '', touched: false })
            setAuditState(resetState)
            setSelectedMold(null)
            setMoldSearchQuery('')
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error: ' + (error.message || 'Error al guardar') })
        } finally {
            setSaving(false)
        }
    }

    const getFilteredPersonnel = (roleFilters: string[]) => {
        if (!allPersonnel || allPersonnel.length === 0) return []
        if (!roleFilters || roleFilters.length === 0 || fallbackPersonnel) return allPersonnel

        const filtered = allPersonnel.filter(p => {
            return roleFilters.some(role => {
                const val = (p[role] || '').toString().toLowerCase().trim()
                return val === 'sí' || val === 'si' || val === 'yes' || val === 's'
            })
        })
        return filtered.length > 0 ? filtered : allPersonnel
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar user={user} showBackButton backPath="/dashboard" title="Auditoría" subtitle="PV_MOLDES V2.1" />

            <main className="pt-32 pb-28 px-4 max-w-6xl mx-auto">
                <div className="space-y-8">

                    {/* Status Message */}
                    {message && (
                        <div className={`p-6 rounded-[2rem] flex items-center gap-4 border animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-600/10 border-green-500/20 text-green-400' :
                                message.type === 'error' ? 'bg-red-600/10 border-red-500/20 text-red-400' :
                                    'bg-orange-600/10 border-orange-500/20 text-orange-400'
                            }`}>
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="font-bold">{message.text}</p>
                        </div>
                    )}

                    {/* Header Auditor Info */}
                    <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-[1.5rem] flex items-center justify-center border border-blue-500/30">
                                <UserCheck className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">Sesión de Auditoría Activa</h3>
                                <p className="text-2xl font-black text-white uppercase tracking-tight">AUDITOR: {user?.Nombre || user?.NombreCompleto}</p>
                            </div>
                        </div>
                        <div className="bg-white/2 px-8 py-4 rounded-3xl border border-white/5 text-right">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1">Base de Datos Personal</p>
                            <p className="text-sm font-mono text-blue-400">({allPersonnel.length} operarios en línea)</p>
                        </div>
                    </div>

                    {/* Search Mold Section */}
                    <div className="p-10 glass-card rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none group-hover:bg-blue-600/10 transition-all duration-1000" />

                        <div className="space-y-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <Search className="w-5 h-5 text-blue-500" />
                                </div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Identificación del Molde</label>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ingrese nombre o código del molde para buscar..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-6 px-10 text-xl font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
                                    value={selectedMold ? `${selectedMold.Título} [${selectedMold['CODIGO MOLDE']}]` : moldSearchQuery}
                                    onChange={(e) => {
                                        setMoldSearchQuery(e.target.value)
                                        setSelectedMold(null)
                                        searchMolds(e.target.value)
                                    }}
                                />
                                {selectedMold && (
                                    <button
                                        onClick={() => { setSelectedMold(null); setMoldSearchQuery(''); setMoldResults([]) }}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {moldResults.length > 0 && !selectedMold && (
                                <div className="absolute z-50 w-full mt-4 bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                                    {moldResults.map((m, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { setSelectedMold(m); setMoldResults([]) }}
                                            className="p-6 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 flex justify-between items-center transition-colors"
                                        >
                                            <span className="text-base font-black uppercase text-gray-300">{m.Título}</span>
                                            <span className="text-[11px] font-mono text-blue-500/50 bg-blue-500/5 px-3 py-1 rounded-full">{m['CODIGO MOLDE']}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audit Form Sections */}
                    <div className="space-y-16 mt-12">
                        {AUDIT_SYSTEM.map((section, sIndex) => (
                            <div key={sIndex} className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${sIndex * 150}ms` }}>
                                <div className="flex items-center gap-6">
                                    <div className="h-[2px] w-12 bg-blue-600/50 rounded-full" />
                                    <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.8em]">{section.titulo}</h2>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>

                                <div className="space-y-4">
                                    {section.preguntas.map((q) => {
                                        const qState = auditState[q.id] || { ok: false, op_id: '', touched: false };
                                        const filteredPersonnel = getFilteredPersonnel(q.roleFilter);

                                        return (
                                            <div key={q.id} className="space-y-4">
                                                {/* Card Row */}
                                                <div className="flex flex-col lg:flex-row items-stretch gap-1 glass-card rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all duration-500 relative group/row overflow-hidden">

                                                    {/* Q Text (45%) */}
                                                    <div className="lg:w-[45%] p-8 lg:p-10 lg:border-r border-white/5 flex flex-col justify-center bg-white/[0.01]">
                                                        <div className="flex items-center gap-3 mb-2 opacity-50">
                                                            <ClipboardList className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Requisito de Auditoría</span>
                                                        </div>
                                                        <p className="text-base font-bold text-white group-hover/row:text-blue-400 transition-colors leading-relaxed">{q.label}</p>
                                                    </div>

                                                    {/* Selector Sí/No (20%) */}
                                                    <div className="lg:w-[20%] p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.02]">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">¿Se cumple actualmente?</span>
                                                        <button
                                                            onClick={() => setAuditState({
                                                                ...auditState,
                                                                [q.id]: { ...qState, ok: !qState.ok, touched: true }
                                                            })}
                                                            className={`relative w-36 h-16 rounded-[1.25rem] p-1 transition-all duration-700 ${!qState.touched ? 'bg-white/5 border border-white/10' :
                                                                    qState.ok ? 'bg-green-600 shadow-[0_0_30px_rgba(22,163,74,0.3)]' : 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.25)]'
                                                                }`}
                                                        >
                                                            <div className={`absolute top-1 bottom-1 w-[42%] flex items-center justify-center rounded-[1rem] bg-white transition-all duration-500 shadow-2xl ${!qState.touched ? 'left-[29%]' : qState.ok ? 'right-1' : 'left-1'
                                                                }`}>
                                                                {!qState.touched ? <Activity className="w-6 h-6 text-gray-400 animate-pulse" /> :
                                                                    qState.ok ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <X className="w-6 h-6 text-red-600" />}
                                                            </div>
                                                            {qState.touched && (
                                                                <span className={`absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] pointer-events-none ${qState.ok ? 'pr-16 text-white' : 'pl-16 text-white'}`}>
                                                                    {qState.ok ? 'SÍ' : 'NO'}
                                                                </span>
                                                            )}
                                                            {!qState.touched && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/20 animate-pulse uppercase tracking-tighter">SIN MARCAR</span>}
                                                        </button>
                                                    </div>

                                                    {/* Dropdown (35%) */}
                                                    <div className="lg:w-[35%] p-8 lg:p-10 space-y-3 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <TrendingUp className="w-3 h-3 text-blue-500" />
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Ejecutor Responsable del Proceso</span>
                                                        </div>
                                                        <div className="relative">
                                                            <select
                                                                className={`w-full bg-black/60 border ${qState.op_id ? 'border-blue-500/40 text-blue-400' : 'border-white/10 text-gray-500'} rounded-[1.25rem] py-4 px-6 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer uppercase`}
                                                                value={qState.op_id}
                                                                onChange={(e) => setAuditState({
                                                                    ...auditState,
                                                                    [q.id]: { ...qState, op_id: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">-- SELECCIONAR OPERARIO --</option>
                                                                {filteredPersonnel.map((p: any) => (
                                                                    <option key={p.ID || p.Cedula} value={p.ID || p.Cedula} className="bg-[#0f0f0f] text-white py-2">
                                                                        {p.NombreCompleto || p.Nombre} {p.Area ? `| ${p.Area}` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section Comments */}
                                                {q.hasComment && (
                                                    <div className="mx-12 animate-in slide-in-from-top-4">
                                                        <div className="relative group/txt">
                                                            <MessageSquare className="absolute left-6 top-6 w-5 h-5 text-blue-500/30 group-focus-within/txt:text-blue-500 transition-all" />
                                                            <textarea
                                                                className="w-full bg-blue-600/5 border border-white/5 rounded-[2.5rem] p-7 pl-14 text-sm font-medium min-h-[110px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-800"
                                                                placeholder={q.commentPlaceholder}
                                                                value={comments[q.hasComment] || ''}
                                                                onChange={(e) => setComments({ ...comments, [q.hasComment]: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-16 pb-24 border-t border-white/5 space-y-8">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full relative group overflow-hidden ${saving ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-50 text-white font-black py-10 rounded-[4rem] transition-all flex items-center justify-center gap-6 shadow-[0_40px_100px_rgba(37,99,235,0.4)] active:scale-[0.99]`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            {saving ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-8 h-8 group-hover:scale-125 transition-all duration-500" />
                                    <span className="uppercase tracking-[0.6em] text-lg font-black">REGISTRAR AUDITORÍA FINAL</span>
                                </>
                            )}
                        </button>

                        {!selectedMold && (
                            <div className="flex items-center justify-center gap-3 py-4 bg-red-600/5 border border-red-500/10 rounded-3xl">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">⚠️ Es obligatorio seleccionar un molde para poder guardar el registro</span>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                }
                select {
                    -webkit-appearance: none;
                }
            `}</style>
        </div>
    )
}
