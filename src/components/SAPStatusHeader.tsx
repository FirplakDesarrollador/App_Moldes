// PV_MOLDES V2.4
'use client'

import React from 'react';
import { useSAP } from '@/context/SAPContext';
import { Activity, Clock } from 'lucide-react';

export default function SAPStatusHeader() {
    const { isConnected, isConnecting, timeLeft } = useSAP();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-2 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">
                    MoldApp Integración
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                    SAP B1 Environment Core
                </span>
            </div>

            <div className={`flex items-center gap-4 px-4 py-1.5 rounded-full border ${isConnected
                    ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : isConnecting
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                }`}>

                <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                        {isConnected && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
                            }`}></span>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isConnected ? 'text-green-400' : isConnecting ? 'text-blue-400' : 'text-red-400'
                        }`}>
                        {isConnected ? 'SAP Online' : isConnecting ? 'Conectando SAP...' : 'SAP Offline'}
                    </span>
                </div>

                {isConnected && (
                    <div className="flex items-center gap-1.5 pl-4 border-l border-green-500/20">
                        <Clock className="w-3.5 h-3.5 text-green-400/80" />
                        <span className="text-xs font-mono font-medium text-green-400">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
