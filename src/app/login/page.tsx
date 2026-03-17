import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            {/* Decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <AuthForm />

            <p className="mt-8 text-gray-400 text-xs flex items-center gap-2">
                <span>&copy; 2026 MoldApp. Todos los derechos reservados.</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700 text-[10px] font-medium">V2</span>
            </p>
        </main>
    )
}
