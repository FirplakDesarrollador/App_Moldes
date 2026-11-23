'use client'

import { useEffect } from 'react'
import { moldsService } from '@/services/molds.service'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!localStorage.getItem('moldapp_user') ||
            process.env.NEXT_PUBLIC_DISABLE_SAP_AUTO_NOTIFY === 'true') return

        // Se conservan los marcadores del servicio para evitar avisos duplicados y permitir reintentos.
        moldsService.notifyAutoDesmanchadoToSAP()
            .then(({ notified, failed }) => {
                if (notified.length) console.log('[Desmanchado] SAP actualizado a En reparación:', notified)
                if (failed.length) console.warn('[Desmanchado] Pendientes de SAP:', failed)
            })
            .catch(error => console.error('[Desmanchado] Error avisando a SAP:', error))
    }, [])

    return children
}