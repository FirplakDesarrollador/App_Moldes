"use client";

/* PV_MOLDES V2.4 - Error Handler */
import { useEffect } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // En Next.js, un ChunkLoadError indica que el cliente está intentando cargar
        // un fragmento (chunk) que ya no existe en el servidor (usualmente tras un build/deploy).
        // El patrón recomendado para este error específico es la "Degradación Graciosa" vía recarga.
        const isChunkError = 
            error.name === "ChunkLoadError" || 
            error.message.includes("ChunkLoadError") ||
            error.message.includes("Loading chunk");

        if (isChunkError) {
            console.warn("🔄 Se detectó un error de carga de fragmento (ChunkLoadError). Reintentando carga completa...");
            window.location.reload();
        } else {
            // Loguear el error para propósitos de depuración - Best Practice: Preserve Context
            console.error("❌ Error de la aplicación:", error);
        }
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center premium-gradient p-4">
            <div className="glass-card max-w-md w-full p-8 rounded-2xl flex flex-col items-center gap-6">
                <div className="bg-red-500/10 p-4 rounded-full">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Algo salió mal
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Ocurrió un error inesperado en la aplicación. 
                        {error.digest && <span className="block mt-1 font-mono text-[10px opacity-50)]">ID: {error.digest}</span>}
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => reset()}
                        className="w-full flex items-center justify-center gap-2 accent-gradient text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Intentar de nuevo
                    </button>
                    
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-secondary text-secondary-foreground border py-3 rounded-xl font-medium hover:bg-secondary/80 active:scale-95 transition-all text-sm"
                    >
                        Recargar página completa
                    </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                    Si el problema persiste después de recargar, por favor contacte a soporte técnico.
                    PV_MOLDES V2.4
                </p>
            </div>
        </div>
    );
}
