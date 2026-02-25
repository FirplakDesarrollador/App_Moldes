'use client'

import { X, Calendar, User, Tag, Info, Ruler, AlertCircle } from 'lucide-react'

interface Mold {
    Nombre: string
    'CODIGO MOLDE': string
    'DEFECTOS A REPARAR'?: string
    'FECHA ENTRADA'?: string
    'FECHA ESPERADA'?: string
    'FECHA ENTREGA'?: string
    'ESTADO'?: string
    'OBSERVACIONES'?: string
    'Usuario'?: string
    'Recibido'?: string
    'Prioridad'?: string
    'H altura de pestaña'?: number
    'Created'?: string
    'Responsable'?: string
    'Tipo de reparacion'?: string
    'Tipo'?: string
    'ID'?: number
    espesor_pestana?: string
    espesor_bowl?: string
    espesor_fondo?: string
    espesor_parte_plana?: string
    espesor_angulos?: string
    espesor_radios?: string
    'Modified'?: string
    'Created By'?: string
    'Modified By'?: string
    [key: string]: any
}

interface MoldDetailsProps {
    mold: Mold
    onClose: () => void
}

export default function MoldDetails({ mold, onClose }: MoldDetailsProps) {
    interface SectionItem {
        label: string
        value: string | number | undefined
        icon?: any
        unit?: string
    }

    interface Section {
        title: string
        icon: any
        items: SectionItem[]
    }

    const sections: Section[] = [
        {
            title: 'Información General',
            icon: Info,
            items: [
                { label: 'Nombre', value: mold.Nombre, icon: Tag },
                { label: 'Código', value: mold['CODIGO MOLDE'], icon: Tag },
                { label: 'Tipo', value: mold.Tipo, icon: Package },
                { label: 'Estado', value: mold.ESTADO, icon: AlertCircle },
                { label: 'Prioridad', value: mold.Prioridad, icon: AlertCircle },
            ]
        },
        {
            title: 'Reparación y Fechas',
            icon: Calendar,
            items: [
                { label: 'Entrada', value: mold['FECHA ENTRADA'], icon: Calendar },
                { label: 'Esperada', value: mold['FECHA ESPERADA'], icon: Calendar },
                { label: 'Entrega', value: mold['FECHA ENTREGA'], icon: Calendar },
                { label: 'Defectos', value: mold['DEFECTOS A REPARAR'], icon: AlertCircle },
                { label: 'Responsable', value: mold.Responsable, icon: User },
            ]
        },
        {
            title: 'Dimensiones y Espesores',
            icon: Ruler,
            items: [
                { label: 'Altura Pestaña', value: mold['H altura de pestaña'], unit: 'mm' },
                { label: 'Espesor Pestaña', value: mold.espesor_pestana },
                { label: 'Espesor Bowl', value: mold.espesor_bowl },
                { label: 'Espesor Fondo', value: mold.espesor_fondo },
                { label: 'Espesor Plano', value: mold.espesor_parte_plana },
                { label: 'Espesor Ángulos', value: mold.espesor_angulos },
                { label: 'Espesor Radios', value: mold.espesor_radios },
            ]
        }
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <Package className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white leading-none">{mold.Nombre}</h2>
                            <p className="text-gray-500 mt-1">{mold['CODIGO MOLDE']}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-400 font-semibold uppercase tracking-wider text-xs">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </div>
                                <div className="space-y-3">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                            <div className="text-white font-medium flex items-center gap-2">
                                                {item.value || <span className="text-gray-700 italic text-sm">N/D</span>}
                                                {item.value && item.unit && <span className="text-xs text-gray-500">{item.unit}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Observations & System Info */}
                    <div className="space-y-6 pt-4">
                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <h3 className="text-sm font-semibold text-blue-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Observaciones y Notas
                            </h3>
                            <p className="text-gray-300 leading-relaxed italic">
                                {mold.OBSERVACIONES || "Sin observaciones adicionales registrados."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 px-2">
                            <div className="flex flex-col gap-1">
                                <span>Creado por: {mold['Created By'] || 'Admin'}</span>
                                <span>Fecha creación: {mold.Created}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:text-right">
                                <span>Modificado por: {mold['Modified By'] || 'Admin'}</span>
                                <span>Última modificación: {mold.Modified}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Package(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16.5 9.4 7.5 4.21" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
        </svg>
    )
}
