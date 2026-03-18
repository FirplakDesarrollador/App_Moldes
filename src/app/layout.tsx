import type { Metadata } from "next";
import "./globals.css";
import { SAPProvider } from "@/context/SAPContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import SAPStatusHeader from "@/components/SAPStatusHeader";

export const metadata: Metadata = {
    title: "MoldApp - Login",
    description: "Sistema de Control de Moldes",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="antialiased premium-gradient min-h-screen">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                >
                    <SAPProvider>
                        {children}
                    </SAPProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
