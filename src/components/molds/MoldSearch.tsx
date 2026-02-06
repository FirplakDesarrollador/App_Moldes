'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Loader2, Package } from 'lucide-react'

interface Mold {
    Nombre: string
    'CODIGO MOLDE': string
    ID: number
    [key: string]: any
}

interface MoldSearchProps {
    onSelect: (mold: Mold) => void
}

export default function MoldSearch({ onSelect }: MoldSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Mold[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const searchMolds = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('base_datos_moldes')
                    .select('*')
                    .or(`Nombre.ilike.%${query}%, "CODIGO MOLDE".ilike.%${query}%`)
                    .limit(10)

                if (error) throw error
                setResults(data || [])
            } catch (err) {
                console.error('Error searching molds:', err)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(searchMolds, 300)
        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o código de molde..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-2">
                        {results.map((mold, index) => (
                            <button
                                key={`${mold.ID}-${index}`}
                                onClick={() => {
                                    onSelect(mold)
                                    setQuery('')
                                    setResults([])
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors rounded-xl text-left group"
                            >
                                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                    <Package className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-white font-medium">{mold.Nombre}</div>
                                    <div className="text-gray-500 text-sm">{mold['CODIGO MOLDE']}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
                <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-gray-500">No se encontraron moldes que coincidan con "{query}"</p>
                </div>
            )}
        </div>
    )
}
