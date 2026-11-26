'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock, Loader2 } from 'lucide-react'
import { moldsService, type MoldProximoDesmanchado } from '@/services/molds.service'

export default function MoldesProximosDesmanchar() {
    const [open, setOpen] = useState(false)
    const [rows, setRows] = useState<MoldProximoDesmanchado[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        if (!open) return
        let active = true
        setLoading(true)
        setError('')
        setRows([])

        moldsService.getMoldesProximosDesmanchar()
            .then(data => { if (active) setRows(data) })
            .catch(() => { if (active) setError('No se pudieron consultar los moldes próximos a desmanchar.') })
            .finally(() => { if (active) setLoading(false) })

        return () => { active = false }
    }, [open, attempt])

    return (
        <section className="mt-6" aria-label="Moldes próximos a desmanchar">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                aria-expanded={open}
                aria-controls="moldes-proximos-desmanchar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                Moldes próximos a desmanchar
            </button>

            {open && (
                <div id="moldes-proximos-desmanchar" className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800" aria-busy={loading}>
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Moldes próximos a desmanchar</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Moldes a los que les falta una vuelta para alcanzar el límite de desmanchado.</p>
                    </div>

                    {loading ? (
                        <p role="status" className="flex items-center gap-2 p-5 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Consultando moldes…
                        </p>
                    ) : error ? (
                        <div role="alert" className="flex flex-wrap items-center gap-3 p-5 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <p>{error}</p>
                            <button type="button" onClick={() => setAttempt(value => value + 1)} className="rounded-lg px-3 py-2 font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Reintentar</button>
                        </div>
                    ) : rows.length === 0 ? (
                        <p role="status" className="p-5 text-sm text-slate-500 dark:text-slate-400">No hay moldes a una vuelta del límite de desmanchado.</p>
                    ) : (
                        <>
                            <p role="status" className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{rows.length} {rows.length === 1 ? 'molde próximo' : 'moldes próximos'} a desmanchar</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <caption className="sr-only">Moldes cuyas vueltas actuales son iguales al límite de desmanchado menos uno, en todos los estados.</caption>
                                    <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                                        <tr>
                                            <th scope="col" className="whitespace-nowrap px-5 py-3 font-bold">Código</th>
                                            <th scope="col" className="min-w-[200px] px-5 py-3 font-bold">Nombre</th>
                                            <th scope="col" className="whitespace-nowrap px-5 py-3 text-right font-bold">Vueltas actuales</th>
                                            <th scope="col" className="whitespace-nowrap px-5 py-3 text-right font-bold">Límite de desmanchado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rows.map(mold => (
                                            <tr key={mold.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td className="whitespace-nowrap px-5 py-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{mold.serial || 'Sin código'}</td>
                                                <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{mold.nombre_articulo || 'Sin nombre'}</td>
                                                <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">{mold.vueltas_actuales}</td>
                                                <td className="px-5 py-3 text-right font-bold tabular-nums text-blue-600 dark:text-blue-300">{mold.Vueltas_Desmanchado}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    )
}
