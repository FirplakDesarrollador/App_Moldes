// PV_MOLDES V2.4
'use client'

import React from 'react';
import { useSAP } from '@/context/SAPContext';
import { Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function SAPSessionBadge() {
    const { isConnected, isConnecting, timeLeft } = useSAP();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (isConnecting) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Conectando SAP...
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle className="w-3 h-3" /> SAP Offline
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" /> SAP Online
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-gray-400 whitespace-nowrap">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-mono font-black tracking-tighter">
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
    );
}
