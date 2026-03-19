// PV_MOLDES V2.4
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SAPContextType {
    isConnected: boolean;
    isConnecting: boolean;
    timeLeft: number; // in seconds
    loginToSAP: (username?: string, password?: string) => Promise<boolean>;
}

const SAPContext = createContext<SAPContextType>({
    isConnected: false,
    isConnecting: false,
    timeLeft: 0,
    loginToSAP: async () => false,
});

export const useSAP = () => useContext(SAPContext);

export const SAPProvider = ({ children }: { children: ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // 30 minutes in seconds

    // Use credentials from API or environment variables
    // Use credentials from parameters or API
    const SAP_USER = ""; // Should be provided or use .env in backend
    const SAP_PASS = "";

    const loginToSAP = async (username = SAP_USER, password = SAP_PASS) => {
        setIsConnecting(true);
        try {
            const res = await fetch('/api/sap-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setIsConnected(true);
                    setTimeLeft(30 * 60); // 30 minutes
                    return true;
                }
            }
            setIsConnected(false);
            return false;
        } catch (error) {
            console.error('Error connecting to SAP context', error);
            setIsConnected(false);
            return false;
        } finally {
            setIsConnecting(false);
        }
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isConnected && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = prev - 1;

                    if (newTime <= 0) {
                        console.log('SAP Session expired/reached zero. Auto-renewing...');
                        // Auto-renew when hitting 0
                        loginToSAP();
                        return 30 * 60; // Reset to 30 minutes
                    }
                    return newTime;
                });
            }, 1000);
        } else if (isConnected && timeLeft <= 0) {
            // This part handles the initial state if timeLeft is somehow 0 but isConnected is true
            setTimeLeft(30 * 60);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isConnected]); // Removed timeLeft from dependencies to avoid interval recreation every second

    // Auto-login effect when already authenticated in the app
    useEffect(() => {
        const checkAuthAndLogin = async () => {
            const storedUser = localStorage.getItem('moldapp_user');
            if (storedUser && !isConnected && !isConnecting) {
                console.log('🔄 SAPContext: Usuario detectado, iniciando sesión automática en SAP...');
                const success = await loginToSAP();
                if (success) {
                    console.log('✅ SAPContext: Sesión global de SAP activada correctamente.');
                } else {
                    console.warn('❌ SAPContext: Falló el auto-login de SAP. Verifica el servidor.');
                }
            }
        };

        checkAuthAndLogin();

        // Escuchar cambios en auth (opcional, por si el usuario cambia de cuenta)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'moldapp_user') {
                checkAuthAndLogin();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [isConnected, isConnecting]);

    return (
        <SAPContext.Provider value={{ isConnected, isConnecting, timeLeft, loginToSAP }}>
            {children}
        </SAPContext.Provider>
    );
};
