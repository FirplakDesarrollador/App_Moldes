'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Lock, Loader2, User, Settings, Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSAP } from '@/context/SAPContext'

interface Employee {
    Cedula: number
    Nombre: string
    Planta?: string
    Area?: string
    Empresa?: string
}

export default function AuthForm() {
    const router = useRouter()
    const { loginToSAP } = useSAP()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [cedulaInput, setCedulaInput] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [message, setMessage] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const fetchEmployees = async () => {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            console.log('--- Debug de Conexión ---')
            console.log('URL de Supabase:', supabaseUrl ? 'Configurada ✅' : 'FALTANTE ❌')
            console.log('Key de Supabase:', supabaseKey ? 'Configurada ✅' : 'FALTANTE ❌')

            if (!supabaseUrl || !supabaseKey) {
                setMessage('Error: Variables de entorno de Supabase no configuradas (.env.local missing?)')
                setInitialLoading(false)
                return
            }

            try {
                // Timeout de 6 segundos para no colgar la UI si la red falla
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Tiempo de espera agotado (Timeout)')), 6000)
                )

                const fetchTask = supabase
                    .from('Personal app moldes')
                    .select('Nombre, Cedula')
                    .order('Nombre', { ascending: true })
                    .limit(1000)

                const { data, error } = await Promise.race([fetchTask, timeout]) as any

                if (error) {
                    console.error('Error al cargar personal:', error)
                    setMessage(`Error de Supabase: ${error.message} (${error.code})`)
                } else if (data) {
                    console.log('Personal cargado:', data.length, 'registros')
                    setEmployees(data)
                }
            } catch (err: any) {
                console.error('Error fatal durante la carga:', err)
                setMessage(`Error de conexión: ${err.message}. Verifica tu internet o la URL de Supabase.`)
            } finally {
                setInitialLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmployees(employees)
        } else {
            const filtered = employees.filter(emp => {
                const name = emp.Nombre || ''
                return name.toLowerCase().includes(searchQuery.toLowerCase())
            })
            setFilteredEmployees(filtered)
        }
    }, [searchQuery, employees])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee) {
            setMessage('Por favor, selecciona tu nombre de la lista.')
            return
        }

        setLoading(true)
        setMessage('')

        if (cedulaInput === selectedEmployee.Cedula?.toString()) {
            localStorage.setItem('moldapp_user', JSON.stringify(selectedEmployee))

            // Initiate SAP Login
            await loginToSAP()

            router.push('/dashboard')
        } else {
            setMessage('Cédula incorrecta. Intenta de nuevo.')
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl min-h-[300px]">
                {message ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
                            {message}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs text-blue-400 hover:underline"
                        >
                            Reintentar cargar datos
                        </button>
                    </div>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-500 text-xs animate-pulse">Conectando con Firplak S.A...</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="w-full max-w-md p-8 glass-card rounded-2xl animate-in fade-in duration-700">
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="h-16 w-full flex items-center justify-center mb-6">
                    <img
                        src="/logo-firplak.png"
                        alt="Firplak Logo"
                        className="h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                        onError={(e) => {
                            // Fallback if image not found
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl font-black tracking-tighter text-white">FIRPLAK</span>';
                        }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <Settings className="w-4 h-4 text-blue-500 animate-spin-slow" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wider flex items-center gap-2">
                        MoldApp
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">V2.1</span>
                    </h1>
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mt-3 font-semibold">Control Interno de Producción</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2 relative">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white cursor-pointer flex items-center justify-between min-h-[50px]"
                        >
                            <span className={selectedEmployee ? 'text-white' : 'text-gray-600'}>
                                {selectedEmployee ? selectedEmployee.Nombre : 'Busca tu nombre...'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {showDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-white/5">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Escribe tu nombre..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((emp, idx) => (
                                            <div
                                                key={emp.Cedula || idx}
                                                onClick={() => {
                                                    setSelectedEmployee(emp)
                                                    setShowDropdown(false)
                                                    setSearchQuery('')
                                                    setMessage('')
                                                }}
                                                className="flex items-center justify-between px-4 py-3 hover:bg-blue-600/20 rounded-lg cursor-pointer transition-colors group"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{emp.Nombre || 'Sin Nombre'}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{emp.Planta || 'MOLDES'} — {emp.Area || 'EXTERNO'}</p>
                                                </div>
                                                {selectedEmployee?.Cedula === emp.Cedula && (
                                                    <Check className="w-4 h-4 text-blue-500" />
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm font-medium">No se encontraron nombres</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Cédula (Contraseña)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="password"
                            placeholder="Ingresa tu número de identificación"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono tracking-widest"
                            value={cedulaInput}
                            onChange={(e) => setCedulaInput(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {message && (
                    <div className="p-4 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/30 opacity-90 animate-in slide-in-from-top-2">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !selectedEmployee}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg 
            ${selectedEmployee
                            ? 'accent-gradient text-white hover:shadow-blue-500/20 active:scale-[0.98]'
                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Exclusivo para uso interno - Firplak S.A.</p>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    )
}
