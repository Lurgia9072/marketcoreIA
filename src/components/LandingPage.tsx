import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowRight,
  TrendingUp, 
  Users, 
  Award, 
  Calendar, 
  BookOpen, 
  Plus, 
  Lightbulb, 
  Target, 
  Clock, 
  Layers, 
  FileText, 
  Zap, 
  MessageSquare,
  ShieldCheck,
  Instagram,
  Facebook,
  Twitter,
  Send
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Success cases chart data
  const chartData = [
    { name: 'Mes 1', engagement: 2.1, seguidores: 1200 },
    { name: 'Mes 2', engagement: 3.5, seguidores: 2100 },
    { name: 'Mes 3', engagement: 5.8, seguidores: 4300 },
    { name: 'Mes 4', engagement: 7.2, seguidores: 7900 },
    { name: 'Mes 5', engagement: 9.4, seguidores: 14200 },
  ];

  const faqs = [
    {
      q: '¿Necesito tener experiencia previa en marketing digital?',
      a: 'Para nada. Nuestra plataforma está diseñada especialmente para emprendedores y autónomos. La IA actúa como tu consultor experto privado de confianza, guiándote paso a paso en qué publicar y cómo estructurar tus ideas de venta.'
    },
    {
      q: '¿Necesito contratar a un diseñador adicional?',
      a: 'No. El analista te crea tanto el copy persuasivo como los prompts optimizados para generar imágenes llamativas. Además, te sugiere el formato visual exacto (Reel, Carrusel, etc.) que mejor se adapta a tu nicho.'
    },
    {
      q: '¿Cómo funciona la IA para mi negocio específico?',
      a: 'Al registrar tu negocio, introduces tu sector, tus productos o servicios y tu cliente ideal. Nuestra IA procesa estos datos en segundos y genera una estrategia 100% personalizada basada en los ángulos de venta de mayor impacto en la actualidad.'
    },
    {
      q: '¿Es esto lo mismo que usar ChatGPT convencional?',
      a: 'No. ChatGPT requiere prompts complejos de redactar para obtener buenos resultados. Nuestro SaaS está pre-entrenado y optimizado específicamente como Analista de Marketing, conectando tu nicho, calendario mensual y canales directamente sin que tengas que aprender ingeniería de prompts.'
    }
  ];

  const handleStartFree = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden geometric-grid-light animate-grid-fade">
      
      {/* HEADER NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-zinc-200 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-zinc-950 p-2 rounded-none border border-zinc-900">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans font-bold text-xl tracking-wide text-zinc-900 uppercase">
              Mercadea<span className="text-zinc-650 bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 ml-1.5 text-xs font-mono font-normal">_IA</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-zinc-600">
            <a href="#problema" className="hover:text-zinc-950 transition duration-200">El Reto</a>
            <a href="#como-funciona" className="hover:text-zinc-950 transition duration-200">Cómo Funciona</a>
            <a href="#bento" className="hover:text-zinc-950 transition duration-200">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-zinc-950 transition duration-200">Beneficios</a>
            <a href="#precios" className="hover:text-zinc-950 transition duration-200">Precios</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-zinc-900 border-2 border-zinc-950 text-white px-4.5 py-2.5 rounded-none text-xs font-mono uppercase tracking-widest hover:bg-zinc-800 transition duration-200 flex items-center gap-2"
              >
                Panel de control <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-zinc-600 hover:text-zinc-900 text-xs font-mono uppercase tracking-widest px-4 py-2 transition duration-200"
                >
                  Acceder
                </Link>
                <button 
                  onClick={handleStartFree}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-none text-xs font-mono uppercase tracking-widest font-extrabold border-b-2 border-r-2 border-zinc-700 active:translate-y-0.5 cursor-pointer"
                >
                  Probar Gratis
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION - MÓDULO 2 */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 px-4 md:px-8 border-b-2 border-zinc-200">
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white border-2 border-zinc-200 text-zinc-700 px-4 py-1.5 rounded-none text-xs font-mono tracking-widest uppercase mb-8 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> Analista de Marketing IA para Emprendedores
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-bold text-4xl md:text-6xl tracking-tight text-zinc-900 leading-tight max-w-4xl mx-auto uppercase"
          >
            Tu Analista de Marketing con IA que crea tu estrategia y contenido para <span className="underline decoration-zinc-800 underline-offset-8 decoration-4">vender más.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-zinc-650 text-base md:text-lg max-w-2xl mx-auto font-sans font-light leading-relaxed text-zinc-650"
          >
            Se acabó improvisar qué publicar. Deja que nuestra IA analice tu nicho y cliente ideal para armar un plan mensual real con copies profesionales listos para tus redes sociales.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={handleStartFree}
              className="w-full sm:w-auto bg-zinc-900 text-white px-8 py-4 rounded-none text-sm font-mono uppercase tracking-widest font-extrabold shadow-md hover:bg-zinc-800 border-b-4 border-r-4 border-zinc-700 active:translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              Comenzar Gratis <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <a 
              href="#dashboard-preview"
              className="w-full sm:w-auto bg-white border-2 border-zinc-250 text-zinc-700 px-8 py-4 rounded-none text-sm font-mono uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition flex items-center justify-center gap-2"
            >
              Ver Demostración
            </a>
          </motion.div>

          {/* SaaS Frame Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 md:mt-28 max-w-5xl mx-auto relative group"
            id="dashboard-preview"
          >
            <div className="absolute -inset-1 bg-zinc-200 rounded-none opacity-45 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative bg-white rounded-none border-2 border-zinc-200 shadow-[8px_8px_0px_0px_rgba(24,24,27,0.06)] overflow-hidden p-3 md:p-5 text-left">
              
              {/* System info bar */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-zinc-300"></div>
                  <div className="w-2.5 h-2.5 bg-zinc-400"></div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">SISTEMA_ACTIVO_LIVEv3_ONLINE</span>
                </div>
                <div className="bg-zinc-50 px-3.5 py-1 text-[9px] font-mono text-zinc-500 tracking-widest border border-zinc-200">
                  MERCADEA_DASHBOARD_STABLE
                </div>
              </div>

              {/* Mock Dashboard Interior */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-3 bg-zinc-50 border border-zinc-200 rounded-none p-4.5 flex flex-col gap-4 font-mono">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider">ESTADOS DE MARCA</div>
                  <div className="bg-white p-3.5 border border-zinc-200">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Empresa:</p>
                    <p className="text-xs font-semibold text-zinc-900 mt-1">Café de Origen Orgánico</p>
                  </div>
                  <div className="bg-white p-3.5 border border-zinc-200">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Nicho:</p>
                    <p className="text-[10px] font-semibold text-zinc-755 mt-1">Eco-friendly Premium</p>
                  </div>
                  <div className="bg-white p-3.5 border border-zinc-200">
                    <div className="flex items-center gap-1.5 text-zinc-800 text-[10px] font-bold mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-zinc-600" /> PLANIFICACIÓN
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-normal">
                      Posicionamiento mediante sustentabilidad y exclusividad en redes.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-9 bg-zinc-50/50 border border-zinc-200 rounded-none p-4.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200/85 font-mono">
                      <span className="text-[10px] font-bold text-zinc-500 tracking-wider">CALENDARIO EDITORIAL IA</span>
                      <span className="text-[9px] bg-white border border-zinc-200 text-zinc-700 px-2 py-0.5 font-bold">REAL-TIME COPIES</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                      <div className="bg-white p-4 rounded-none border border-zinc-200 shadow-sm">
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold mb-1.5 uppercase font-mono">
                          <span>Día 1 · Instagram</span>
                          <span className="text-zinc-450">✓</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 line-clamp-1">Post de Origen Ecológico</p>
                        <p className="text-[11px] text-zinc-650 line-clamp-3 mt-1.5 font-sans font-light leading-relaxed">
                          "¿Sabías que cada grano es recolectado a mano cuidando la biodiversidad? ☕🌱 Descubre..."
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-none border border-zinc-200 shadow-sm">
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold mb-1.5 uppercase font-mono">
                          <span>Día 4 · TikTok</span>
                          <span className="text-zinc-450">✓</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 line-clamp-1">Proceso detrás de pantalla</p>
                        <p className="text-[11px] text-zinc-650 line-clamp-3 mt-1.5 font-sans font-light leading-relaxed">
                          "POV: Abres un saco de café orgánico recién tostado artesanalmente. Sigue este paso..."
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-none border border-zinc-300 shadow-md">
                        <div className="flex justify-between text-[9px] text-zinc-500 font-bold mb-1.5 uppercase font-mono">
                          <span>Día 8 · Facebook</span>
                          <span className="text-zinc-450">✓</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 line-clamp-1">Mitos del Tostado Ligero</p>
                        <p className="text-[11px] text-zinc-650 line-clamp-3 mt-1.5 font-sans font-light leading-relaxed">
                          "¿Más cafeína en el tostado oscuro? Te revelamos la verdad científica para que..."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-3">
                    <span className="font-sans text-zinc-600">💡 Tip del analista: Los videos interactivos en TikTok aumentan el engagement x2.3 esta semana</span>
                    <button 
                      onClick={handleStartFree}
                      className="text-zinc-650 hover:text-zinc-900 transition font-mono font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      Generar mi propia estrategia <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN PROBLEMA - MÓDULO 3 */}
      <section id="problema" className="py-24 border-t border-b border-zinc-200 px-4 md:px-8 bg-zinc-50/55">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-rose-700 uppercase font-mono bg-rose-50 border border-rose-200 inline-block px-3 py-1 rounded-none">
              LOS RIESGOS DE LA IMPROVISACIÓN
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              ¿Frustrado por tener que adivinar tu marketing diario?
            </h3>
            <p className="text-zinc-600 text-base mt-2 font-light">
              La mayoría de los emprendedores se enfrentan a los mismos obstáculos letales para sus ventas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            <div className="bg-white border text-zinc-800 p-6 rounded-none flex flex-col justify-between border-zinc-200 hover:border-zinc-350 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-800 p-3 rounded-none border border-zinc-200 inline-block mb-4">
                  <BookOpen className="w-5 h-5 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-base text-zinc-900">No sé qué publicar</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Pasas horas mirando una pantalla en blanco intentando idear contenido que capte atención.
                </p>
              </div>
              <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold mt-6 tracking-widest">Dolor #01</span>
            </div>

            <div className="bg-white border text-zinc-800 p-6 rounded-none flex flex-col justify-between border-zinc-200 hover:border-zinc-350 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-800 p-3 rounded-none border border-zinc-200 inline-block mb-4">
                  <Clock className="w-5 h-5 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-base text-zinc-900">No tengo tiempo</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Operar tu negocio es agotador; dedicarle 3 horas diarias a redactar contenido es inviable.
                </p>
              </div>
              <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold mt-6 tracking-widest">Dolor #02</span>
            </div>

            <div className="bg-white border text-zinc-800 p-6 rounded-none flex flex-col justify-between border-zinc-200 hover:border-zinc-350 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-800 p-3 rounded-none border border-zinc-200 inline-block mb-4">
                  <TrendingUp className="w-5 h-5 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-base text-zinc-900">No consigo ventas</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Publicas esporádicamente, recibiendo likes de amigos pero ningún prospecto calificado.
                </p>
              </div>
              <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold mt-6 tracking-widest">Dolor #03</span>
            </div>

            <div className="bg-white border text-zinc-800 p-6 rounded-none flex flex-col justify-between border-zinc-200 hover:border-zinc-350 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-800 p-3 rounded-none border border-zinc-200 inline-block mb-4">
                  <Instagram className="w-5 h-5 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-base text-zinc-900">Odio las redes</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  El algoritmo cambia constantemente y no comprendes los tecnicismos de marketing digital.
                </p>
              </div>
              <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold mt-6 tracking-widest">Dolor #04</span>
            </div>

            <div className="bg-white border text-zinc-800 p-6 rounded-none flex flex-col justify-between border-zinc-200 hover:border-zinc-350 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-800 p-3 rounded-none border border-zinc-200 inline-block mb-4">
                  <Users className="w-5 h-5 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-base text-zinc-900">Presupuesto cero</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Contratar a una agencia tradicional te costaría miles de dólares al mes, algo inaccesible.
                </p>
              </div>
              <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold mt-6 tracking-widest">Dolor #05</span>
            </div>

          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA - MÓDULO 4 */}
      <section id="como-funciona" className="py-24 px-4 md:px-8 bg-white relative border-b border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase font-mono bg-zinc-100 border border-zinc-200 inline-block px-3 py-1 rounded-none">
              OPTIMIZACIÓN DE TIEMPO
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              Estrategia y contenidos en 3 simples pasos
            </h3>
            <p className="text-zinc-650 text-base mt-4 font-light">
              Nuestra plataforma elimina la fricción para que tengas presencia constante en redes sociales con elegancia.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 -translate-y-1/2 hidden md:block"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              
              <div className="bg-zinc-50 border border-zinc-205 border-zinc-200 p-8 rounded-none text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(24,24,27,0.02)]">
                <div className="w-14 h-14 rounded-none bg-white border-2 border-zinc-300 flex items-center justify-center text-zinc-900 font-bold font-mono text-lg shadow-sm mb-6">
                  01
                </div>
                <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">Registra tu Negocio</h4>
                <p className="text-xs text-zinc-600 mt-3 font-light leading-relaxed max-w-xs">
                  Especifica tu nicho de mercado, describe brevemente tus productos y dinos a quién deseas venderle de forma directa.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-205 border-zinc-200 p-8 rounded-none text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(24,24,27,0.02)]">
                <div className="w-14 h-14 rounded-none bg-white border-2 border-zinc-300 flex items-center justify-center text-zinc-900 font-bold font-mono text-lg shadow-sm mb-6">
                  02
                </div>
                <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">Define tus Redes</h4>
                <p className="text-xs text-zinc-600 mt-3 font-light leading-relaxed max-w-xs">
                  Selecciona de manera sencilla las redes clave (Instagram, TikTok, Facebook) en las que deseas concentrar tu presencia digital.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-205 border-zinc-200 p-8 rounded-none text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(24,24,27,0.02)]">
                <div className="w-14 h-14 rounded-none bg-white border-2 border-zinc-300 flex items-center justify-center text-zinc-900 font-bold font-mono text-lg shadow-sm mb-6">
                  03
                </div>
                <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">¡IA Crea tu Estrategia!</h4>
                <p className="text-xs text-zinc-600 mt-3 font-light leading-relaxed max-w-xs">
                  Nuestro Analista IA procesa la información y en segundos genera tu plan strategic con copies persuasivos y prompts visuales.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* GRID BENTO MODERN - MÓDULO 5 */}
      <section id="bento" className="py-24 px-4 md:px-8 bg-zinc-50/50 relative border-b border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase font-mono bg-zinc-100 border border-zinc-200 inline-block px-3 py-1 rounded-none">
              FUNCIONES PODEROSAS
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              La Suite completa de tu Partner IA corporativo
            </h3>
            <p className="text-zinc-650 text-base mt-4 font-light">
              Todas las herramientas necesarias para dominar tu sector comercial unificadas en un ecosistema robusto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: Estrategia Mensual */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-8 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="flex justify-between items-start">
                  <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200">
                    <Target className="w-5 h-5 text-zinc-705 text-zinc-700" />
                  </div>
                  <span className="text-[9px] bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-1 font-mono font-bold uppercase tracking-widest">Premium engine</span>
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">Estrategia Mensual en Segundos</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed max-w-2xl">
                  Análisis estratégico automatizado enfocado en captación. Genera un enfoque de posicionamiento para tu marca basado en las tendencias actuales del nicho para cautivar a la audiencia.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Modelos: Gemini 3.5 Flash</span>
                <span className="text-zinc-900 font-bold group-hover:translate-x-1 transition-transform">Acceso libre &rarr;</span>
              </div>
            </div>

            {/* Bento Card 2: Calendario */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-4 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200 inline-block">
                  <Calendar className="w-5 h-5 text-zinc-705 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">Calendario Dinámico</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Visualiza tus days de publicación agendando tu contenido con etiquetas de canales automáticos de forma gráfica.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Optimiza horarios</span>
                <span className="text-zinc-900 font-bold group-hover:translate-x-1 transition-transform">Agendar &rarr;</span>
              </div>
            </div>

            {/* Bento Card 3: IA Copywriter */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-4 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200 inline-block">
                  <FileText className="w-5 h-5 text-zinc-750 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">IA Copywriter Persuasivo</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Escribe copies de venta que capturan y retienen la atención empleando gatillos mentales eficaces e invitaciones a la acción directas.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Optimizado en Español</span>
                <span className="text-zinc-900 font-bold group-hover:translate-x-1 transition-transform">Redactar &rarr;</span>
              </div>
            </div>

            {/* Bento Card 4: Generador de Imágenes */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-8 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="flex justify-between items-start">
                  <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200">
                    <Sparkles className="w-5 h-5 text-zinc-705 text-zinc-700" />
                  </div>
                  <span className="text-[9px] bg-zinc-50 border border-zinc-200 text-zinc-650 px-2 py-1 font-mono font-bold uppercase tracking-widest">Prompters optimizados</span>
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">Prompts Guiados para Imágenes</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed max-w-2xl">
                  Cada post sugerido viene acompañado de un prompt creativo detallado en inglés para usar de forma instantánea en cualquier generador de imágenes. Te describe la estética, colores e ilustración ideal.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Sustenta tu identidad visual</span>
                <span className="text-zinc-900 font-bold group-hover:translate-x-1 transition-transform">Ver ejemplos &rarr;</span>
              </div>
            </div>

            {/* Bento Card 5: Planes de Programación & Historial */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-6 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200 inline-block">
                  <Clock className="w-5 h-5 text-zinc-750 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">Programación Integrada</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Establece las fechas exactas de publicación de cada post y mantén el orden visual sabiendo con exactitud cuál contenido está programado o publicado.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Consistencia editorial</span>
                <span className="text-zinc-600 font-bold">Control de estados</span>
              </div>
            </div>

            {/* Bento Card 6: Analista IA en vivo */}
            <div className="bg-white border-2 border-zinc-200 p-6.5 rounded-none md:col-span-6 flex flex-col justify-between group hover:border-zinc-350 transition duration-300 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.03)]">
              <div>
                <div className="bg-zinc-100 text-zinc-900 p-3 rounded-none border border-zinc-200 inline-block">
                  <MessageSquare className="w-5 h-5 text-zinc-750 text-zinc-700" />
                </div>
                <h4 className="font-sans font-bold text-xl text-zinc-900 mt-6 uppercase">Asistencia y Feedback Directo</h4>
                <p className="text-xs text-zinc-650 mt-2 font-light leading-relaxed">
                  Edita y perfecciona los copies generados directamente en la plataforma. Copia el texto al portapapeles con un solo toque listo para tus redes.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-150 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Edición interactiva</span>
                <span className="text-zinc-900 font-bold group-hover:translate-x-1 transition-transform">Probar ahora &rarr;</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION - MÓDULO 6 */}
      <section className="py-24 px-4 md:px-8 border-b border-zinc-200 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-4">
              <h2 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase font-mono bg-zinc-100 border border-zinc-200 inline-block px-3 py-1 rounded-none">
                METRICAS DE TRACCION
              </h2>
              <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
                Estadísticas de impacto real sobre tu panel
              </h3>
              <p className="text-zinc-650 text-sm mt-4 font-light leading-relaxed">
                Nuestra plataforma no solo planifica, sino que te ayuda a registrar el avance de tus seguidores e interacciones sin saturarte con gráficos indescifrables. Todo es simple, elegante y comprensible.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8 font-mono">
                <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-none shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
                  <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Seguidores</span>
                  <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">14.200</span>
                  <span className="text-zinc-655 text-[10px] font-bold flex items-center gap-0.5 mt-2 uppercase tracking-wide text-zinc-600">
                    +11.8% mes
                  </span>
                </div>
                <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-none shadow-[4px_4px_0px_0px_rgba(24,24,27,0.03)]">
                  <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Engagement</span>
                  <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">9.4%</span>
                  <span className="text-zinc-655 text-[10px] font-bold flex items-center gap-0.5 mt-2 uppercase tracking-wide text-zinc-600">
                    +4.2% prom.
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-zinc-50/50 p-6 border border-zinc-200 rounded-none shadow-[6px_6px_0px_0px_rgba(24,24,27,0.02)]">
              <span className="text-[10px] font-bold text-zinc-600 font-mono tracking-wider block mb-4 uppercase">Crecimiento estimado de conversiones</span>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '0px', color: '#18181b', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="engagement" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-zinc-550 text-center mt-4 uppercase tracking-widest font-mono text-zinc-500">Simulación de resultados promedio logrados con consistencia de publicaciones diaria</p>
            </div>

          </div>
        </div>
      </section>

      {/* BENEFICIOS COMPARATIVA - MÓDULO 7 */}
      <section id="beneficios" className="py-24 px-4 md:px-8 bg-zinc-50/50 relative border-b border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase font-mono bg-zinc-100 border border-zinc-200 inline-block px-3 py-1 rounded-none">
              EL CONTRASTE
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              ¿Cómo cambia tu rutina editorial diaria?
            </h3>
            <p className="text-zinc-650 text-base mt-2 font-light">
              Mira el cambio radical entre gestionar tu contenido a ciegas versus tener un consultor de marketing dedicado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto font-sans">
            
            {/* ANTES */}
            <div className="bg-rose-50/20 border border-rose-200 p-8 rounded-none relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(239,68,68,0.02)]">
              <div className="absolute top-0 right-0 bg-rose-100 text-rose-800 font-mono text-[9px] uppercase font-bold px-4 py-1.5 border-l border-b border-rose-200">
                Improvisar
              </div>
              
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-rose-100/55 border border-rose-200 p-2.5 rounded-none">
                  <XCircle className="w-5 h-5 text-rose-700" />
                </div>
                <h4 className="font-bold text-lg text-zinc-900 uppercase tracking-wide">Antes de MercadeaIA</h4>
              </div>

              <ul className="flex flex-col gap-4 text-zinc-605 text-xs font-light leading-relaxed text-zinc-650">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 mt-0.5 font-bold font-mono">✕</span>
                  <span>Publicar posts aleatorios "a última hora" solo para mantener activa la red.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 mt-0.5 font-bold font-mono">✕</span>
                  <span>Frustración intelectual al redactar textos que no generan conversación ni llamados a la venta.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 mt-0.5 font-bold font-mono">✕</span>
                  <span>Pérdida inmensurable de tiempo seleccionando fotos genéricas que no se asocian con tu nicho.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 mt-0.5 font-bold font-mono">✕</span>
                  <span>Inconsistencia: Pasar 2 semanas sin publicar por cansancio, perdiendo el alcance orgánico.</span>
                </li>
              </ul>
            </div>

            {/* DESPUÉS */}
            <div className="bg-white border-2 border-zinc-900 p-8 rounded-none relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(24,24,27,0.06)]">
              <div className="absolute top-0 right-0 bg-zinc-900 text-white font-mono text-[9px] uppercase font-bold px-4 py-1.5 border-l border-b border-zinc-950">
                Estrategia
              </div>
              
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-emerald-100 border border-emerald-200 p-2.5 rounded-none">
                  <CheckCircle2 className="w-5 h-5 text-emerald-850 text-emerald-800" />
                </div>
                <h4 className="font-bold text-lg text-zinc-900 uppercase tracking-wide">Después de MercadeaIA</h4>
              </div>

              <ul className="flex flex-col gap-4 text-zinc-705 text-xs font-light leading-relaxed text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-700 mt-0.5 font-bold font-mono">✓</span>
                  <span>Un plan mensual completo de 4 semanas estructurado en torno a tus pilares reales de marca.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-700 mt-0.5 font-bold font-mono">✓</span>
                  <span>Textos altamente persuasivos redactados por un cerebro IA entrenado con fórmulas de copywriting.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-700 mt-0.5 font-bold font-mono">✓</span>
                  <span>Prompts para imágenes con estética detallada para que tu feed refleje cohesión e impacto Premium.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-700 mt-0.5 font-bold font-mono">✓</span>
                  <span>Tranquilidad mental sabiendo qué día publicar sin estrés acumulado.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* PLANES DE PRECIOS - MÓDULO 8 */}
      <section id="precios" className="py-24 px-4 md:px-8 border-t border-zinc-200 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-650 uppercase font-mono bg-zinc-100 border border-zinc-200 inline-block px-3 py-1 rounded-none text-zinc-600">
              PLANES ACCESIBLES
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              Inversión adaptada al tamaño de tu negocio
            </h3>
            <p className="text-zinc-600 text-sm mt-3 font-light">
              Mucho más económico que una agencia de publicidad y disponible de inmediato las 24 horas del día.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto font-sans">
            
            {/* PLAN BÁSICO */}
            <div className="bg-zinc-50/50 border-2 border-zinc-200 p-8 rounded-none flex flex-col justify-between hover:border-zinc-300 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.02)]">
              <div>
                <span className="text-zinc-500 font-bold text-[10px] uppercase font-mono tracking-wider block mb-2">Básico</span>
                <span className="text-4xl font-bold text-zinc-900 block">$19<span className="text-sm font-normal text-zinc-500">/mes</span></span>
                <p className="text-xs text-zinc-600 mt-3 font-light leading-relaxed">
                  Ideal para emprendedores locales que desean comenzar a estructurar sus redes de manera consciente.
                </p>

                <div className="w-full h-px bg-zinc-200 my-6"></div>

                <ul className="flex flex-col gap-3.5 text-xs text-zinc-650">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Estrategia de marca simplificada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Calendario básico de contenidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Up to 20 copies persuasivos al mes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Prompts optimizados para imágenes IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Historial de publicaciones persistente</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleStartFree}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white mt-8 py-3.5 border border-zinc-950 rounded-none text-xs font-mono font-bold uppercase tracking-widest transition cursor-pointer"
              >
                Empezar gratis
              </button>
            </div>

            {/* PLAN PROFESIONAL */}
            <div className="bg-white border-2 border-zinc-900 p-8 rounded-none flex flex-col justify-between relative shadow-[8px_8px_0px_0px_rgba(24,24,27,0.06)] transition duration-300 transform md:-translate-y-2">
              <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-zinc-900 text-white font-mono font-bold text-[9px] tracking-widest uppercase px-4 py-1.5 border border-zinc-950">
                RECOMENDADO
              </span>
              
              <div>
                <span className="text-zinc-500 font-bold text-[10px] uppercase font-mono tracking-wider block mb-2 mt-2">Profesional</span>
                <span className="text-4xl font-bold text-zinc-900 block">$39<span className="text-sm font-normal text-zinc-500">/mes</span></span>
                <p className="text-xs text-zinc-650 mt-3 font-light leading-relaxed">
                  Excelente para negocios digitales o tiendas en línea en etapa de tracción comercial que requieren constancia total.
                </p>

                <div className="w-full h-px bg-zinc-200 my-6"></div>

                <ul className="flex flex-col gap-3.5 text-xs text-zinc-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                    <span className="font-bold text-zinc-900">Todo lo del plan Básico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-750 flex-shrink-0" />
                    <span>Planificación de publicaciones ILIMITADAS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-750 flex-shrink-0" />
                    <span>Estrategia IA Multidireccional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-750 flex-shrink-0" />
                    <span>Control de agendación integrada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-750 flex-shrink-0" />
                    <span>Soporte prioritario 24/7</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleStartFree}
                className="w-full bg-zinc-900 hover:bg-zinc-850 text-white mt-8 py-3.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest transition cursor-pointer border-r-4 border-b-4 border-zinc-400 active:translate-y-0.5"
              >
                Elegir Profesional
              </button>
            </div>

            {/* PLAN PREMIUM */}
            <div className="bg-zinc-50/50 border-2 border-zinc-200 p-8 rounded-none flex flex-col justify-between hover:border-zinc-300 transition duration-300 shadow-[4px_4px_0px_0px_rgba(24,24,27,0.02)]">
              <div>
                <span className="text-zinc-500 font-bold text-[10px] uppercase font-mono tracking-wider block mb-2">Premium</span>
                <span className="text-4xl font-bold text-zinc-900 block">$79<span className="text-sm font-normal text-zinc-500">/mes</span></span>
                <p className="text-xs text-zinc-600 mt-3 font-light leading-relaxed">
                  Para agencias, marcas consolidadas o agencias de marketing con múltiples cuentas empresariales que manejar.
                </p>

                <div className="w-full h-px bg-zinc-200 my-6"></div>

                <ul className="flex flex-col gap-3.5 text-xs text-zinc-650">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span className="font-bold text-zinc-900">Todo lo del plan Profesional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Multiempresa (hasta 5 perfiles)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Multiusuario para tu equipo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Reportes de tendencias avanzadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span>Acceso antes que nadie a nuevas funciones</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleStartFree}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white mt-8 py-3.5 border border-zinc-950 rounded-none text-xs font-mono font-bold uppercase tracking-widest transition cursor-pointer"
              >
                Suscribirme a Premium
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CASO DE ÉXITO VISUAL - MÓDULO 9 */}
      <section className="py-24 px-4 md:px-8 border-t border-b border-zinc-205 border-zinc-200 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-zinc-50 border border-zinc-200 rounded-none p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(24,24,27,0.02)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 font-sans">
                <span className="text-zinc-500 font-mono text-[9px] uppercase font-bold tracking-widest mb-2 block">
                  CASO DE ÉXITO MUNDIAL
                </span>
                <h4 className="font-bold text-2xl md:text-3xl text-zinc-900 uppercase tracking-wide">
                  Panadería Artesana "Nuestros Granos"
                </h4>
                
                <p className="text-zinc-650 text-xs mt-4 font-light leading-relaxed">
                  Mariana, fundadora de Nuestros Granos, solía pasar 8 horas semanales escribiendo copies a ciegas en Instagram y Facebook. Al unirse a nuestra plataforma:
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8 font-mono">
                  <div className="border-l-2 border-zinc-300 pl-4">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Antes de usar IA</p>
                    <p className="text-sm font-bold text-zinc-700 mt-1 uppercase">Inconsistencia total</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Likes esporádicos, ventas estancadas, pérdida inmensa de tiempo.</p>
                  </div>
                  <div className="border-l-2 border-zinc-800 pl-4">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Luego de usar IA</p>
                    <p className="text-sm font-bold text-zinc-900 mt-1 uppercase">9.4% engagement</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Ventas triplicadas a través de DM, marca reconocida en su ciudad.</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 mt-6 leading-relaxed italic border-t border-zinc-200 pt-4 font-sans font-light">
                  "El analista IA me quitó el dolor de cabeza. Pasé de no saber qué publicar a tener un mes entero programado con copies que explican exactamente la levadura artesanal que uso." — Mariana G.
                </p>
              </div>

              <div className="lg:col-span-6 bg-zinc-100/50 p-6 rounded-none border border-zinc-200 flex flex-col gap-4 font-mono">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-650">
                  <span>MÉTRICA DE SEGUIDORES REGISTRADOS</span>
                  <span className="text-zinc-900 font-bold">+14.200</span>
                </div>
                
                <div className="flex justify-between items-end h-40 gap-2 mt-4">
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="bg-rose-500/10 w-full rounded-none h-4 border-t border-rose-500/20"></div>
                    <span className="text-[9px] text-zinc-500">Mes 1</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="bg-zinc-200 w-full rounded-none h-10 border border-zinc-300"></div>
                    <span className="text-[9px] text-zinc-500">Mes 2</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="bg-zinc-200 w-full rounded-none h-24 border border-zinc-350 bg-zinc-250"></div>
                    <span className="text-[9px] text-zinc-500">Mes 3</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="bg-zinc-90 w-full rounded-none h-36 border-t-2 border-zinc-900 bg-zinc-800"></div>
                    <span className="text-[9px] text-zinc-700 font-bold">Mes 5 (IA)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECCIÓN - MÓDULO 10 */}
      <section className="py-24 px-4 md:px-8 bg-zinc-50/50 relative border-b border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase font-mono bg-zinc-100 border border-zinc-205 inline-block px-3 py-1 rounded-none">
              DUDAS FRECUENTES
            </h2>
            <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 mt-4 uppercase">
              Preguntas Frecuentes
            </h3>
            <p className="text-zinc-600 text-xs mt-2 font-mono uppercase tracking-widest">
              Respuestas rápidas para que comiences sin dudas hoy mismo.
            </p>
          </div>

          <div className="flex flex-col gap-4 font-sans text-sm">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-none overflow-hidden transition shadow-[2px_2px_0px_0px_rgba(24,24,27,0.01)]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4.5 flex justify-between items-center text-left text-zinc-800 font-bold hover:text-zinc-900 transition uppercase text-xs md:text-sm tracking-wider cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-zinc-900' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="px-6 pb-5 text-zinc-650 leading-relaxed font-light border-t border-zinc-150 pt-4 tracking-normal text-xs normal-case">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECCIÓN FINAL - MÓDULO 11 */}
      <section className="py-24 px-4 md:px-8 bg-white relative border-b border-zinc-200">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="bg-zinc-100 text-zinc-700 px-4 py-1.5 rounded-none text-[9px] font-mono font-bold uppercase inline-block mb-6 tracking-widest border border-zinc-200">
            ÚNETE HOY
          </div>
          <h2 className="font-sans font-bold text-4xl md:text-5xl text-zinc-900 tracking-tight leading-tight uppercase">
            ¿Listo para delegar tu estrategia a una Inteligencia experta?
          </h2>
          <p className="text-zinc-600 text-sm mt-6 font-light max-w-2xl mx-auto leading-relaxed">
            Obtén tu primer mes completo de copies profesionales y plan de canales de forma gratuita. Regístrate en 15 segundos mediante tu cuenta de Google.
          </p>

          <div className="mt-10">
            <button 
              onClick={handleStartFree}
              className="bg-zinc-900 hover:bg-zinc-805 text-white px-8 py-4.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-b-4 border-r-4 border-zinc-400 active:translate-y-0.5 inline-flex items-center gap-2.5 cursor-pointer shadow-md"
            >
              Empieza gratis con Google <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-[10px] text-zinc-500 mt-8 font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1.5">🛡️ Sin Tarjeta Inicial</span>
            <span>·</span>
            <span>Acceso instantáneo</span>
          </div>
        </div>
      </section>

      {/* FOOTER - MÓDULO 12 */}
      <footer className="bg-zinc-50 py-14 px-4 md:px-8 text-zinc-500 text-xs font-mono border-t border-zinc-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-150 p-2 rounded-none border border-zinc-200 bg-white">
              <Sparkles className="w-4 h-4 text-zinc-700" />
            </div>
            <span className="font-sans font-bold text-lg text-zinc-900 uppercase tracking-wider">
              Mercadea<span className="text-zinc-600 font-mono text-xs font-normal">_IA</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-zinc-650 font-bold uppercase text-[10px] tracking-wider">
            <a href="#problema" className="hover:text-zinc-900 transition">El Reto</a>
            <a href="#como-funciona" className="hover:text-zinc-900 transition">Cómo funciona</a>
            <a href="#bento" className="hover:text-zinc-900 transition">Funcionalidades</a>
            <a href="#precios" className="hover:text-zinc-900 transition">Precios</a>
            <span className="text-zinc-200">|</span>
            <span className="text-zinc-500 hover:text-zinc-900 cursor-pointer tracking-normal">info@mercadeaia.com</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-zinc-500 hover:text-zinc-800 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-800 transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-800 transition">
              <Twitter className="w-4 h-4" />
            </a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto text-center md:text-left mt-8 pt-6 border-t border-zinc-200 text-[10px] text-zinc-500 flex flex-col md:flex-row justify-between gap-4 uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} MercadeaIA · Todos los derechos reservados · Diseñado para emprendedores de forma transparente.</span>
          <div className="flex justify-center gap-4">
            <span className="hover:text-zinc-800 cursor-pointer">Términos de servicio</span>
            <span>·</span>
            <span className="hover:text-zinc-800 cursor-pointer">Política de privacidad</span>
          </div>
        </div>
      </footer>


    </div>
  );
}
