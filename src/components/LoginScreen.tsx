import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginScreen() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if they are already logged in
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // If success, user state changes, useEffect triggers redirect
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message?.includes('popup-closed-by-user')
          ? 'El inicio de sesión fue cancelado (cerraste la ventana emergente).'
          : 'Ocurrió un error al autenticar con Google. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 geometric-grid flex flex-col justify-between font-sans text-zinc-100 selection:bg-zinc-200 selection:text-zinc-900 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Navbar minimal */}
      <header className="px-6 py-5 md:px-12 flex justify-between items-center relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 text-zinc-400" /> <span className="text-xs font-mono uppercase tracking-wider font-semibold">Volver al inicio</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-mono text-zinc-500 tracking-wider">MERCADEA_SECURE_AUTH_v1.0</span>
        </div>
      </header>

      {/* Main Login frame */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 my-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-zinc-900/90 border-2 border-zinc-850 rounded-none p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] text-center relative"
        >
          {/* Accent border top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-zinc-400"></div>

          {/* Logo marker */}
          <div className="bg-zinc-800/50 p-3.5 rounded-none border-2 border-zinc-700/80 inline-block mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="font-sans font-bold text-2xl md:text-3xl text-white tracking-tight uppercase">
            Mercadea<span className="text-zinc-400 font-mono">_IA</span>
          </h1>
          <p className="text-zinc-400 font-light text-xs mt-3 leading-relaxed">
            Tu consultor de marketing con IA. Diseñado para estructurar estrategias, calendarios de publicación y textos persuasivos optimizados para tu sector.
          </p>

          <div className="w-full h-px bg-zinc-800 my-6"></div>

          {error && (
            <div className="bg-rose-500/10 border-2 border-rose-500/20 text-rose-300 text-xs text-left p-4 rounded-none mb-5 flex gap-3 items-start leading-relaxed font-mono">
              <AlertCircle className="w-4 h-4 text-rose-405 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-mono font-bold tracking-wider uppercase py-4 px-6 rounded-none flex items-center justify-center gap-3 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none shadow-md cursor-pointer border-r-4 border-b-4 border-zinc-400 hover:border-zinc-500 active:translate-y-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.9 1 12 1 7.35 1 3.42 3.73 1.58 7.72l3.75 2.91C6.21 7.22 8.87 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.7-4.94 3.7-8.56z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.33 14.81c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.58 7.54C.57 9.55 0 11.78 0 14.12s.57 4.57 1.58 6.58l3.75-2.91c-.23-.69-.36-1.42-.36-2.18z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.93l-3.7-2.87c-1.03.69-2.34 1.1-3.9 1.1-3.13 0-5.79-2.18-6.74-5.15l-3.75 2.91C3.42 20.27 7.35 23 12 23z"
                  />
                </svg>
                <span className="text-xs tracking-widest font-bold">Autenticar con Google</span>
              </>
            )}
          </button>

          {/* Secure disclaimer */}
          <div className="flex items-center justify-center gap-2 mt-6 text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>Servidor seguro · OAuth SSL</span>
          </div>
        </motion.div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 border-t border-zinc-800 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600 relative z-10 w-full bg-zinc-950/40">
        <p>&copy; {new Date().getFullYear()} MercadeaIA · Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
