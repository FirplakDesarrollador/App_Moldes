'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Settings, User, MapPin } from 'lucide-react'
import SAPSessionBadge from '@/components/auth/SAPSessionBadge'
import { ThemeToggle } from '@/components/ThemeToggle'

interface NavbarProps {
    user: any
    showBackButton?: boolean
    backPath?: string
    title?: string
    subtitle?: string
}

export default function Navbar({
    user,
    showBackButton = false,
    backPath = '/dashboard',
    title = 'MoldApp',
    subtitle = 'Firplak S.A.'
}: NavbarProps) {
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        window.location.href = '/login'
    }

    return (
        <nav className="glass-card sticky top-0 z-50 border-x-0 border-t-0 rounded-none bg-opacity-70 dark:bg-opacity-40">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {showBackButton && (
                        <>
                            <button
                                onClick={() => router.push(backPath)}
                                className="p-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl border border-black/5 dark:border-white/5 transition-colors group"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-[var(--foreground)] transition-all" />
                            </button>
                            <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 hidden md:block" />
                        </>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 dark:border-white/10 shadow-lg group">
                            <Image
                                src="/logo-firplak.png"
                                alt="FIRPLAK Logo"
                                width={40}
                                height={40}
                                className="object-contain p-1.5 group-hover:scale-110 transition-transform duration-300 dark:invert"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-tighter leading-none text-[var(--foreground)]">{title}</span>
                                <span className="text-[9px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.2 py-0.2 rounded border border-blue-200 dark:border-blue-500/10 font-bold">V2.2</span>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{subtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <ThemeToggle />
                    
                    <SAPSessionBadge />

                    <div className="hidden sm:flex flex-col items-end text-right">
                        <span className="text-sm font-bold text-[var(--foreground)] leading-none mb-1">{user?.Nombre || user?.NombreCompleto || 'Usuario'}</span>
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" /> {user?.Planta || 'Sin Planta'}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-2 px-4 md:px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl text-sm font-bold border border-red-200 dark:border-red-500/20 transition-all"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Salir</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}
