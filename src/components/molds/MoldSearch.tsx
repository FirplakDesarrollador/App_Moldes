// PV_MOLDES V2.4
'use client'

import { useState, useEffect } from 'react'
import { Search, Package, MapPin, Loader2 } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'

interface MoldSearchProps {
    onSelect: (mold: Mold) => void
}

export default function MoldSearch({ onSelect }: MoldSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Mold[]>([])
    const [loading, setLoading] = useState(false)
    
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }
        
        setLoading(true)
        const timeoutId = setTimeout(async () => {
            const parsed = await moldsService.searchMolds(query)
            setResults(parsed)
            setLoading(false)
        }, 400) // Debounce

        return () => clearTimeout(timeoutId)
    }, [query])

    return (
        <div className="relative w-full max-w-2xl mx-auto group">
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar moldes por nombre o serial..."
                    className="w-full bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-3xl py-6 pl-16 pr-8 text-lg font-medium shadow-xl shadow-black/5 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
            </div>

            {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-4 duration-200">
                    {results.map(mold => (
                        <button
                            key={mold.id || mold.serial || `search-${mold.nombre_articulo}`}
                            onClick={() => {
                                onSelect(mold)
                                setQuery('')
                            }}
                            className="w-full px-8 py-6 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group/item"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{mold.nombre_articulo}</div>
                                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">{mold.serial}</div>
                                </div>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase text-gray-400 group-hover/item:bg-blue-500/20 group-hover/item:text-blue-500 transition-all">
                                {mold.estado}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
