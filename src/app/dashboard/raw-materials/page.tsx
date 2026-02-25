'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, LogOut, Package, ClipboardList, TrendingUp, Settings, Activity } from 'lucide-react'
import RawMaterialConsumption from '@/components/rawMaterials/RawMaterialConsumption'

export default function RawMaterialsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium text-sm">Volver al Panel</span>
                        </button>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                <Settings className="w-4 h-4 text-blue-500 animate-spin-slow" />
                            </div>
                            <span className="font-black tracking-tighter text-xl">MoldApp</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <User className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Operador</span>
                                <span className="text-xs font-bold text-white leading-none">{user?.Nombre || 'Usuario'}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all group"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <RawMaterialConsumption />
                </div>
            </main>

            {/* Bottom Floating Navigation (Placeholders) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50">
                <button
                    onClick={() => router.push('/dashboard/molds')}
                    className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs"
                >
                    <Package className="w-4 h-4" /> Moldes
                </button>
                <div className="px-6 py-3 bg-white/10 text-white rounded-2xl transition-all font-black text-xs flex items-center gap-2 shadow-lg shadow-white/5">
                    <TrendingUp className="w-4 h-4 text-green-400" /> Consumo
                </div>
                <button className="flex items-center gap-2 px-6 py-3 text-gray-400/50 cursor-not-allowed rounded-2xl transition-all font-bold text-xs">
                    <ClipboardList className="w-4 h-4" /> Histórico
                </button>
                <button className="flex items-center gap-2 px-6 py-3 text-gray-400/50 cursor-not-allowed rounded-2xl transition-all font-bold text-xs">
                    <Activity className="w-4 h-4" /> Auditoría
                </button>
            </div>
        </div>
    )
}
