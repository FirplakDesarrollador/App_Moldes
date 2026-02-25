'use client'

import { ArrowLeft, Settings, MapPin, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import MoldsModule from '@/components/molds/MoldsModule'

export default function MoldsPage() {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            window.location.href = '/login'
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        window.location.href = '/login'
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            {/* Header / Nav */}
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-sm font-black tracking-tight leading-none uppercase">Módulo Moldes</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Gestión Activa</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-white leading-none mb-1">{user?.Nombre || 'Usuario'}</span>
                            <span className="text-[10px] text-gray-400 uppercase flex items-center gap-1 font-bold">
                                Firmado como <span className="text-blue-500">{user?.Cedula}</span>
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold border border-red-500/20 transition-all font-mono"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Salir
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <MoldsModule />
            </div>

            {/* Footer Placeholders for other modules */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="border-t border-white/5 pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40 grayscale">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                            <h4 className="font-bold mb-2">Histórico</h4>
                            <p className="text-xs text-gray-500">Módulo de trazabilidad y moldes cerrados.</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                            <h4 className="font-bold mb-2">Consumo</h4>
                            <p className="text-xs text-gray-500">Gestión de resinas, fibras y materiales.</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                            <h4 className="font-bold mb-2">Auditoría</h4>
                            <p className="text-xs text-gray-500">Puntos de control y calidad final.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
