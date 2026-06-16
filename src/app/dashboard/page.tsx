// PV_MOLDES V2.4
'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Settings, Briefcase, Factory, TrendingUp, Server, Activity } from 'lucide-react'

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            window.location.href = '/login'
        }
        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-blue-500/30">
            <Navbar user={user} />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
                    <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
                        Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-extrabold">Control</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Bienvenido, <span className="text-slate-900 dark:text-white font-medium">{user?.Nombre || user?.NombreCompleto}</span>. Tienes acceso a la base de datos de moldes de la planta <span className="text-blue-400 font-bold uppercase">{user?.Planta || 'Principal'}</span>.
                    </p>
                </div>

                {/* Main Navigation Menu */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
                    <button
                        onClick={() => window.location.href = '/dashboard/molds'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-blue-500/5"
                    >
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Settings className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Histórico moldes</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/history'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-purple-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-purple-500/5"
                    >
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Registro moldes</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/raw-materials'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-green-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-green-500/5"
                    >
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                            <Factory className="w-6 h-6 text-green-500 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Consumo Materia Prima</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/indicators'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-red-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-red-500/5"
                    >
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-red-500 dark:text-red-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Indicador</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/indisponibilidad'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-violet-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-violet-500/5"
                    >
                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Índice de Indisponibilidad</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard/sap-items'}
                        className="p-6 glass-card rounded-2xl border border-black/5 dark:border-white/5 hover:border-orange-500/30 transition-all group flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-b hover:from-orange-500/5"
                    >
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                            <Server className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-white">Estado Molde SAP</span>
                    </button>
                </div>
            </div>
        </main>
    )
}
