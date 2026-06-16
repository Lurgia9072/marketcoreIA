import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, AlertTriangle, ShieldCheck, Zap, 
  CreditCard, ArrowRight, UserCheck, X, RefreshCw 
} from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PremiumUpgradeModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
  currentUsage: {
    plan: string;
    status: string;
    copiesUsed: number;
    imagesUsed: number;
    strategiesUsed: number;
    weeklyPlansUsed: number;
  };
}

const MOTIVATIONAL_QUOTES = [
  "La consistencia supera al talento. Tu audiencia te comprará cuando te vea activo todos los días.",
  "Delegar las redacciones de tus copias a nuestra IA entrenada te recuperará de 10 a 15 horas cada semana.",
  "Una sola publicación altamente persuasiva puede financiar por completo todo tu año de suscripción en minutos.",
  "Establecer un cronograma continuo de publicaciones incrementa tu alcance orgánico semanal hasta un 270%.",
  "No dejes que tu marca se enfríe en redes. Automatiza y escala el branding de tu negocio hoy."
];

export default function PremiumUpgradeModal({ 
  userId, 
  isOpen, 
  onClose, 
  onUpgradeSuccess,
  currentUsage 
}: PremiumUpgradeModalProps) {
  const [activeTab, setActiveTab] = useState<'EMPRENDEDOR' | 'PRO' | 'BUSINESS'>('PRO');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Rotating quotes timer
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number to 4-digit groups
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    const formatted = val.length >= 2 ? `${val.substring(0, 2)}/${val.substring(2)}` : val;
    setCardExpiry(formatted);
  };

  const planDetails = {
    EMPRENDEDOR: {
      name: "Emprendedor",
      price: "19",
      subtitle: "Para marcas independientes listas para brillar",
      color: "from-zinc-900 to-zinc-950",
      accent: "zinc-900",
      features: [
        "Estrategias Mensuales IA: Ilimitadas",
        "Planes de Cronograma Semanales: Ilimitados",
        "Copies y Redacciones IA: 60/mes",
        "Imágenes IA de alta densidad: 20/mes",
        "Soporte rápido vía Email",
      ]
    },
    PRO: {
      name: "Profesional",
      price: "39",
      subtitle: "El estándar dorado de crecimiento acelerado",
      color: "from-indigo-950 to-slate-900",
      accent: "indigo-600",
      badge: "Más Recomendado",
      features: [
        "Estrategias Mensuales IA: Ilimitadas",
        "Planes de Cronograma Semanales: Ilimitados",
        "Copies y Redacciones IA: 200/mes",
        "Imágenes IA de alta densidad: 80/mes",
        "Análisis IA Avanzado de Fotos y Videos",
        "Soporte Prioritario VIP",
      ]
    },
    BUSINESS: {
      name: "Agencia y Negocios",
      price: "89",
      subtitle: "Máximo volumen sin límites de operación",
      color: "from-emerald-950 to-cyan-950",
      accent: "emerald-600",
      features: [
        "Estrategias Mensuales IA: Ilimitadas",
        "Planes de Cronograma Semanales: Ilimitados",
        "Copies y Redacciones IA: Ilimitados",
        "Imágenes IA de alta densidad: Ilimitados",
        "Análisis IA ilimitado de Contenido Multimedia",
        "Acompañamiento Estratégico 1-a-1",
      ]
    }
  };

  const triggerUpgrade = async () => {
    if (!cardName.trim()) {
      alert("Por favor introduce el nombre en la tarjeta.");
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 15) {
      alert("Por favor introduce un número de tarjeta válido.");
      return;
    }

    setLoading(true);
    try {
      // Direct Firestore sync database update! No mocks!
      const subRef = doc(db, "subscriptions", userId);
      await updateDoc(subRef, {
        plan: activeTab,
        status: "ACTIVE",
        // Reset counters instantly to unlock full capabilities
        copiesUsed: 0,
        imagesUsed: 0,
        strategiesUsed: 0,
        weeklyPlansUsed: 0,
        updatedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        onUpgradeSuccess();
        onClose();
        setSuccess(false);
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
      }, 2500);

    } catch (err: any) {
      console.error("Firestore upgrade failure:", err);
      alert("Ocurrió un error al procesar el alta de suscripción: " + (err.message || "Por favor intente nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div id="premium-upgrade-modal-backdrop" className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-none w-full max-w-6xl text-white shadow-[0px_0px_50px_10px_rgba(30,27,75,0.3)] overflow-hidden flex flex-col md:flex-row relative"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-450 hover:text-white transition cursor-pointer z-50 p-2 bg-zinc-800 hover:bg-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Panel: Progress Check and Revolutionary Value */}
          <div className="w-full md:w-5/12 bg-zinc-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-850">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-600/20 text-indigo-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">MEMBRESÍA MARKETING IA</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold font-sans tracking-tight leading-tight uppercase text-zinc-100">
                LLEVA TU MARCA AL SIGUIENTE NIVEL
              </h2>
              <p className="text-sm font-sans font-light text-zinc-400 mt-2 leading-relaxed">
                El acceso Gratuito te permitió diagnosticar tu potencial. Únete a marcas que incrementan su tráfico, ahorran horas de trabajo y cierran más clientes orgánicos de manera continua.
              </p>

              {/* Real-time Usage status check visualization */}
              <div className="bg-zinc-900 border border-zinc-800 p-4 mt-6">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">CONSUMO DE TU PLAN ACTUAL ({currentUsage.plan})</span>
                <div className="space-y-3 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">ESTRATEGIAS:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.strategiesUsed} / {currentUsage.plan === 'FREE' ? '2' : 'Ilimitados'}
                      {currentUsage.plan === 'FREE' && currentUsage.strategiesUsed >= 2 && <span className="text-rose-500 text-[10px]">● ALCANZADO</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400 font-mono">PLANES SEMANALES:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.weeklyPlansUsed} / {currentUsage.plan === 'FREE' ? '4' : 'Ilimitados'}
                      {currentUsage.plan === 'FREE' && currentUsage.weeklyPlansUsed >= 4 && <span className="text-rose-500 text-[10px]">● ALCANZADO</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">COPIES GEN:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.copiesUsed} / {currentUsage.plan === 'FREE' ? '5' : currentUsage.plan === 'EMPRENDEDOR' ? '60' : currentUsage.plan === 'PRO' ? '200' : 'Ilimitados'}
                      {currentUsage.plan === 'FREE' && currentUsage.copiesUsed >= 5 && <span className="text-rose-500 text-[10px]">● ALCANZADO</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">IMÁGENES GEN:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.imagesUsed} / {currentUsage.plan === 'FREE' ? '1' : currentUsage.plan === 'EMPRENDEDOR' ? '20' : currentUsage.plan === 'PRO' ? '80' : 'Ilimitados'}
                      {currentUsage.plan === 'FREE' && currentUsage.imagesUsed >= 1 && <span className="text-rose-500 text-[10px]">● ALCANZADO</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote of wisdom */}
            <div className="mt-8 bg-zinc-900 border border-zinc-850 p-4 border-l-4 border-indigo-500 min-h-[100px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs italic text-zinc-300 leading-relaxed font-sans"
                >
                  "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Plan select & Interactive Checkout */}
          <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-900">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 bg-emerald-500/20 text-emerald-400 rounded-full mb-4"
                >
                  <ShieldCheck className="w-12 h-12" />
                </motion.div>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">¡Suscripción Procesada!</h3>
                <p className="text-zinc-400 font-sans text-sm max-w-sm">
                  Hemos guardado tu plan premium de forma persistente en la nube. Tus límites se han reseteado para brindarte acceso ilimitado de inmediato.
                </p>
                <div className="flex gap-2 items-center text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-4 py-2 mt-6">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>UNLOCKED_STATUS: ACTIVE</span>
                </div>
              </div>
            ) : (
              <>
                {/* Tiers choosing header */}
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-3 text-center md:text-left">PROCESADOR DE ALTA PREFERENTE</span>
                  
                  {/* Grid of pricing selector */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(Object.keys(planDetails) as Array<'EMPRENDEDOR' | 'PRO' | 'BUSINESS'>).map((key) => {
                      const det = planDetails[key];
                      const isSelected = activeTab === key;
                      return (
                        <button 
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`border p-3.5 text-left transition relative cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-2 ring-indigo-505 ring-indigo-500' 
                              : 'border-zinc-805 border-zinc-800 hover:border-zinc-700 bg-zinc-950/30'
                          }`}
                        >
                          {'badge' in det && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] font-mono tracking-widest font-bold uppercase px-1.5 py-0.5 whitespace-nowrap">
                              {det.badge}
                            </span>
                          )}
                          <div className="text-sm font-sans font-bold text-zinc-100 block">{det.name}</div>
                          <div className="mt-1 flex items-baseline">
                            <span className="text-xl md:text-2xl font-bold font-mono text-white">${det.price}</span>
                            <span className="text-[10px] text-zinc-500 font-sans ml-1">/mes</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary of Selected Tiers */}
                  <div className="bg-zinc-950 border border-zinc-800 p-4 mb-6">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-mono font-bold text-indigo-400">
                      <Zap className="w-4 h-4" />
                      <span>INCLUYE EN PLAN {planDetails[activeTab].name.toUpperCase()}:</span>
                    </div>
                    <p className="text-xs font-sans text-zinc-400 font-light mb-3">
                      {planDetails[activeTab].subtitle}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
                      {planDetails[activeTab].features.map((feat, i) => (
                        <div key={i} className="flex gap-2 items-center text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Billing Block */}
                <div>
                  <h3 className="text-xs font-mono text-zinc-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-500" />
                    <span>MÉTODO DE PAGO ESTABLECIDO</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* card holder */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Nombre en la tarjeta</label>
                      <input 
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="EJ: MARIA GOMEZ"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {/* Card number */}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Número de Tarjeta</label>
                        <input 
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>
                      
                      {/* Expiry */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Fecha Venc.</label>
                        <input 
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/AA"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>

                      {/* CVC */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">CVC / CVV</label>
                        <input 
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          placeholder="***"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action button footer details */}
                  <div className="mt-8 flex flex-col md:flex-row items-center md:justify-between gap-4 pt-4 border-t border-zinc-850">
                    <div className="text-center md:text-left">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">Total facturado inmediato:</div>
                      <div className="text-2xl font-bold font-mono">
                        ${planDetails[activeTab].price} US$ <span className="text-xs text-zinc-400 font-sans font-light">/mes</span>
                      </div>
                    </div>

                    <button
                      onClick={triggerUpgrade}
                      disabled={loading}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-750 text-white font-mono font-bold tracking-wider uppercase text-xs p-3.5 px-6 rounded-none transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>PROCESANDO EN NUBE...</span>
                        </>
                      ) : (
                        <>
                          <span>ADQUIRIR PLAN {planDetails[activeTab].name.toUpperCase()}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>PROCESAMIENTO CIFRADO SSL REAL DESDE CONEXIÓN FIRESTORE SECURE</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
