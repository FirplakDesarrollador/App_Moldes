'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import MoldSearch from '@/components/molds/MoldSearch'
import MoldDetails from '@/components/molds/MoldDetails'
import { LogOut, Settings, User, MapPin, Briefcase, Factory, CheckCircle2 } from 'lucide-react'

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
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter leading-none">MoldApp</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Firplak S.A.</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-white leading-none mb-1">{user?.Nombre || user?.NombreCompleto}</span>
                            <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-500" /> {user?.Planta || 'Sin Planta'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold border border-red-500/20 transition-all"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
                        <CheckCircle2 className="w-3 h-3" /> Sistema Activo — {user?.Empresa || 'Firplak'}
                    </div>
                    <h1 className="text-6xl font-black tracking-tight text-white leading-[1.1]">
                        Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Gestión</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Bienvenido, <span className="text-white font-medium">{user?.Nombre || user?.NombreCompleto}</span>. Tienes acceso a la base de datos de moldes de la planta <span className="text-blue-400 font-bold uppercase">{user?.Planta || 'Principal'}</span>.
                    </p>
                </div>

                <div className="relative z-10 mb-20">
                    <MoldSearch onSelect={(mold) => setSelectedMold(mold)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="p-10 glass-card rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Cargo</h3>
                        <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tighter">
                            {user?.['Puesta activo'] || 'Operario'}
                        </p>
                    </div>

                    <div className="p-10 glass-card rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <Factory className="w-7 h-7 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Área</h3>
                        <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tighter">
                            {user?.Area || 'Planta'}
                        </p>
                    </div>

                    <div className="p-10 glass-card rounded-[2.5rem] border border-white/5 hover:border-green-500/30 transition-all group relative overflow-hidden">
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-8 border border-green-500/20 group-hover:scale-110 transition-transform">
                            <User className="w-7 h-7 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Identificación</h3>
                        <p className="text-gray-500 text-sm leading-relaxed font-mono">
                            Ced: {user?.Cedula}
                        </p>
                    </div>
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
