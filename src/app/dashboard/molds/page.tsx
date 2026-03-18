'use client'

import { useState, useEffect } from 'react'
import MoldsModule from '@/components/molds/MoldsModule'
import Navbar from '@/components/layout/Navbar'

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

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-blue-500/30">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Módulo Moldes"
                subtitle="Gestión Activa"
            />

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <MoldsModule />
            </div>

            {/* Footer Placeholders for other modules */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="border-t border-black/5 dark:border-white/5 pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40 grayscale">
                        <div className="p-6 glass-card rounded-[2rem]">
                            <h4 className="font-bold mb-2">Histórico</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Módulo de trazabilidad y moldes cerrados.</p>
                        </div>
                        <div className="p-6 glass-card rounded-[2rem]">
                            <h4 className="font-bold mb-2">Consumo</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Gestión de resinas, fibras y materiales.</p>
                        </div>
                        <div className="p-6 glass-card rounded-[2rem]">
                            <h4 className="font-bold mb-2">Auditoría</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Puntos de control y calidad final.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
