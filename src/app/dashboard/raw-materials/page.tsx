// PV_MOLDES V2.4
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
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
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
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl z-50">
                <button
                    onClick={() => router.push('/dashboard/molds')}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-xs"
                >
                    <Package className="w-4 h-4" /> MOLDES
                </button>
                <div className="px-6 py-3 bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white rounded-2xl transition-all font-black text-xs flex items-center gap-2 shadow-lg dark:shadow-white/5">
                    <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" /> CONSUMO
                </div>
                <button 
                    onClick={() => router.push('/dashboard/history')}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-xs"
                >
                    <ClipboardList className="w-4 h-4" /> REGISTRO
                </button>
                <button 
                    onClick={() => router.push('/dashboard/audit')}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-xs"
                >
                    <Activity className="w-4 h-4" /> AUDITORIA
                </button>
            </div>
        </div>
    )
}
