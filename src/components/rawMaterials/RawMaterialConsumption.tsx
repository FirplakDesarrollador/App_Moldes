'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { rawMaterialsService, RawMaterial, ConsumptionRecord } from '@/services/rawMaterials.service'
import { Package, Search, Loader2, Save, AlertCircle, CheckCircle2, Factory } from 'lucide-react'

export default function RawMaterialConsumption() {
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Selection results for Molds
    const [moldSearchQuery, setMoldSearchQuery] = useState('')
    const [moldResults, setMoldResults] = useState<any[]>([])
    const [searchingMolds, setSearchingMolds] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        sapNumber: '',
        materiaPrima: '',
        unidad: '',
        tipo: '',
        concepto: '',
        moldeId: null as string | number | null,
        moldeNombre: '',
        observaciones: ''
    })

    const supabase = createClient()

    useEffect(() => {
        loadRawMaterials()
    }, [])

    const loadRawMaterials = async () => {
        setLoading(true)
        const data = await rawMaterialsService.getRawMaterials()
        setRawMaterials(data)
        setLoading(false)
    }

    // Handle Materia Prima Selection
    const handleMateriaPrimaChange = (materiaName: string) => {
        const material = rawMaterials.find(m => m["Materia Prima"] === materiaName)
        if (material) {
            setFormData({
                ...formData,
                materiaPrima: materiaName,
                sapNumber: material["Número de artículo SAP"],
                unidad: material["Unidad de medida de compras"]
            })
        } else {
            setFormData({ ...formData, materiaPrima: '', sapNumber: '', unidad: '' })
        }
    }

    // Search Molds for Molde Asociado
    useEffect(() => {
        const searchMolds = async () => {
            if (moldSearchQuery.length < 2) {
                setMoldResults([])
                return
            }
            setSearchingMolds(true)
            const { data } = await supabase
                .from('base_datos_moldes')
                .select('ID, Nombre, "CODIGO MOLDE"')
                .or(`Nombre.ilike.%${moldSearchQuery}%, "CODIGO MOLDE".ilike.%${moldSearchQuery}%`)
                .limit(5)
            setMoldResults(data || [])
            setSearchingMolds(false)
        }
        const timer = setTimeout(searchMolds, 300)
        return () => clearTimeout(timer)
    }, [moldSearchQuery])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const storedUser = localStorage.getItem('moldapp_user')
            const user = storedUser ? JSON.parse(storedUser) : null

            const record: ConsumptionRecord = {
                materia_prima_id: formData.sapNumber,
                materia_prima_nombre: formData.materiaPrima,
                materia_prima_codigo: formData.sapNumber,
                unidad: formData.unidad,
                tipo: formData.tipo as any,
                concepto: formData.concepto as any,
                molde_asociado_id: (formData.concepto === 'Molde nuevo' || formData.concepto === 'Reparación') ? formData.moldeId : null,
                observaciones: formData.observaciones,
                created_by: user?.Nombre || 'Usuario'
            }

            await rawMaterialsService.saveConsumption(record)

            setMessage({ type: 'success', text: 'Registro guardado exitosamente.' })
            setFormData({
                sapNumber: '',
                materiaPrima: '',
                unidad: '',
                tipo: '',
                concepto: '',
                moldeId: null,
                moldeNombre: '',
                observaciones: ''
            })
            setMoldSearchQuery('')
        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: 'Error al guardar: ' + (error.message || 'Error desconocido') })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 animate-pulse text-sm">Cargando inventario...</p>
            </div>
        )
    }

    const showMoldField = formData.concepto === 'Molde nuevo' || formData.concepto === 'Reparación'

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                    <Factory className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">
                        Consumo de <span className="text-green-500">Materia Prima</span>
                    </h1>
                    <p className="text-gray-500 text-sm italic">Registro de movimientos y salidas de almacén.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="p-8 glass-card rounded-[2.5rem] border border-white/5 space-y-8">
                {/* FILA 1: Materia Prima | Código | Unidades */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Materia Prima</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all appearance-none"
                            value={formData.materiaPrima}
                            onChange={(e) => handleMateriaPrimaChange(e.target.value)}
                            required
                        >
                            <option value="">Selecciona materia prima...</option>
                            {rawMaterials.map((mat, i) => (
                                <option key={i} value={mat["Materia Prima"]}>{mat["Materia Prima"]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Código SAP</label>
                        <div className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-gray-400 font-mono text-sm min-h-[50px] flex items-center">
                            {formData.sapNumber || 'Automático'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Unidades</label>
                        <div className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-gray-400 text-sm min-h-[50px] flex items-center">
                            {formData.unidad || 'Unidad de medida'}
                        </div>
                    </div>
                </div>

                {/* FILA 2: Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Movimiento</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all appearance-none"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            required
                        >
                            <option value="">Selecciona tipo...</option>
                            <option value="Entradas">Entradas</option>
                            <option value="Salidas">Salidas</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Solicitud de traslado">Solicitud de traslado</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Concepto</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all appearance-none"
                            value={formData.concepto}
                            onChange={(e) => {
                                const newConcept = e.target.value
                                setFormData({
                                    ...formData,
                                    concepto: newConcept,
                                    moldeId: (newConcept === 'Molde nuevo' || newConcept === 'Reparación') ? formData.moldeId : null
                                })
                            }}
                            required
                        >
                            <option value="">Selecciona concepto...</option>
                            <option value="Ajuste de inventario">Ajuste de inventario</option>
                            <option value="Abastecimiento">Abastecimiento</option>
                            <option value="Molde nuevo">Molde nuevo</option>
                            <option value="Reparación">Reparación</option>
                        </select>
                    </div>
                </div>

                {/* FILA 3: Molde Asociado (Conditional) */}
                {showMoldField && (
                    <div className="space-y-2 relative animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-400" />
                            Molde Asociado
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Escribe nombre o código del molde..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={formData.moldeNombre || moldSearchQuery}
                                onChange={(e) => {
                                    setMoldSearchQuery(e.target.value)
                                    setFormData({ ...formData, moldeId: null, moldeNombre: '' })
                                }}
                                required={showMoldField}
                            />
                            {searchingMolds && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
                        </div>
                        {moldResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                {moldResults.map((m, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setFormData({ ...formData, moldeId: m.ID, moldeNombre: `${m.Nombre} [${m['CODIGO MOLDE']}]` })
                                            setMoldResults([])
                                            setMoldSearchQuery('')
                                        }}
                                        className="p-4 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 last:border-0"
                                    >
                                        <p className="text-sm font-bold text-white">{m.Nombre}</p>
                                        <p className="text-xs text-gray-500">{m['CODIGO MOLDE']}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {formData.moldeId && (
                            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg w-fit">
                                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-tight">Vinculado: {formData.moldeNombre}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Observaciones */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Observaciones</label>
                    <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all min-h-[120px] resize-none"
                        placeholder="Detalles adicionales del movimiento..."
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Registro</>}
                </button>
            </form>
        </div>
    )
}
