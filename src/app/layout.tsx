import type { Metadata } from "next";
import "./globals.css";

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
        <html lang="es">
            <body className="antialiased premium-gradient min-h-screen">
                {children}
            </body>
        </html>
    );
}
