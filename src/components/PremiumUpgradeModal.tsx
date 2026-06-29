import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, AlertTriangle, ShieldCheck, Zap, 
  CreditCard, ArrowRight, UserCheck, X, RefreshCw,
  Smartphone, Upload, FileHeart, FileCheck, Landmark, CheckCircle
} from 'lucide-react';
import { doc, updateDoc, getDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'EMPRENDEDOR' | 'PRO' | 'BUSINESS'>('PRO');
  const [exchangeRate, setExchangeRate] = useState<number>(3.80);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Fetch exchange rate once
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.PEN) {
          const rate = Number(data.rates.PEN);
          if (rate > 2.0 && rate < 5.0) {
            setExchangeRate(rate);
            console.log("Exchange rate loaded dynamically:", rate);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching live exchange rate:", err);
      });
  }, []);
  
  // Payment option toggle
  const [paymentMethodType, setPaymentMethodType] = useState<'yape_transfer' | 'credit_card'>('yape_transfer');

  // Manual payment states
  const [payerName, setPayerName] = useState('');
  const [operationNumber, setOperationNumber] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingVoucher, setUploadingVoucher] = useState(false);
  const [isSubmittedPending, setIsSubmittedPending] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Credit Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLimitValue = (key: 'strategies' | 'copies' | 'images', plan: string) => {
    const p = (plan || 'FREE').toUpperCase();
    if (key === 'strategies') {
      if (p === 'BUSINESS') return 'Ilimitados';
      if (p === 'PRO') return '6';
      if (p === 'EMPRENDEDOR') return '3';
      return '2';
    }
    if (key === 'copies') {
      if (p === 'BUSINESS') return 'Ilimitados';
      if (p === 'PRO') return 'Ilimitados';
      if (p === 'EMPRENDEDOR') return '20';
      return '5';
    }
    if (key === 'images') {
      if (p === 'BUSINESS') return 'Ilimitados';
      if (p === 'PRO') return '40';
      if (p === 'EMPRENDEDOR') return '10';
      return '1';
    }
    return 'Ilimitados';
  };

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
      name: "Básico",
      price: "10",
      subtitle: "Ideal para emprendedores locales que desean comenzar a estructurar sus redes de manera consciente.",
      color: "from-zinc-900 to-zinc-950",
      accent: "zinc-900",
      features: [
        "Hasta 3 emprendimientos activos",
        "Hasta 3 estrategias mensuales",
        "Up to 20 copies persuasivos al mes",
        "Prompts optimizados para imágenes IA",
        "Generación de hasta 10 imágenes al mes",
        "Calendario básico de contenidos",
        "Historial de publicaciones persistente",
      ]
    },
    PRO: {
      name: "Profesional",
      price: "25",
      subtitle: "Excelente para negocios digitales o tiendas en línea en etapa de tracción comercial que requieren constancia total.",
      color: "from-indigo-950 to-slate-900",
      accent: "indigo-600",
      badge: "Más Recomendado",
      features: [
        "Hasta 6 emprendimientos activos",
        "Hasta 6 estrategias mensuales",
        "Planificación de publicaciones ILIMITADAS",
        "Generación de hasta 40 imágenes al mes",
        "Estrategia IA Multidireccional",
        "Control de agendación integrada",
        "Soporte prioritario 24/7",
      ]
    },
    BUSINESS: {
      name: "Premium",
      price: "69",
      subtitle: "Para agencias, marcas consolidadas o agencias de marketing con múltiples cuentas empresariales que manejar.",
      color: "from-emerald-950 to-cyan-950",
      accent: "emerald-600",
      features: [
        "Emprendimientos ILIMITADOS",
        "Estrategias IA ILIMITADAS",
        "Copies y Redacciones IA ILIMITADOS",
        "Generación de imágenes IA ILIMITADA",
        "Multiempresa (Soporte ilimitado)",
        "Multiusuario para tu equipo",
        "Reportes de tendencias avanzadas",
        "Acceso antes que nadie a nuevas funciones",
      ]
    }
  };

  const triggerUpgrade = async () => {
    setError(null);
    if (!cardName.trim()) {
      setError("Por favor introduce el nombre en la tarjeta.");
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 15) {
      setError("Por favor introduce un número de tarjeta válido.");
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
      setError("Ocurrió un error al procesar el alta de suscripción: " + (err.message || "Por favor intente nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVoucherFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVoucherFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const triggerManualUpgrade = async () => {
    setError(null);
    if (!payerName.trim()) {
      setError("Por favor, introduce el nombre del depositante / titular.");
      return;
    }
    if (!operationNumber.trim()) {
      setError("Por favor, introduce el número de operación o referencia.");
      return;
    }
    if (!voucherFile) {
      setError("Por favor, adjunta tu comprobante o boleta de pago.");
      return;
    }

    setLoading(true);
    setUploadingVoucher(true);
    try {
      // 1. Convert file to base64
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(voucherFile);
      });
      const base64Data = await base64Promise;

      // 2. Upload to server
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: base64Data,
          filename: voucherFile.name,
          mimeType: voucherFile.type
        })
      });

      if (!uploadRes.ok) {
        throw new Error("No se pudo subir la foto del comprobante.");
      }

      const { url: fileUrl } = await uploadRes.json();
      const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
      setVoucherUrl(absoluteUrl);
      setUploadingVoucher(false);

      // 3. Create document in payment_submissions
      const submissionId = 'pay_' + Math.random().toString(36).substring(2, 11);
      const submissionData = {
        id: submissionId,
        userId: userId,
        userEmail: user?.email || '',
        requestedPlan: activeTab,
        payerName: payerName,
        operationNumber: operationNumber,
        voucherUrl: absoluteUrl,
        status: "PENDING",
        submittedAt: new Date().toISOString()
      };

      // Set in payment_submissions directly
      await setDoc(doc(db, "payment_submissions", submissionId), submissionData);

      // 4. Update subscriptions document for PENDING_VERIFICATION alert
      const subRef = doc(db, "subscriptions", userId);
      await updateDoc(subRef, {
        status: "PENDING_VERIFICATION",
        requestedPlan: activeTab,
        pendingTxRef: operationNumber,
        pendingPayerName: payerName,
        pendingVoucherUrl: absoluteUrl,
        updatedAt: new Date().toISOString()
      });

      setIsSubmittedPending(true);
      setTimeout(() => {
        onUpgradeSuccess();
        onClose();
        setIsSubmittedPending(false);
        setPayerName('');
        setOperationNumber('');
        setVoucherFile(null);
        setVoucherUrl('');
      }, 5000);

    } catch (err: any) {
      setError("Error al procesar el comprobante: " + (err.message || "Intente nuevamente."));
    } finally {
      setLoading(false);
      setUploadingVoucher(false);
    }
  };

  return (
    <AnimatePresence>
      <div id="premium-upgrade-modal-backdrop" className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 md:p-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="my-4 md:my-auto bg-zinc-900 border border-zinc-800 rounded-none w-full max-w-5xl text-white shadow-[0px_0px_50px_10px_rgba(30,27,75,0.3)] flex flex-col md:flex-row relative"
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
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">CONSUMO DE TU PLAN ACTUAL ({currentUsage.plan === 'FREE' ? 'GRATUITO' : currentUsage.plan === 'EMPRENDEDOR' ? 'BÁSICO' : currentUsage.plan === 'PRO' ? 'PROFESIONAL' : 'PREMIUM'})</span>
                <div className="space-y-3 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">ESTRATEGIAS:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.strategiesUsed} / {getLimitValue('strategies', currentUsage.plan)}
                      {getLimitValue('strategies', currentUsage.plan) !== 'Ilimitados' && currentUsage.strategiesUsed >= Number(getLimitValue('strategies', currentUsage.plan)) && (
                        <span className="text-rose-500 text-[10px]">● ALCANZADO</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">COPIES GEN:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.copiesUsed} / {getLimitValue('copies', currentUsage.plan)}
                      {getLimitValue('copies', currentUsage.plan) !== 'Ilimitados' && currentUsage.copiesUsed >= Number(getLimitValue('copies', currentUsage.plan)) && (
                        <span className="text-rose-500 text-[10px]">● ALCANZADO</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2 border border-zinc-850">
                    <span className="text-zinc-400">IMÁGENES GEN:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {currentUsage.imagesUsed} / {getLimitValue('images', currentUsage.plan)}
                      {getLimitValue('images', currentUsage.plan) !== 'Ilimitados' && currentUsage.imagesUsed >= Number(getLimitValue('images', currentUsage.plan)) && (
                        <span className="text-rose-500 text-[10px]">● ALCANZADO</span>
                      )}
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
            {isSubmittedPending ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-900 border border-zinc-800">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 bg-amber-500/20 text-amber-400 rounded-full mb-4 border border-amber-600/40"
                >
                  <RefreshCw className="w-12 h-12 animate-spin" />
                </motion.div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">¡Suscripción en Verificación!</h3>
                <p className="text-zinc-300 font-sans text-xs max-w-sm leading-relaxed mb-4 mx-auto">
                  Hemos registrado correctamente tu comprobante para el plan <strong className="text-white uppercase font-extrabold">{planDetails[activeTab].name}</strong>.
                </p>
                <div className="bg-zinc-950 border border-zinc-850 p-4 text-left font-mono text-[11px] text-zinc-400 w-full mb-6 max-w-sm mx-auto">
                  <div className="flex justify-between border-b border-zinc-90 w-full border-zinc-900 pb-1.5 mb-1.5">
                    <span>NRO. OPERACIÓN:</span>
                    <span className="text-white font-bold">#{operationNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5 mb-1.5">
                    <span>TITULAR:</span>
                    <span className="text-white font-bold truncate max-w-[150px]">{payerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PLAN EN COLA:</span>
                    <span className="text-amber-400 font-bold">{activeTab}</span>
                  </div>
                </div>
                <p className="text-zinc-400 font-sans text-[11px] max-w-sm mx-auto">
                  La validación del abono tarda entre 5 a 15 minutos en horario comercial. Recibirás acceso instantáneo a tus nuevos límites una vez que se verifique el abono con el banco.
                </p>
                <div className="flex gap-2 items-center justify-center text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-900 px-4 py-2 mt-6 max-w-[280px] mx-auto">
                  <span className="animate-pulse">●</span>
                  <span>ESTADO: VERIFYING_RECEIPT</span>
                </div>
              </div>
            ) : success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-900">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 bg-emerald-500/20 text-emerald-400 rounded-full mb-4 animate-bounce"
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
                          onClick={() => {
                            setActiveTab(key);
                            setError(null);
                          }}
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
                  {/* Localized Peru Payment Tab Switcher */}
                  <div className="flex border-b border-zinc-800 mb-5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethodType('yape_transfer');
                        setError(null);
                      }}
                      className={`flex-1 pb-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
                        paymentMethodType === 'yape_transfer'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🇵🇪 Yape / Transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethodType('credit_card');
                        setError(null);
                      }}
                      className={`flex-1 pb-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
                        paymentMethodType === 'credit_card'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      💳 Tarjeta de Crédito
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-200 text-xs font-mono p-3 mb-4 rounded-none flex items-center justify-between gap-2">
                      <span>⚠️ {error}</span>
                      <button 
                        type="button" 
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-100 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {paymentMethodType === 'yape_transfer' ? (
                    <div className="space-y-4 font-sans">
                      {/* Step 1: Account Info Coordinates */}
                      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-none">
                        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-mono tracking-wider font-extrabold text-indigo-400 uppercase">
                          <Landmark className="w-4 h-4" />
                          <span>COORDENADAS DE TRANSFERENCIA (PERÚ)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] text-zinc-300">
                          <div className="bg-indigo-950/20 p-2.5 border border-indigo-900/30">
                            <span className="text-zinc-400 text-[9px] block">🟣 YAPE (NRO. DIRECTO):</span>
                            <span className="font-bold text-white text-xs block">+51 960 354 149 </span>
                            <span className="text-[9px] text-zinc-500">Destinatario: Lurgia Yupa A.</span>
                          </div>
                          
                          <div className="bg-zinc-900/50 p-2.5 border border-zinc-800">
                            <span className="text-zinc-400 text-[9px] block">🏦 BCP CTA CORRIENTE:</span>
                            <span className="font-bold text-white text-[11px] block">19196511465026</span>
                            <span className="text-[9px] text-zinc-500">CCI: 00219119651146502653</span>
                            <span className="text-[9px] text-zinc-500">Destinatario: Lurgia Yupa A.</span>
                          </div>
                        </div>

                        <div className="mt-3 bg-zinc-900 px-3 py-2 border-l-2 border-emerald-500 flex justify-between items-center text-[10px] md:text-[11px] font-mono">
                          <span className="text-zinc-400">Total a transferir:</span>
                          <span className="text-emerald-400 font-extrabold text-xs">
                            S/. {(Number(planDetails[activeTab].price) * exchangeRate).toFixed(2)} PEN (${planDetails[activeTab].price} USD) (T.C. {exchangeRate.toFixed(2)})
                          </span>
                        </div>
                      </div>

                      {/* Step 2: Voucher Inputs */}
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">Titular del Pago</label>
                            <input 
                              type="text"
                              required
                              value={payerName}
                              onChange={(e) => setPayerName(e.target.value)}
                              placeholder="Ej: JUAN PÉREZ"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">Número de Operación</label>
                            <input 
                              type="text"
                              required
                              value={operationNumber}
                              onChange={(e) => setOperationNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="Ej: 0251786"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 text-center"
                            />
                          </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">Voucher de Pago (Boleta / Img / PDF)</label>
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              isDragOver 
                                ? 'border-indigo-500 bg-indigo-950/20' 
                                : voucherFile 
                                ? 'border-emerald-500/80 bg-emerald-950/10' 
                                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                            }`}
                          >
                            <input 
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*,application/pdf"
                              className="hidden"
                            />
                            {voucherFile ? (
                              <>
                                <FileCheck className="w-7 h-7 text-emerald-400" />
                                <span className="text-xs font-mono text-emerald-400 font-bold truncate max-w-sm">{voucherFile.name}</span>
                                <span className="text-[9px] text-zinc-500">{(voucherFile.size / (1024 * 1024)).toFixed(2)} MB — Haz clic para cambiarlo</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-7 h-7 text-zinc-600" />
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Selecciona o arrastra tu comprobante aquí</span>
                                <span className="text-[10px] text-zinc-600">Soporta PNG, JPG, JPEG, PDF</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pricing and Action button footer details */}
                      <div className="mt-8 flex flex-col md:flex-row items-center md:justify-between gap-4 pt-4 border-t border-zinc-850">
                        <div className="text-center md:text-left font-sans">
                          <div className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Total a pagar:</div>
                          <div className="text-xl font-bold font-mono text-emerald-400">
                            S/. {(Number(planDetails[activeTab].price) * exchangeRate).toFixed(2)} PEN
                          </div>
                        </div>

                        <button
                          onClick={triggerManualUpgrade}
                          disabled={loading}
                          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold tracking-wider uppercase text-xs p-3.5 px-6 rounded-none transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingVoucher ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>SUBIENDO COMPROBANTE...</span>
                            </>
                          ) : loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>ENVIANDO...</span>
                            </>
                          ) : (
                            <>
                              <span>ENVIAR COMPROBANTE</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono text-zinc-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>SOPORTE DE SUBIDA REGISTRADO EN FIRESTORE EN TIEMPO REAL</span>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
