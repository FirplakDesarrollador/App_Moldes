'use client'

import { inferMoldPlant } from '@/services/moldPlant.service'

export default function MoldPlantField({ title, value, onChange }: {
    title: string; value: string; onChange: (value: string) => void
}) {
    const inferred = inferMoldPlant(title)
    return (
        <label className="block space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Clasificación de planta para código nuevo</span>
            <select value={value} onChange={event => onChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-slate-900 dark:text-white">
                <option value="">{inferred === 'MS' ? 'Automática: Mármol Sintético (MS)' : inferred === 'FV' ? 'Automática: Fibra de Vidrio (FV)' : 'Usar clasificación conocida de la referencia'}</option>
                <option value="MS">Mármol Sintético (MS)</option>
                <option value="FV">Fibra de Vidrio (FV)</option>
            </select>
            <span className="block text-xs font-normal">Si el código ya existe, conserva su planta. Si no se puede determinar, debes seleccionar MS o FV.</span>
        </label>
    )
}
