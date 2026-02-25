'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, TrendingUp, Activity } from 'lucide-react'
import RawMaterialConsumption from '@/components/rawMaterials/RawMaterialConsumption'
import Navbar from '@/components/layout/Navbar'

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

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Consumo"
                subtitle="Materia Prima"
            />

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
