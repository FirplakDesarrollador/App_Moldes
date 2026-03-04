'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import MoldSearch from '@/components/molds/MoldSearch'
import MoldDetails from '@/components/molds/MoldDetails'
import Navbar from '@/components/layout/Navbar'
import { Settings, Briefcase, Factory, CheckCircle2, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
    const [selectedMold, setSelectedMold] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            window.location.href = '/login'
        }
        setLoading(false)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        window.location.href = '/login'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            <Navbar user={user} />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
                        <CheckCircle2 className="w-3 h-3" /> Sistema Activo — {user?.Empresa || 'Firplak'}
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-white leading-[1.1]">
                        Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-extrabold">Control</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Bienvenido, <span className="text-white font-medium">{user?.Nombre || user?.NombreCompleto}</span>. Tienes acceso a la base de datos de moldes de la planta <span className="text-blue-400 font-bold uppercase">{user?.Planta || 'Principal'}</span>.
                    </p>
                </div>

                {/* Main Navigation Menu */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
                    <button
                        onClick={() => window.location.href = '/dashboard/molds'}
                        className="p-6 glass-card rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-blue-500/5"
                    >
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Settings className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Moldes</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/history'}
                        className="p-6 glass-card rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-purple-500/5"
                    >
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Histórico Moldes</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/raw-materials'}
                        className="p-6 glass-card rounded-2xl border border-white/5 hover:border-green-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-green-500/5"
                    >
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                            <Factory className="w-6 h-6 text-green-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Consumo Materia Prima</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/audit'}
                        className="p-6 glass-card rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-yellow-500/5"
                    >
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Auditoría</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/indicators'}
                        className="p-6 glass-card rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-red-500/5"
                    >
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-red-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Indicador</span>
                    </button>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6 px-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <h2 className="text-xl font-bold">Buscador Rápido</h2>
                    </div>
                    <MoldSearch onSelect={(mold) => setSelectedMold(mold)} />
                </div>
            </div>

            {selectedMold && (
                <MoldDetails
                    mold={selectedMold}
                    onClose={() => setSelectedMold(null)}
                />
            )}
        </main>
    )
}
