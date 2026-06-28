import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  AlertCircle, 
  FileText, 
  Target, 
  Layers, 
  Cpu, 
  Calendar,
  X,
  HelpCircle,
  Clock,
  ArrowRight,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { MarketingStrategy, CalendarPost, UploadedMaterial } from '../types';

interface StrategyWizardProps {
  userId: string;
  business: {
    id: string;
    name: string;
    niche: string;
    description: string;
    targetAudience?: string;
    socialHandles?: {
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      twitter?: string;
    };
  };
  onClose: () => void;
  onSuccess: (newStrategy: MarketingStrategy, posts: CalendarPost[]) => void;
  onLimitExceeded?: (type: string) => void;
}

const OBJ_OPTIONS = [
  "Conseguir más seguidores",
  "Conseguir más ventas",
  "Conseguir más mensajes por WhatsApp",
  "Conseguir más clientes potenciales",
  "Generar reconocimiento de marca",
  "Aumentar interacción",
  "Lanzar un producto nuevo",
  "Recuperar clientes",
  "Posicionar una marca personal",
  "Incrementar visitas al local",
  "Incrementar pedidos online"
];

export default function StrategyWizard({ userId, business, onClose, onSuccess, onLimitExceeded }: StrategyWizardProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Paso 1 State
  const [objectives, setObjectives] = useState<string[]>([]);
  const [customObjective, setCustomObjective] = useState('');
  const [duration, setDuration] = useState<'mensual' | 'quincenal' | 'semanal' | 'diario'>('mensual');

  // Paso 2 State
  const [networks, setNetworks] = useState<string[]>(['Instagram']);

  // Paso 3 State
  const [materialType, setMaterialType] = useState<'fotos' | 'videos' | 'ambos' | 'ninguno'>('ninguno');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMaterial[]>([]);
  const [uploading, setUploading] = useState(false);

  // Paso 4 State: File analyses
  const [analyzingFileId, setAnalyzingFileId] = useState<string | null>(null);

  // Paso 5 & 6 State: Strategy outputs from API
  const [generating, setGenerating] = useState(false);
  const [genStepMessage, setGenStepMessage] = useState('');
  const [strategyOutput, setStrategyOutput] = useState<any | null>(null);
  const [editablePosts, setEditablePosts] = useState<any[]>([]);

  // Toggle checklist utilities
  const handleToggleGoal = (goal: string) => {
    setObjectives(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleToggleNetwork = (net: string) => {
    setNetworks(prev => {
      const next = prev.includes(net) ? prev.filter(n => n !== net) : [...prev, net];
      return next;
    });
  };

  // Drag and drop / upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError(null);

    const filesArray = Array.from(e.target.files) as File[];
    const newUploads: UploadedMaterial[] = [];

    for (const file of filesArray) {
      try {
        const fileType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || "Fallo en el servidor");
        }

        const { url: downloadUrl } = await uploadRes.json();
        const absoluteUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`;

        const materialId = 'mat_' + Math.random().toString(36).substring(2, 9);
        const materialObj: UploadedMaterial = {
          id: materialId,
          userId,
          businessId: business.id,
          name: file.name,
          type: fileType,
          url: absoluteUrl,
          size: file.size,
          createdAt: new Date().toISOString()
        };

        // Guardar record indexado en Firestore
        await setDoc(doc(db, `users/${userId}/materials`, materialId), materialObj);
        newUploads.push(materialObj);
      } catch (err: any) {
        console.error("Error uploading file: ", err);
        setError("Error al subir algunos archivos al servidor de marketing. Reintenta.");
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploads]);
    setUploading(false);
  };

  // Call API for analyzing files
  const analyzeMaterialFile = async (material: UploadedMaterial) => {
    setAnalyzingFileId(material.id);
    setError(null);
    try {
      const res = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: material.url,
          type: material.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: material.name
        })
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener análisis detallado.");
      }

      const analysis = await res.json();
      
      // Actualizar en Firestore
      const updatedMat = { ...material, analysis };
      await setDoc(doc(db, `users/${userId}/materials`, material.id), updatedMat);
      
      // Actualizar en State local
      setUploadedFiles(prev => prev.map(m => m.id === material.id ? updatedMat : m));
    } catch (err: any) {
      console.error(err);
      setError("Fallo al analizar el archivo estético. Inténtenlo nuevamente.");
    } finally {
      setAnalyzingFileId(null);
    }
  };

  // Multi-step form routing validations
  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (objectives.length === 0 && !customObjective.trim()) {
        setError("Por favor selecciona al menos un objetivo de la lista u otro personalizado.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (networks.length === 0) {
        setError("Debe seleccionar al menos una red social objetivo.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  // Core API builder strategy trigger
  const triggerStrategyAI = async () => {
    setGenerating(true);
    setGenStepMessage('Analizando audiencia nicho y marca...');
    setError(null);

    // Build the list of goals to display/send
    const finalGoalsList = [...objectives];
    if (customObjective.trim()) {
      finalGoalsList.push(customObjective.trim());
    }

    // Prepare uploaded files context summary to send
    const uploadsSummary = uploadedFiles.map(file => {
      const typeLabel = file.type === 'image' ? 'Imagen' : 'Video';
      const analysisInfo = file.analysis 
        ? `[Análisis: Product = ${file.analysis.productShown}, Quality = ${file.analysis.quality}, Recs = ${file.analysis.recommendations.join("; ")}]`
        : '[Sin análisis directo]';
      return `- Archivo: ${file.name} (${typeLabel}) ${analysisInfo}`;
    }).join('\n');

    try {
      setTimeout(() => setGenStepMessage('Redactando diagnóstico inicial...'), 2000);
      setTimeout(() => setGenStepMessage('Estructurando objetivos y sugerencia de KPI...'), 4000);
      setTimeout(() => {
        if (duration === 'diario') {
          setGenStepMessage('Diseñando propuesta de publicación de alto impacto para hoy...');
        } else if (duration === 'semanal') {
          setGenStepMessage('Diseñando 1 semana de cronograma editorial progresivo...');
        } else if (duration === 'quincenal') {
          setGenStepMessage('Diseñando 15 días de contenido comercial estructurado...');
        } else {
          setGenStepMessage('Diseñando 4 semanas de cronograma editorial completo...');
        }
      }, 6000);
      setTimeout(() => setGenStepMessage('Redactando copies premium con IA...'), 8500);
 console.log("ANTES DE LLAMAR GIMINIA");
      const res = await fetch('https://marketcore-backend-l6dq.onrender.com/api/generate-complete-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: business.name,
          niche: business.niche,
          description: business.description,
          targetAudience: business.targetAudience,
          socialHandles: business.socialHandles,
          objectivesSelected: finalGoalsList,
          socialNetworksSelected: networks,
          materialType,
          uploadedAnalysisSummary: uploadsSummary || null,
          duration
        })
      });
 console.log("ENTRÓ AL ENDPOINT");
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error("⚠️ Error de conexión con el Backend (https://marketcore-backend-l6dq.onrender.com/api/generate-complete-strategy no disponible 1). Si publicaste tu app en hosting estático (como Firebase Hosting tradicional), recuerda que este proyecto requiere un servidor Node.js/Cloud Run activo para ejecutar la Inteligencia Artificial de forma segura.");
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("⚠️ El servidor backend no devolvió JSON válido. Verifica que el servidor Express Node.js esté funcionando correctamente.");
      }

      if (!res.ok) {
        if (data.error === "LIMIT_EXCEEDED") {
          if (onLimitExceeded) {
            onLimitExceeded(data.type || "strategies");
          }
          throw new Error("Socio IA: Has superado el límite de Estrategias en tu Plan Gratuito. Por favor actualiza para continuar.");
        }
        throw new Error(data.error || "El Analista IA no pudo finalizar la estrategia de marketing. Verifica tu Clave API o servidor.");
      }

      setStrategyOutput(data);
      if (data && data.posts) {
        const preppedPosts = data.posts.map((p: any, idx: number) => {
          const defaultDates: Record<number, string> = {
            1: 'Lunes de la Semana 1',
            2: 'Miércoles de la Semana 2',
            3: 'Lunes de la Semana 3',
            4: 'Miércoles de la Semana 4'
          };
          const scheduledDate = p.scheduledDate || defaultDates[p.weekNum || 1] || 'Lunes de la Semana 1';
          return {
            id: p.id || 'temp_post_' + idx + '_' + Math.random().toString(36).substring(2, 6),
            title: p.title || `Publicación ${idx + 1}`,
            copy: p.copy || '',
            cta: p.cta || '',
            hashtags: p.hashtags || [],
            channel: p.channel || 'Instagram',
            scheduledDate: scheduledDate,
            scheduledTime: p.scheduledTime || '18:00',
            type: p.type || 'Imagen',
            imageUrlPrompt: p.imageUrlPrompt || '',
            status: 'Borrador',
            weekNum: p.weekNum || Math.ceil((idx + 1) / 2),
            priority: p.priority || 'Media',
            objective: p.objective || 'Venta'
          };
        });
        setEditablePosts(preppedPosts);
      } else {
        setEditablePosts([]);
      }
      setStep(6); // Go directly to step 6 (Review Strategy and parameters)
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error inesperado armando tu estrategia.");
    } finally {
      setGenerating(false);
    }
  };

  // Convert step 6 output into official Firebase calendar docs
  const handleConfirmAndSave = async () => {
    if (!strategyOutput) return;
    setGenerating(true);
    setError(null);

    try {
      // 1. Create Strategy doc
      const stratId = 'strat_' + Math.random().toString(36).substring(2, 9);
      const stratObj: MarketingStrategy = {
        id: stratId,
        userId,
        businessId: business.id,
        title: strategyOutput.title || `Estrategia de ${business.name}`,
        summary: strategyOutput.summary || '',
        objectivesSelected: [...objectives, customObjective].filter(Boolean),
        socialNetworksSelected: networks,
        materialType,
        diagnostic: strategyOutput.diagnostic || '',
        mainGoal: strategyOutput.mainGoal || '',
        secondaryGoals: strategyOutput.secondaryGoals || [],
        suggestedKPIs: strategyOutput.suggestedKPIs || [],
        targetAudience: strategyOutput.targetAudience || '',
        recommendedTone: strategyOutput.recommendedTone || '',
        recommendedContentType: strategyOutput.recommendedContentType || '',
        recommendedFrequency: strategyOutput.recommendedFrequency || '',
        socialDistribution: strategyOutput.socialDistribution || '',
        weeklyPlan: strategyOutput.weeklyPlan || [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${userId}/strategies`, stratId), stratObj);

      // 2. Create posts as CalendarPost documents
      const createdPosts: CalendarPost[] = [];
      const postsList = editablePosts;

      for (let i = 0; i < postsList.length; i++) {
        const item = postsList[i];
        const postId = 'post_' + Math.random().toString(36).substring(2, 9);

        const postObj: CalendarPost = {
          id: postId,
          userId,
          businessId: business.id,
          strategyId: stratId,
          title: item.title || `Publicación ${i + 1}`,
          copy: item.copy || '',
          cta: item.cta || '',
          hashtags: item.hashtags || [],
          channel: item.channel || 'Instagram',
          scheduledDate: item.scheduledDate || 'Lunes de la Semana 1',
          scheduledTime: item.scheduledTime || '18:00',
          type: item.type || (materialType === 'videos' ? 'Reel' : 'Imagen'),
          imageUrlPrompt: item.imageUrlPrompt || '',
          imageUrl: item.imageUrl || '',
          videoUrl: item.videoUrl || '',
          status: item.status || 'Borrador',
          weekNum: Number(item.weekNum) || 1,
          priority: item.priority || 'Media',
          objective: item.objective || 'Venta',
          createdAt: new Date().toISOString()
        };

        // Save to Firestore
        await setDoc(doc(db, `users/${userId}/calendar`, postId), postObj);
        createdPosts.push(postObj);
      }

      onSuccess(stratObj, createdPosts);
    } catch (err: any) {
      console.error(err);
      setError("Error al persistir documentos en Firebase Firestore.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 md:p-10 overflow-y-auto">
      <div className="bg-white border-2 border-zinc-200 w-full max-w-5xl rounded-none shadow-[20px_20px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between max-h-[90vh] overflow-hidden">
        
        {/* Header bar */}
        <div className="px-6 py-5 border-b-2 border-zinc-200 flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-100 p-2.5 rounded-none border border-zinc-200">
              <Rocket className="w-4 h-4 text-zinc-700" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase block text-zinc-505">PLANIFICADOR ESTRATÉGICO IA</span>
              <h2 className="font-sans font-extrabold text-base text-zinc-900 uppercase tracking-wide">
                NUEVO FLUJO {
                  duration === 'diario' 
                    ? 'DIARIO (1 DÍA)' 
                    : duration === 'semanal' 
                      ? 'SEMANAL (1 SEMANA)' 
                      : duration === 'quincenal' 
                        ? 'QUINCENAL (15 DÍAS)' 
                        : 'MENSUAL (30 DÍAS)'
                }: {business.name}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 p-2 border border-transparent hover:border-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard track indicator bar */}
        <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200 flex flex-wrap justify-between items-center text-[10px] font-mono text-zinc-500 gap-2">
          <div className="flex items-center gap-1.5 md:gap-3">
            <span className={`${step >= 1 ? 'text-zinc-900 font-bold' : ''}`}>1. OBJETIVO</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step >= 2 ? 'text-zinc-900 font-bold' : ''}`}>2. RED SOCIAL</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step >= 3 ? 'text-zinc-900 font-bold' : ''}`}>3. MATERIALES</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step >= 4 ? 'text-zinc-900 font-bold' : ''}`}>4. ANÁLISIS IA</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step >= 5 ? 'text-zinc-900 font-bold' : ''}`}>5. PROPUESTA IA</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step >= 6 ? 'text-zinc-900 font-bold' : ''}`}>6. REVISIÓN Y GUARDADO</span>
          </div>
          <span className="bg-white border border-zinc-200 px-2 py-0.5 text-zinc-750 font-bold">Paso {step === 6 ? 6 : step}/6</span>
        </div>

        {/* Global errors alerts */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-rose-850 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span className="uppercase tracking-wide">{error}</span>
          </div>
        )}

        {/* Main interactive screens */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto bg-white">
          
          {generating ? (
            <div className="min-h-[45vh] flex flex-col items-center justify-center text-center p-6 gap-5">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-200 border-t-zinc-900 rounded-none animate-spin"></div>
                <Rocket className="w-4 h-4 text-zinc-700 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-zinc-900 uppercase tracking-wider mb-1.5">El director creativo de marketcore está estructurando tu campaña...</h3>
                <p className="text-zinc-500 text-xs font-sans font-light max-w-sm mx-auto leading-relaxed italic">
                  "{genStepMessage}"
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1 - DURACIÓN Y OBJETIVOS */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  {/* Select Duration */}
                  <div className="border-b border-zinc-200 pb-6 mb-2">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-3 uppercase tracking-widest">DURACIÓN DEL PLAN / CRONOGRAMA</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'mensual', label: 'Mensual (30 días)', desc: 'Plan de 4 semanas (8 publicaciones)' },
                        { key: 'quincenal', label: 'Quincenal (15 días)', desc: 'Plan de 2 semanas (4 publicaciones)' },
                        { key: 'semanal', label: 'Semanal (7 días)', desc: 'Plan de 1 semana (2 publicaciones)' },
                        { key: 'diario', label: 'Diario (1 día)', desc: 'Publicación única de alto impacto' }
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setDuration(opt.key as any)}
                          className={`text-left p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                            duration === opt.key 
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(113,113,122,1)]' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase tracking-wide">{opt.label}</span>
                          <span className={`text-[9.5px] mt-1 font-sans font-light ${duration === opt.key ? 'text-zinc-300' : 'text-zinc-500'}`}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-sans font-extrabold text-zinc-900 text-lg uppercase tracking-tight mb-1">
                      ¿Qué deseas lograr con {business.name}?
                    </h3>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed">
                      Selecciona una o varias metas importantes para que nuestra IA pueda sugerir copys y llamados a la acción bien encauzados de forma realista.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {OBJ_OPTIONS.map((goal, idx) => {
                      const active = objectives.includes(goal);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleGoal(goal)}
                          className={`text-left p-4 rounded-none border text-xs font-bold transition flex items-center justify-between gap-2.5 ${
                            active 
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(113,113,122,1)]' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'
                          }`}
                        >
                          <span className="uppercase tracking-wide leading-relaxed">{goal}</span>
                          {active && <Check className="w-4 h-4 flex-shrink-0 text-white bg-zinc-900 border border-zinc-700" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-zinc-200">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-2 uppercase tracking-widest">OTRO OBJETIVO PERSONALIZADO</label>
                    <input
                      type="text"
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      placeholder="ej: Deseas potenciar las suscripciones a tu newsletter semanal..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-3 px-4 text-xs text-zinc-900 focus:border-zinc-550 focus:outline-none placeholder-zinc-400 font-sans"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2 - RED SOCIAL OBJETIVO */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-sans font-extrabold text-zinc-900 text-lg uppercase tracking-tight mb-1">
                      ¿Para qué red social deseas trabajar este mes?
                    </h3>
                    <p className="text-xs text-zinc-500 font-light">
                      Elige los canales de comunicación activos para los cuales se generarán las publicaciones del calendario. Puede seleccionar múltiples redes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['Facebook', 'Instagram', 'TikTok'].map((net) => {
                      const isSelected = networks.includes(net);
                      return (
                        <button
                          key={net}
                          onClick={() => handleToggleNetwork(net)}
                          className={`p-6 border rounded-none text-center flex flex-col items-center justify-center gap-3 transition ${
                            isSelected 
                              ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-[4px_4px_0px_0px_rgba(113,113,122,1)]' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-505 hover:text-zinc-900 hover:border-zinc-405 hover:bg-zinc-100'
                          }`}
                        >
                          <div className={`p-3 rounded-none border ${isSelected ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                            {net === 'Facebook' && <span className="font-bold text-lg font-mono">F</span>}
                            {net === 'Instagram' && <span className="font-bold text-lg font-mono">I</span>}
                            {net === 'TikTok' && <span className="font-bold text-lg font-mono">T</span>}
                          </div>
                          <span className="font-mono text-xs uppercase tracking-widest">{net}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 3 - RECURSOS DISPONIBLES (FOTOS / VIDEOS) */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-sans font-extrabold text-zinc-900 text-lg uppercase tracking-tight mb-1">
                      ¿Ya tienes material real para trabajar este mes?
                    </h3>
                    <p className="text-xs text-zinc-500 font-light">
                      Selecciona con qué recursos gráficos cuentas en este momento para tus publicaciones mensuales.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-[10px]">
                    {[
                      { key: 'fotos', label: 'Tengo fotos' },
                      { key: 'videos', label: 'Tengo videos' },
                      { key: 'ambos', label: 'Tengo ambos' },
                      { key: 'ninguno', label: 'No tengo material' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setMaterialType(item.key as any)}
                        className={`p-4 border rounded-none text-center transition font-bold uppercase tracking-wide ${
                          materialType === item.key 
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(113,113,122,1)]' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-905 hover:bg-zinc-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {materialType !== 'ninguno' && (
                    <div className="mt-4 border-t border-zinc-200 pt-5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-3 uppercase tracking-widest">
                        Subir Imágenes o Videos a Firebase Storage
                      </label>

                      <div className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 p-8 text-center flex flex-col items-center justify-center gap-3 relative transition">
                        <Upload className="w-8 h-8 text-zinc-400" />
                        <div className="text-xs">
                          <span className="text-zinc-600 font-medium font-sans">Arrastra tus archivos aquí o </span>
                          <label className="text-zinc-900 underline font-bold cursor-pointer hover:text-zinc-650">
                            selecciona desde tu equipo
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*,video/*" 
                              onChange={handleFileUpload}
                              className="hidden" 
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">Formatos recomendados: JPG, PNG, MP4</p>
                      </div>

                      {uploading && (
                        <div className="flex items-center gap-2.5 bg-zinc-50 p-3 mt-3 border border-zinc-200 text-xs font-mono">
                          <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                          <span className="uppercase tracking-widest text-[9px] text-zinc-500">Subiendo archivos de forma real en Storage...</span>
                        </div>
                      )}

                      {/* Display Uploaded File Previews */}
                      {uploadedFiles.length > 0 && (
                        <div className="mt-5">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider block mb-2">RECURSOS SUBIDOS ACTUALMENTE ({uploadedFiles.length})</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {uploadedFiles.map((file) => (
                              <div key={file.id} className="bg-zinc-50 p-2.5 border border-zinc-200 flex flex-col gap-2 relative">
                                <div className="aspect-video bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
                                  {file.type === 'image' ? (
                                    <img src={file.url} alt={file.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="relative w-full h-full">
                                      <video src={file.url} className="w-full h-full object-cover" />
                                      <VideoIcon className="absolute top-2 left-2 w-4 h-4 text-white bg-zinc-950/80 p-0.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-[9px] font-mono font-bold text-zinc-700 truncate">{file.name}</p>
                                  <span className="text-[8px] font-mono text-zinc-550 italic block">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 4 - ANÁLISIS IA DE ARCHIVOS */}
              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-sans font-extrabold text-zinc-905 text-lg uppercase tracking-tight mb-1">
                      Auditoría Visual de Recursos con IA (Opcional)
                    </h3>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed">
                      Si has subido fotos o videos, el motor de marketcore puede analizarlos antes de armar la estrategia para conocer la iluminación, composición y branding del producto real, agregando valor técnico.
                    </p>
                  </div>

                  {uploadedFiles.length === 0 ? (
                    <div className="bg-zinc-50/50 border border-zinc-200 p-8 text-center text-xs font-mono text-zinc-500 uppercase tracking-widest">
                      No has cargado imágenes ni videos en el paso anterior. Puedes omitir y continuar.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {uploadedFiles.map((file) => {
                        const hasAnalysis = !!file.analysis;
                        const isAnalyzing = analyzingFileId === file.id;

                        return (
                          <div key={file.id} className="bg-zinc-50 p-5 border border-zinc-200 flex flex-col md:flex-row gap-5 items-start justify-between">
                            
                            {/* File graphic info */}
                            <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-1/4">
                              <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
                                {file.type === 'image' ? (
                                  <img src={file.url} referrerPolicy="no-referrer" alt="" className="object-cover w-full h-full" />
                                ) : (
                                  <VideoIcon className="w-6 h-6 text-zinc-500" />
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[10px] font-mono font-bold text-zinc-900 truncate">{file.name}</p>
                                <span className="text-[9px] bg-zinc-100 text-zinc-600 border border-zinc-250 py-0.5 px-1.5 uppercase font-mono mt-1 inline-block">
                                  {file.type}
                                </span>
                              </div>
                            </div>

                            {/* Analysis response text */}
                            <div className="flex-1 border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0 md:pl-5 text-xs">
                              {isAnalyzing ? (
                                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                                  <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                                  <span className="uppercase tracking-widest">marketcore está analizando este recurso estético...</span>
                                </div>
                              ) : hasAnalysis ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                  <div>
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase">PRODUCTO / CONTENIDO</span>
                                    <p className="text-zinc-700 font-sans font-light mt-0.5">{file.analysis?.productShown}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase">CALIDAD SENSORIAL</span>
                                    <p className="text-zinc-700 font-sans font-light mt-0.5">{file.analysis?.quality}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase">ILUMINACIÓN & FONDO</span>
                                    <p className="text-zinc-700 font-sans font-light mt-0.5">{file.analysis?.lighting} — {file.analysis?.background}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase">RECOMENDACIONES DE LA IA</span>
                                    <ul className="list-disc pl-4 text-zinc-700 space-y-0.5 mt-1 font-sans font-light">
                                      {file.analysis?.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] font-mono text-zinc-500 uppercase italic">Aún no se ha realizado análisis para este material.</p>
                              )}
                            </div>

                            {/* Trigger buttons */}
                            <button
                              type="button"
                              onClick={() => analyzeMaterialFile(file)}
                              disabled={isAnalyzing}
                              className="bg-white hover:bg-zinc-50 text-zinc-850 font-mono text-[9px] font-bold py-2 px-3 border border-zinc-250 transition rounded-none uppercase flex-shrink-0 cursor-pointer w-full md:w-auto mt-2 md:mt-0"
                            >
                              Analizar con IA
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 5 - TRIGGER / PROMPT GENERATION */}
              {step === 5 && (
                <div className="flex flex-col gap-6 text-center py-8">
                  <div className="bg-zinc-50 border border-zinc-200 p-6 inline-block mx-auto rounded-none">
                    <Cpu className="w-12 h-12 text-zinc-900 animate-pulse" />
                  </div>
                  
                  <div className="max-w-md mx-auto">
                    <h3 className="font-sans font-extrabold text-zinc-900 text-2xl uppercase tracking-tight mb-2">
                      ¡Todo listo para estructurar tu contenido {
                        duration === 'diario' 
                          ? 'diario' 
                          : duration === 'semanal' 
                            ? 'semanal' 
                            : duration === 'quincenal' 
                              ? 'quincenal' 
                              : 'mensual'
                      }!
                    </h3>
                    <p className="text-zinc-550 text-xs font-sans font-light leading-relaxed">
                      Nuestra Inteligencia Artificial de marketcore integrará tu diagnóstico, metas elegidas y el material indexado para planificar {
                        duration === 'diario' 
                          ? 'una publicación comercial única de alto impacto optimizada.' 
                          : duration === 'semanal'
                            ? 'una campaña comercial de 1 semana (2 publicaciones).'
                            : duration === 'quincenal'
                              ? 'una campaña comercial de 15 días (4 publicaciones).'
                              : 'una estrategia comercial sólida distribuida en 4 semanas (8 publicaciones).'
                      }
                    </p>
                  </div>

                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={triggerStrategyAI}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold py-4.5 px-8 rounded-none text-xs uppercase tracking-widest border-r-4 border-b-4 border-zinc-500 active:translate-y-0.5 cursor-pointer flex items-center gap-2 shadow-lg"
                    >
                      <Rocket className="w-5 h-5" /> GENERAR {
                        duration === 'diario' 
                          ? 'PUBLICACIÓN DIARIA' 
                          : duration === 'semanal' 
                            ? 'CRONOGRAMA SEMANAL' 
                            : duration === 'quincenal' 
                              ? 'CRONOGRAMA QUINCENAL' 
                              : 'ESTRATEGIA MENSUAL'
                      } IA
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 6 - REVISIÓN DE RESULTADOS GENERADOS */}
              {step === 6 && strategyOutput && (
                <div className="flex flex-col gap-8 text-left font-sans text-xs">
                  
                  {/* General details of strategy */}
                  <div className="bg-zinc-50 p-6 border border-zinc-200">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200 mb-4 text-zinc-500 font-mono font-bold uppercase text-[10px]">
                      <FileText className="w-4 h-4 text-zinc-900" /> 1. DIAGNÓSTICO ESTRATÉGICO IA
                    </div>
                    <h3 className="text-base font-extrabold text-zinc-900 uppercase tracking-wider mb-2">{strategyOutput.title}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-zinc-700 leading-relaxed font-light mt-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1">RESUMEN EJECUTIVO</span>
                        <p className="whitespace-pre-wrap">{strategyOutput.summary}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1">DIAGNÓSTICO SITUACIONAL</span>
                        <p className="whitespace-pre-wrap">{strategyOutput.diagnostic}</p>
                      </div>
                    </div>
                  </div>

                  {/* Strategic targets defined */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-zinc-50 p-5 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-2">OBJETIVO PRINCIPAL SMART</span>
                      <p className="text-zinc-805 font-medium leading-relaxed">{strategyOutput.mainGoal}</p>
                    </div>

                    <div className="bg-zinc-50 p-5 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-2">OBJETIVOS SECUNDARIOS</span>
                      <ul className="list-disc pl-4 text-zinc-750 space-y-1 font-light">
                        {strategyOutput.secondaryGoals?.map((goal: string, idx: number) => <li key={idx}>{goal}</li>)}
                      </ul>
                    </div>

                    <div className="bg-zinc-50 p-5 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-2">KPI SUGERIDOS DE MEDICIÓN</span>
                      <ul className="list-disc pl-4 text-zinc-750 space-y-1 font-mono text-[10px]">
                        {strategyOutput.suggestedKPIs?.map((kpi: string, idx: number) => <li key={idx} className="uppercase tracking-wider">{kpi}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Marketing directions (Tone, Type, Frequency) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-zinc-700">
                    <div className="bg-zinc-50 p-4 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1.5">TONO RECOMENDADO</span>
                      <p className="font-light leading-relaxed">{strategyOutput.recommendedTone}</p>
                    </div>
                    <div className="bg-zinc-50 p-4 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1.5">TIPOS DE CONTENIDO</span>
                      <p className="font-light leading-relaxed">{strategyOutput.recommendedContentType}</p>
                    </div>
                    <div className="bg-zinc-50 p-4 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1.5">FRECUENCIA Y HORARIOS</span>
                      <p className="font-light leading-relaxed">{strategyOutput.recommendedFrequency}</p>
                    </div>
                    <div className="bg-zinc-50 p-4 border border-zinc-200">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1.5">DISTRIBUCIÓN DE REDES</span>
                      <p className="font-light leading-relaxed">{strategyOutput.socialDistribution}</p>
                    </div>
                  </div>

                  {/* Weekly Plan detailed */}
                  <div className="border-t border-zinc-200 pt-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 mb-4 text-zinc-500 font-mono font-bold uppercase text-[10px]">
                      <Layers className="w-4 h-4 text-zinc-900" /> 2. PLAN DE PUBLICACIÓN {
                        duration === 'diario' 
                          ? 'DIARIO (1 DÍA)' 
                          : duration === 'semanal' 
                            ? 'SEMANAL (1 SEMANA)' 
                            : duration === 'quincenal' 
                              ? 'QUINCENAL (15 DÍAS)' 
                              : 'MENSUAL (4 SEMANAS)'
                      }
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {strategyOutput.weeklyPlan?.map((plan: any, idx: number) => (
                        <div key={idx} className="bg-zinc-50 p-4 border border-zinc-200 hover:border-zinc-400 transition shadow-2xs">
                          <span className="text-[10px] bg-zinc-900 text-white font-mono font-bold px-2 py-0.5 border border-zinc-705 uppercase inline-block mb-3 tracking-wider">
                            {plan.week}
                          </span>
                          <div className="space-y-3 font-sans text-xs">
                            <div>
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">OBJETIVO DE LA SEMANA</span>
                              <p className="text-zinc-800 mt-0.5 font-bold leading-normal">{plan.objective}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">TIPO DE CONTENIDO</span>
                              <p className="text-zinc-700 mt-0.5 font-light">{plan.contentType}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">CTA PRINCIPAL</span>
                              <p className="text-zinc-700 mt-0.5 font-light font-mono text-[10px] italic">"{plan.cta}"</p>
                            </div>
                            <div className="pt-2 border-t border-zinc-200">
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">KPI SEMANAL ESPERADO</span>
                              <span className="text-zinc-550 font-semibold font-mono text-[10px] uppercase block mt-0.5 tracking-wider">{plan.expectedKPI}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generated calendar posts listing */}
                  <div className="border-t border-zinc-200 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider uppercase block">
                          PUBLICACIONES GENERADAS LISTAS PARA TU CALENDARIO ({editablePosts.length})
                        </span>
                        <p className="text-[9.5px] font-mono text-zinc-500 mt-1 uppercase">
                          puedes programar, aprobar y ajustar cada post antes de guardarlos en tu agenda live
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {editablePosts.map((post: any, idx: number) => {
                        // helper to parse day name and weekNum
                        const parseDayVal = (dateStr: string): string => {
                          const val = (dateStr || '').toLowerCase();
                          if (val.includes('lun')) return 'Lunes';
                          if (val.includes('mar')) return 'Martes';
                          if (val.includes('mie') || val.includes('mié')) return 'Miércoles';
                          if (val.includes('jue')) return 'Jueves';
                          if (val.includes('vie')) return 'Viernes';
                          if (val.includes('sab') || val.includes('sáb')) return 'Sábado';
                          if (val.includes('dom')) return 'Domingo';
                          return 'Lunes';
                        };

                        const currDay = parseDayVal(post.scheduledDate);
                        const currWeek = Number(post.weekNum) || 1;

                        const handleFieldChange = (field: string, val: any) => {
                          setEditablePosts(prev => prev.map((p, i) => {
                            if (i === idx) {
                              const newPost = { ...p, [field]: val };
                              if (field === 'selectedDay') {
                                newPost.scheduledDate = `${val} de la Semana ${p.weekNum || 1}`;
                              } else if (field === 'weekNum') {
                                const parsedDay = parseDayVal(p.scheduledDate);
                                newPost.scheduledDate = `${parsedDay} de la Semana ${val}`;
                              }
                              return newPost;
                            }
                            return p;
                          }));
                        };

                        return (
                          <div key={post.id || idx} className="bg-zinc-50/75 p-4 border border-zinc-200 rounded-none flex flex-col justify-between hover:border-zinc-400 transition relative">
                            <div className="space-y-3.5">
                              {/* Header Card parameters */}
                              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-204 border-zinc-200">
                                {/* Channel Selector */}
                                <div>
                                  <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide block mb-1">Red Social / Canal</label>
                                  <select
                                    value={post.channel || 'Instagram'}
                                    onChange={(e) => handleFieldChange('channel', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-800 p-1 focus:outline-none focus:border-zinc-500 font-mono font-bold rounded-none"
                                  >
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="Twitter">Twitter</option>
                                  </select>
                                </div>

                                {/* Status Selector */}
                                <div>
                                  <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide block mb-1">Estado de Publicación</label>
                                  <select
                                    value={post.status || 'Borrador'}
                                    onChange={(e) => handleFieldChange('status', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-805 p-1 focus:outline-none focus:border-zinc-500 font-mono font-bold uppercase rounded-none"
                                  >
                                    <option value="Borrador">Borrador</option>
                                    <option value="Pendiente de aprobación">Pendiente</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Programado">Programado</option>
                                    <option value="Publicado">Publicado</option>
                                  </select>
                                </div>
                              </div>

                              {/* Day and Timing */}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide block mb-0.5">Semana</label>
                                  <select
                                    value={currWeek}
                                    onChange={(e) => handleFieldChange('weekNum', Number(e.target.value))}
                                    className="w-full bg-white border border-zinc-200 text-zinc-800 py-1 px-1.5 focus:outline-none uppercase text-[9px] font-bold rounded-none"
                                  >
                                    <option value={1}>Semana 1</option>
                                    <option value={2}>Semana 2</option>
                                    <option value={3}>Semana 3</option>
                                    <option value={4}>Semana 4</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide block mb-0.5">Día</label>
                                  <select
                                    value={currDay}
                                    onChange={(e) => handleFieldChange('selectedDay', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 text-zinc-800 py-1 px-1 focus:outline-none uppercase text-[9px] font-bold rounded-none"
                                  >
                                    <option value="Lunes">Lunes</option>
                                    <option value="Martes">Martes</option>
                                    <option value="Miércoles">Miércoles</option>
                                    <option value="Jueves">Jueves</option>
                                    <option value="Viernes">Viernes</option>
                                    <option value="Sábado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide block mb-0.5">Hora</label>
                                  <input
                                    type="text"
                                    value={post.scheduledTime || '18:00'}
                                    onChange={(e) => handleFieldChange('scheduledTime', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 text-zinc-800 py-1 px-1.5 focus:outline-none text-[9px] rounded-none"
                                    placeholder="ej: 19:30"
                                  />
                                </div>
                              </div>

                              {/* Title / Concept */}
                              <div>
                                <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase block mb-0.5">Título / Concepto del Post</label>
                                <input
                                  type="text"
                                  value={post.title || ''}
                                  onChange={(e) => handleFieldChange('title', e.target.value)}
                                  className="w-full bg-white border border-zinc-200 text-[11px] text-zinc-900 py-1.5 px-2.5 focus:outline-none focus:border-zinc-500 font-sans font-bold uppercase tracking-wider rounded-none"
                                />
                              </div>

                              {/* Copy Persuasivo */}
                              <div>
                                <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase block mb-0.5">Texto / Copy Persuasivo IA</label>
                                <textarea
                                  value={post.copy || ''}
                                  onChange={(e) => handleFieldChange('copy', e.target.value)}
                                  rows={5}
                                  className="w-full bg-white border border-zinc-200 text-[11.5px] text-zinc-700 p-2 focus:outline-none focus:border-zinc-500 font-sans font-light leading-relaxed whitespace-pre-wrap rounded-none"
                                />
                              </div>

                              {/* Call to action */}
                              <div>
                                <label className="text-[8px] font-mono font-bold text-zinc-500 uppercase block mb-0.5">Llamado a la acción (CTA)</label>
                                <input
                                  type="text"
                                  value={post.cta || ''}
                                  onChange={(e) => handleFieldChange('cta', e.target.value)}
                                  className="w-full bg-white border border-zinc-200 text-[10.5px] text-zinc-650 py-1.5 px-2.5 focus:outline-none font-sans rounded-none"
                                />
                              </div>

                              {post.imageUrlPrompt && (
                                <div className="bg-amber-50/30 p-2.5 border border-amber-100">
                                  <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase mb-1">PROMPT SUGERIDO GENERADOR DE IMÁGENES</span>
                                  <span className="text-[10px] text-zinc-600 font-sans italic font-light block leading-relaxed">{post.imageUrlPrompt}</span>
                                </div>
                              )}
                            </div>

                            {/* Remove card button */}
                            <div className="mt-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditablePosts(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-[8.5px] font-mono text-zinc-500 hover:text-rose-600 uppercase tracking-widest cursor-pointer"
                              >
                                [ Eliminar Publicación ]
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </>
          )}

        </div>

        {/* Action Controls Footer */}
        {!generating && (
          <div className="px-6 py-4.5 border-t-2 border-zinc-200 flex justify-between items-center bg-zinc-50 font-mono text-xs">
            {step === 6 ? (
              <>
                <button
                  onClick={() => setStep(5)}
                  className="bg-white border border-zinc-250 hover:bg-zinc-100 px-4 py-2.5 rounded-none text-zinc-600 uppercase tracking-widest cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white border-r-4 border-b-4 border-zinc-500 active:translate-y-0.5 font-bold px-6 py-2.5 rounded-none cursor-pointer flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <Calendar className="w-4 h-4" /> Guardar en mi Calendario
                </button>
              </>
            ) : (
              <>
                <button
                  disabled={step === 1}
                  onClick={() => setStep(prev => prev - 1)}
                  className="bg-white border border-zinc-250 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 px-4 py-2.5 rounded-none text-zinc-600 uppercase tracking-widest cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white border-r-4 border-b-4 border-zinc-500 active:translate-y-0.5 font-bold px-6 py-2.5 rounded-none cursor-pointer flex items-center gap-1.5 uppercase tracking-widest"
                >
                  Continuar <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
