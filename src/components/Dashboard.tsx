import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-helpers';
import { BusinessProfile, MarketingStrategy, CalendarPost } from '../types';
import { 
  Sparkles, 
  LogOut, 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  Target, 
  Copy, 
  Check, 
  Trash2, 
  ChevronRight, 
  Building2, 
  Users, 
  Megaphone,
  Network,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Clock,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const userId = user?.uid || '';

  // Data states from Firestore
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarPost[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Active workspace states
  const [activeBusiness, setActiveBusiness] = useState<BusinessProfile | null>(null);

  // Form states for adding business
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizNiche, setNewBizNiche] = useState('');
  const [newBizDesc, setNewBizDesc] = useState('');
  const [newBizAudience, setNewBizAudience] = useState('');
  const [newBizInsta, setNewBizInsta] = useState('');
  const [newBizTikTok, setNewBizTikTok] = useState('');
  const [newBizFb, setNewBizFb] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [addingBiz, setAddingBiz] = useState(false);

  // Form states for Strategy generator
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Copywriter Sidebar state
  const [showCopywriterDrawer, setShowCopywriterDrawer] = useState(false);
  const [cwTopic, setCwTopic] = useState('');
  const [cwChannel, setCwChannel] = useState<'Instagram' | 'TikTok' | 'Facebook' | 'Twitter'>('Instagram');
  const [cwTone, setCwTone] = useState('persuasivo y emocionante');
  const [cwResult, setCwResult] = useState<{ title: string; copy: string; imagePrompt?: string } | null>(null);
  const [cwLoading, setCwLoading] = useState(false);
  const [cwError, setCwError] = useState<string | null>(null);

  // General notification bubble
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserContent();
    }
  }, [userId]);

  // Fetch business, strategist, and calendars from firestore
  const fetchUserContent = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch businesses
      const bizPath = `users/${userId}/businesses`;
      let bizList: BusinessProfile[] = [];
      try {
        const bizSnap = await getDocs(collection(db, bizPath));
        bizList = bizSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as BusinessProfile));
        setBusinesses(bizList);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, bizPath);
      }

      // Set first business as active if available
      if (bizList.length > 0) {
        setActiveBusiness(bizList[0]);
      }

      // 2. Fetch strategies
      const stratPath = `users/${userId}/strategies`;
      try {
        const stratSnap = await getDocs(collection(db, stratPath));
        const stratList = stratSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MarketingStrategy));
        setStrategies(stratList);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, stratPath);
      }

      // 3. Fetch Calendar Items
      const calPath = `users/${userId}/calendar`;
      try {
        const calSnap = await getDocs(collection(db, calPath));
        const calList = calSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CalendarPost));
        setCalendarItems(calList);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, calPath);
      }

    } catch (err) {
      console.error("Critical fetching issue resolved silently:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newBizName.trim() || !newBizNiche.trim() || !newBizDesc.trim()) {
      setFormError("Por favor completa los campos principales obligatorios (Nombre, Nicho y Descripción).");
      return;
    }

    setAddingBiz(true);
    const newId = 'biz_' + Math.random().toString(36).substring(2, 9);
    const path = `users/${userId}/businesses`;

    const newBiz: BusinessProfile = {
      id: newId,
      userId,
      name: newBizName,
      niche: newBizNiche,
      description: newBizDesc,
      targetAudience: newBizAudience || 'Emprendedores y consumidores con interés directo',
      socialHandles: {
        instagram: newBizInsta || '',
        tiktok: newBizTikTok || '',
        facebook: newBizFb || '',
      },
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, path, newId), newBiz);
      setBusinesses(prev => [...prev, newBiz]);
      setActiveBusiness(newBiz);
      
      // Reset form
      setNewBizName('');
      setNewBizNiche('');
      setNewBizDesc('');
      setNewBizAudience('');
      setNewBizInsta('');
      setNewBizTikTok('');
      setNewBizFb('');
      setShowAddBusiness(false);
      setSuccessMsg("¡Negocio registrado con éxito! Ahora puedes generar tu estrategia.");
    } catch (err) {
      setFormError("Error al guardar en base de datos. Verifica tu conexión.");
      handleFirestoreError(err, OperationType.WRITE, `${path}/${newId}`);
    } finally {
      setAddingBiz(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!activeBusiness) {
      setGenError("Primero selecciona o registra un perfil de negocio activo.");
      return;
    }

    setGeneratingStrategy(true);
    setGenError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeBusiness.name,
          niche: activeBusiness.niche,
          description: activeBusiness.description,
          targetAudience: activeBusiness.targetAudience,
          socialHandles: activeBusiness.socialHandles
        })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || "Fallo en la llamada de generación con el servidor.");
      }

      const data = await response.json();
      
      // Create Strategy Document in Firestore
      const stratId = 'strat_' + Math.random().toString(36).substring(2, 9);
      const stratPath = `users/${userId}/strategies`;

      const newStrategy: MarketingStrategy = {
        id: stratId,
        userId,
        businessId: activeBusiness.id,
        title: data.title || "Estrategia Automatizada de IA",
        summary: data.summary || "Resumen estratégico completo.",
        posts: [], // posts saved separately in subcollection
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, stratPath, stratId), newStrategy);
      
      // Save all posts inside Calendar Subcollection
      const calPath = `users/${userId}/calendar`;
      const savedPosts: CalendarPost[] = [];

      for (const item of (data.posts || [])) {
        const postId = 'post_' + Math.random().toString(36).substring(2, 9);
        const postObj: CalendarPost = {
          id: postId,
          userId,
          businessId: activeBusiness.id,
          title: item.title || "Publicación recomendada",
          copy: item.copy || "",
          channel: (item.channel === 'TikTok' || item.channel === 'Facebook' || item.channel === 'Twitter' ? item.channel : 'Instagram'),
          scheduledDate: item.scheduledDate || "Día 1",
          type: item.type || "Reel",
          imageUrlPrompt: item.imageUrlPrompt || "",
          status: 'draft',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, calPath, postId), postObj);
        savedPosts.push(postObj);
      }

      setStrategies(prev => [newStrategy, ...prev]);
      setCalendarItems(prev => [...savedPosts, ...prev]);
      setSuccessMsg("¡Estrategia y calendario de contenidos generados por la IA con éxito!");
    } catch (err: any) {
      console.error(err);
      setGenError(err?.message || "Ocurrió un error consultando a la IA Analista. Reintenta de nuevo.");
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const handleUpdatePostStatus = async (postId: string, currentStatus: 'draft' | 'scheduled' | 'published') => {
    let nextStatus: 'draft' | 'scheduled' | 'published' = 'scheduled';
    if (currentStatus === 'scheduled') nextStatus = 'published';
    else if (currentStatus === 'published') nextStatus = 'draft';

    const path = `users/${userId}/calendar/${postId}`;
    try {
      await updateDoc(doc(db, `users/${userId}/calendar`, postId), {
        status: nextStatus
      });
      setCalendarItems(prev => prev.map(item => item.id === postId ? { ...item, status: nextStatus } : item));
      setSuccessMsg(`Estado de publicación actualizado a: ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const path = `users/${userId}/calendar/${postId}`;
    if (!window.confirm("¿Seguro que deseas eliminar esta propuesta del calendario?")) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/calendar`, postId));
      setCalendarItems(prev => prev.filter(item => item.id !== postId));
      setSuccessMsg("Publicación eliminada correctamente.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleDeleteStrategy = async (stratId: string) => {
    const path = `users/${userId}/strategies/${stratId}`;
    if (!window.confirm("¿Seguro que deseas eliminar esta estrategia completa de tu historial?")) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/strategies`, stratId));
      setStrategies(prev => prev.filter(item => item.id !== stratId));
      setSuccessMsg("Estrategia eliminada.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleGenerateCustomCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cwTopic.trim()) {
      setCwError("Por favor ingresa un tema.");
      return;
    }

    setCwLoading(true);
    setCwError(null);
    setCwResult(null);

    try {
      const response = await fetch('/api/generate-copywriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cwTopic,
          channel: cwChannel,
          tone: cwTone,
          businessInfo: activeBusiness ? {
            name: activeBusiness.name,
            niche: activeBusiness.niche,
            desc: activeBusiness.description
          } : {}
        })
      });

      if (!response.ok) {
        throw new Error("Socio IA no disponible. Comprueba conexión.");
      }

      const data = await response.json();
      setCwResult(data);
    } catch (err: any) {
      setCwError(err?.message || "Error procesando copywriter en el analista.");
    } finally {
      setCwLoading(false);
    }
  };

  const handleAddCwToCalendar = async () => {
    if (!cwResult) return;
    if (!activeBusiness) {
      setCwError("Debes registrar o seleccionar un negocio para guardar en el calendario.");
      return;
    }

    const path = `users/${userId}/calendar`;
    const postId = 'post_' + Math.random().toString(36).substring(2, 9);
    const postObj: CalendarPost = {
      id: postId,
      userId,
      businessId: activeBusiness.id,
      title: cwResult.title || "Post Alternativo",
      copy: cwResult.copy || "",
      channel: cwChannel,
      scheduledDate: "Planificado",
      type: "Post Estructural",
      imageUrlPrompt: cwResult.imagePrompt || "",
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, path, postId), postObj);
      setCalendarItems(prev => [postObj, ...prev]);
      setShowCopywriterDrawer(false);
      setCwTopic('');
      setCwResult(null);
      setSuccessMsg("¡Copy persuasivo guardado en tu calendario de contenidos!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${path}/${postId}`);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filterCalendarByBiz = (bizId: string) => {
    return calendarItems.filter(item => item.businessId === bizId);
  };

  const filterStrategiesByBiz = (bizId: string) => {
    return strategies.filter(item => item.businessId === bizId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-zinc-200 selection:text-zinc-950">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r-2 border-zinc-950 p-5 flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-zinc-950 p-2.5 rounded-none border border-zinc-800">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-sans font-bold text-base text-white uppercase tracking-wider">
                Mercadea<span className="text-zinc-400 font-mono text-xs">_IA</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-850 rounded-none font-sans">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-none object-cover border border-zinc-500/20" />
            ) : (
              <div className="w-9 h-9 bg-zinc-900 rounded-none flex items-center justify-center font-bold text-white border border-zinc-800">
                {user?.displayName?.substring(0, 1) || 'E'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-200 truncate uppercase tracking-wide">{user?.displayName}</p>
              <span className="text-[9px] bg-zinc-900 text-zinc-300 font-mono font-bold px-1.5 py-0.5 rounded-none block w-max uppercase mt-0.5 tracking-wider border border-zinc-800">TRIAL ACTIVO</span>
            </div>
          </div>

          {/* Business Select Section */}
          <div className="flex flex-col gap-2 pt-4 border-t border-zinc-850">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400 tracking-widest">
              <span>MIS NEGOCIOS</span>
              <button 
                onClick={() => setShowAddBusiness(true)}
                className="text-white hover:text-zinc-300 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {businesses.length === 0 ? (
              <p className="text-[11px] text-zinc-500 font-mono italic p-1">Ningún negocio configurado.</p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1.5">
                {businesses.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => setActiveBusiness(biz)}
                    className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition font-sans ${
                      activeBusiness?.id === biz.id 
                        ? 'bg-zinc-950 border border-zinc-100 text-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]' 
                        : 'bg-zinc-950/40 border border-transparent text-zinc-400 hover:bg-zinc-950 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate uppercase tracking-wide">{biz.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-850 mt-6 flex flex-col gap-2">
          <button
            onClick={() => setShowCopywriterDrawer(true)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white px-4 py-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
          >
            <Sparkles className="w-4 h-4 text-white" /> REDACTOR COPY IA
          </button>
          
          <button 
            onClick={logout}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 py-2.5 px-4 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN DATA FEED INSIDE CONTAINER */}
      <main className="flex-1 bg-zinc-950 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {successMsg && (
          <div className="bg-zinc-900/60 border-2 border-zinc-900 text-zinc-200 text-xs font-mono p-4 rounded-none mb-6 flex gap-2.5 items-center justify-between shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <div className="flex gap-2 items-center">
              <Check className="w-4 h-4 text-zinc-300 flex-shrink-0" />
              <span className="uppercase tracking-wider">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-zinc-500 hover:text-white font-bold text-xs cursor-pointer">✕</button>
          </div>
        )}

        {genError && (
          <div className="bg-zinc-900/60 border-2 border-rose-900 text-rose-200 text-xs font-mono p-4 rounded-none mb-6 flex gap-2.5 items-center justify-between shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <div className="flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="uppercase tracking-wider">{genError}</span>
            </div>
            <button onClick={() => setGenError(null)} className="text-zinc-500 hover:text-white font-bold text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* LOADING SCREEN IF APP INITIALLY PIPOING */}
        {loadingData ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 border-2 border-zinc-100 border-t-transparent rounded-none animate-spin"></div>
            <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Sincronizando perfiles de marca y plan desde Firestore...</p>
          </div>
        ) : businesses.length === 0 ? (
          
          /* WIZARD REGISTER FIRST TIME - 3 STEPS AT HOME */
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-zinc-900/20 border-2 border-zinc-900 p-8 text-center relative rounded-none shadow-[8px_8px_0px_0px_rgba(9,9,11,1)]">
              
              <div className="bg-zinc-900 border border-zinc-800 p-4 inline-block rounded-none mb-6">
                <Building2 className="w-10 h-10 text-white" />
              </div>

              <h2 className="font-sans font-bold text-2xl md:text-3xl tracking-tight text-white uppercase mb-2">
                ¡Bienvenido a tu Espacio Creativo!
              </h2>
              <p className="text-zinc-400 font-light text-xs max-w-lg mx-auto leading-relaxed">
                Para que nuestro Analista de Marketing IA pueda estructurar tu calendario mensual listo, primero necesitamos registrar tu negocio de forma transparente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 text-left text-xs font-mono">
                <div className="bg-zinc-950 p-4 rounded-none border border-zinc-900">
                  <span className="font-bold text-zinc-100 text-sm block mb-1">STEP_01</span>
                  <span className="font-bold text-zinc-300 block mb-1 uppercase text-[10px] tracking-wide">Registras tu marca</span>
                  <p className="text-zinc-500 text-[11px] leading-normal font-sans font-light">Nos describes tus productos y target ideal.</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-none border border-zinc-900">
                  <span className="font-bold text-zinc-100 text-sm block mb-1">STEP_02</span>
                  <span className="font-bold text-zinc-300 block mb-1 uppercase text-[10px] tracking-wide">Generas estrategia</span>
                  <p className="text-zinc-500 text-[11px] leading-normal font-sans font-light">El Analista IA de Gemini armará tu plan de copy.</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-none border border-zinc-900">
                  <span className="font-bold text-zinc-100 text-sm block mb-1">STEP_03</span>
                  <span className="font-bold text-zinc-300 block mb-1 uppercase text-[10px] tracking-wide">Calendario Listo</span>
                  <p className="text-zinc-500 text-[11px] leading-normal font-sans font-light">Copias tus posts listos con 1-click al portapapeles.</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddBusiness(true)}
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-mono font-bold py-4 px-6 rounded-none text-xs uppercase tracking-widest border-r-4 border-b-4 border-zinc-450 active:translate-y-0.5 inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                Comenzar Registro Ahora <ChevronRight className="w-4 h-4 text-zinc-900" />
              </button>
            </div>
          </div>

        ) : (
          
          /* ACTIVE USER WORKSPACE DENT */
          <div>
            
            {/* Header section of dashboard */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-6 mb-10">
              <div>
                <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-widest uppercase block mb-1">MARCA SELECCIONADA</span>
                <h1 className="font-sans font-bold text-2.5xl md:text-3xl text-white tracking-tight flex items-center gap-2.5 uppercase">
                  {activeBusiness?.name}
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono tracking-wider py-1 px-2.5 rounded-none uppercase">
                    {activeBusiness?.niche}
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-2 max-w-xl truncate leading-normal italic font-sans font-light">{activeBusiness?.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateStrategy}
                  disabled={generatingStrategy}
                  className="bg-zinc-105 bg-white hover:bg-zinc-100 text-zinc-950 disabled:opacity-50 disabled:pointer-events-none py-3.5 px-5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-r-4 border-b-4 border-zinc-405 active:translate-y-0.5 transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {generatingStrategy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-none animate-spin"></div>
                      <span>ARMANDO PLAN ESTRELLA CON GEMINI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>CREAR NUEVA ESTRATEGIA MENSUAL</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* If no strategies generated yet for the current business profile */}
            {filterStrategiesByBiz(activeBusiness?.id || '').length === 0 ? (
              
              <div className="bg-zinc-900/10 border-2 border-zinc-900 rounded-none p-8 text-center max-w-xl mx-auto my-6 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
                <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-none inline-block mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-2">No hay estrategia para {activeBusiness?.name}</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-sans font-light">
                  Haz clic en el botón de la esquina superior derecha <strong>"CREAR NUEVA ESTRATEGIA MENSUAL"</strong>. Nuestra IA analizará tu nicho en tiempo real y te programará 6 posts optimizados en español con copies persuasivos y prompts ilustrativos listos para redes.
                </p>
              </div>

            ) : (
              
              /* DATA BOARDS: STRATEGIES SUMMARY & EDITORIAL CALENDAR FILTERED BY ACT_BIZ */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Strategic summary from Gemini */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-zinc-900/40 border-2 border-zinc-900 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-855 mb-4">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-white" /> RESUMEN ESTRATÉGICO IA
                      </span>
                    </div>

                    {filterStrategiesByBiz(activeBusiness?.id || '').slice(0, 1).map(strat => (
                      <div key={strat.id} className="relative font-sans text-xs">
                        <h4 className="font-bold text-sm text-zinc-250 uppercase tracking-wide">{strat.title}</h4>
                        <p className="text-zinc-450 mt-3 leading-relaxed whitespace-pre-wrap font-light">
                          {strat.summary}
                        </p>
                        
                        <div className="mt-5 border-t border-zinc-855 pt-3 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                          <span>Generada: {new Date(strat.createdAt).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleDeleteStrategy(strat.id)}
                            className="text-rose-500 hover:text-rose-400 font-bold uppercase cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual helper KPI panel */}
                  <div className="bg-zinc-900/10 border-2 border-zinc-900 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-3">MÉTRICAS EDITORIALES</span>
                    
                    <div className="flex flex-col gap-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-450">Total calendarizados:</span>
                        <span className="font-bold text-white font-mono">{filterCalendarByBiz(activeBusiness?.id || '').length} posts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-450">Borradores (draft):</span>
                        <span className="font-bold text-zinc-400 font-mono">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'draft').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-450">Programados:</span>
                        <span className="font-bold text-zinc-300 font-mono">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'scheduled').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-450">Publicados:</span>
                        <span className="font-bold text-white font-mono">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'published').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Interactive calendar posts proposed */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-900">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">CALENDARIO DE PUBLICACIÓN PROPUESTO</span>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Generado por IA</span>
                  </div>

                  {filterCalendarByBiz(activeBusiness?.id || '').length === 0 ? (
                    <div className="bg-zinc-900/10 border-2 border-zinc-900 rounded-none p-6 text-center text-zinc-500 text-xs italic font-mono uppercase tracking-wider">
                      No hay publicaciones guardadas en el calendario para este negocio. Genera una estrategia para poblar el calendario.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 font-sans text-xs">
                      {filterCalendarByBiz(activeBusiness?.id || '').map(post => {
                        return (
                          <div 
                            key={post.id}
                            className="bg-zinc-900/20 border-2 border-zinc-900 hover:border-zinc-800 p-5 rounded-none transition flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-zinc-400 font-bold bg-zinc-950 px-2.5 py-1 rounded-none border border-zinc-850">
                                  {post.scheduledDate}
                                </span>
                                <span className={`text-[9px] font-mono font-bold py-1 px-2.5 rounded-none uppercase tracking-wider border ${
                                  post.channel === 'Instagram' ? 'bg-zinc-900 text-zinc-350 border-zinc-800' :
                                  post.channel === 'TikTok' ? 'bg-zinc-900 text-zinc-350 border-zinc-805' :
                                  'bg-zinc-900 text-zinc-350 border-zinc-810'
                                }`}>
                                  {post.channel}
                                </span>
                                <span className="text-[9px] bg-zinc-950 font-mono text-zinc-500 px-2 py-0.5 rounded-none uppercase border border-zinc-900">
                                  {post.type}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span 
                                  onClick={() => handleUpdatePostStatus(post.id, post.status)}
                                  className={`text-[9px] font-mono font-bold py-1 px-2.5 rounded-none cursor-pointer transition uppercase tracking-widest border ${
                                    post.status === 'published' ? 'bg-zinc-100 text-zinc-950 border-zinc-200 hover:bg-white' :
                                    post.status === 'scheduled' ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850' :
                                    'bg-zinc-950 text-zinc-500 border-zinc-900 hover:bg-zinc-900'
                                  }`}
                                  title="Haz clic para cambiar el estado"
                                >
                                  {post.status}
                                </span>
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-zinc-650 hover:text-white p-1.5 transition cursor-pointer"
                                  title="Eliminar propuesta"
                                >
                                  <Trash2 className="w-4 h-4 text-zinc-500" />
                                </button>
                              </div>
                            </div>

                            <div className="my-3.5">
                              <h5 className="font-bold text-zinc-200 text-sm mb-1 uppercase tracking-wider">{post.title}</h5>
                              <div className="bg-zinc-950 p-3.5 rounded-none border border-zinc-900 relative group mt-2.5">
                                <p className="text-zinc-350 leading-relaxed whitespace-pre-wrap font-sans font-light mt-1 text-[12px]">
                                  {post.copy}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(post.id, post.copy)}
                                  className="absolute top-2.5 right-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-none transition opacity-60 group-hover:opacity-100 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider cursor-pointer"
                                  title="Copiar texto listo"
                                >
                                  {copiedId === post.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-white" /> <span className="text-white font-bold">COPIADO</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" /> <span>COPIAR</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {post.imageUrlPrompt && (
                              <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-none text-[9px] mt-1 font-mono">
                                <span className="font-bold text-zinc-500 block uppercase mb-1">PROMPT DE IMAGEN IA SUGERIDO</span>
                                <span className="text-zinc-400 font-sans font-light italic leading-normal block">
                                  {post.imageUrlPrompt}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

            )}

          </div>

        )}

      </main>

      {/* REGISTER NEW BUSINESS DIALOG POPUP */}
      <AnimatePresence>
        {showAddBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-zinc-900 border-2 border-zinc-950 rounded-none w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] relative overflow-hidden"
            >
              <div className="px-6 py-5 border-b-2 border-zinc-950 flex justify-between items-center">
                <span className="font-sans font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-5 h-5 text-white" /> REGISTRAR PERFIL DE NEGOCIO
                </span>
                <button 
                  onClick={() => setShowAddBusiness(false)}
                  className="text-zinc-500 hover:text-white font-mono font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterBusiness} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="bg-rose-955/10 border-2 border-rose-900 text-rose-300 text-xs p-3.5 rounded-none font-mono tracking-wide leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Nombre de la Empresa o Marca *</label>
                  <input
                    type="text"
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="ej: Panadería Levadura Viva, FitStudio"
                    required
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3.5 text-xs text-white focus:border-white focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Nicho o Sector Comercial *</label>
                  <input
                    type="text"
                    value={newBizNiche}
                    onChange={(e) => setNewBizNiche(e.target.value)}
                    placeholder="ej: Alimentación Premium, Fitness y Bienestar"
                    required
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3.5 text-xs text-white focus:border-white focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Descripción del Negocio / Qué vendes *</label>
                  <textarea
                    value={newBizDesc}
                    onChange={(e) => setNewBizDesc(e.target.value)}
                    rows={3}
                    placeholder="ej: Elaboramos panes artesanales mediante masa madre de fermentación lenta..."
                    required
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-3.5 text-xs text-white focus:border-white focus:outline-none font-sans font-light leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Público Objetivo o Cliente Ideal (Opcional)</label>
                  <input
                    type="text"
                    value={newBizAudience}
                    onChange={(e) => setNewBizAudience(e.target.value)}
                    placeholder="ej: Personas interesadas en comida orgánica"
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3.5 text-xs text-white focus:border-white focus:outline-none font-sans"
                  />
                </div>

                <div className="border-t border-zinc-850 pt-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 block mb-2 uppercase tracking-wider">Canales de Redes Sociales Activos (Opcional)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Instagram @</span>
                      <input
                        type="text"
                        value={newBizInsta}
                        onChange={(e) => setNewBizInsta(e.target.value)}
                        placeholder="ej: levaduraviva"
                        className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-2.5 text-[11px] text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">TikTok @</span>
                      <input
                        type="text"
                        value={newBizTikTok}
                        onChange={(e) => setNewBizTikTok(e.target.value)}
                        placeholder="ej: levaduraviva"
                        className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-2.5 text-[11px] text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Facebook URL</span>
                      <input
                        type="text"
                        value={newBizFb}
                        onChange={(e) => setNewBizFb(e.target.value)}
                        placeholder="ej: facebook.com/levaduraviva"
                        className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-2.5 text-[11px] text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800 mt-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddBusiness(false)}
                    className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 px-4.5 py-2.5 rounded-none text-zinc-400 uppercase tracking-widest cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingBiz}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 border-r-4 border-b-4 border-zinc-400 active:translate-y-0.5 font-bold px-5 py-2.5 rounded-none cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    {addingBiz ? (
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-none animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Registrar Marca
                      </>
                    )}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COPyWRITER SLIDEOUT DRAWER PANEL */}
      <AnimatePresence>
        {showCopywriterDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/90 backdrop-blur-xs">
            {/* Backdrop close */}
            <div className="absolute inset-0" onClick={() => setShowCopywriterDrawer(false)}></div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-lg bg-zinc-900 border-l-2 border-zinc-950 h-full flex flex-col justify-between shadow-2xl relative z-10 rounded-none"
            >
              {/* Drawer header */}
              <div className="px-6 py-5 border-b-2 border-zinc-950 flex justify-between items-center bg-zinc-900">
                <span className="font-sans font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" /> REDACTOR DE COPYWRITING IA
                </span>
                <button 
                  onClick={() => setShowCopywriterDrawer(false)}
                  className="text-zinc-500 hover:text-white font-mono font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer core content */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-zinc-900/30">
                
                {cwError && (
                  <div className="bg-rose-955/10 border-2 border-rose-900 text-rose-350 text-xs p-3.5 rounded-none font-mono tracking-wide leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{cwError}</span>
                  </div>
                )}

                <form onSubmit={handleGenerateCustomCopy} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Tema o Ángulo de Venta para el post</label>
                    <textarea
                      value={cwTopic}
                      onChange={(e) => setCwTopic(e.target.value)}
                      rows={3}
                      placeholder="ej: Oferta especial o beneficios reales del producto"
                      required
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3.5 text-xs text-white focus:border-white focus:outline-none font-sans font-light resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Red Social</label>
                      <select
                        value={cwChannel}
                        onChange={(e) => setCwChannel(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3 text-xs text-white focus:border-white focus:outline-none font-sans"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Tono del copy</label>
                      <select
                        value={cwTone}
                        onChange={(e) => setCwTone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-3 text-xs text-white focus:border-white focus:outline-none font-sans"
                      >
                        <option value="persuasivo y emocionante">Persuasivo & Emocionante</option>
                        <option value="artesanal, cálido e inspirativo">Artesanal & Cálido</option>
                        <option value="corporativo, riguroso e instructivo">Corporativo & Instructivo</option>
                        <option value="divertido, cercano y casual">Divertido & Cercano</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cwLoading}
                    className="w-full bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 disabled:pointer-events-none py-3.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-r-4 border-b-4 border-zinc-400 active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {cwLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-none animate-spin"></div>
                        <span>ESCRIBIENDO NUEVO COPY IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>GENERAR PROPUESTA DE COPY CON IA</span>
                      </>
                    )}
                  </button>
                </form>

                {/* COPYWRITER IA OUTPUT RESULTS */}
                {cwResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-950 p-5 rounded-none border border-zinc-900 mt-2 relative group shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]"
                  >
                    <span className="text-[9px] bg-zinc-900 text-zinc-300 font-mono px-2 py-0.5 rounded-none font-bold uppercase tracking-widest block w-max mb-3 border border-zinc-800">
                      PROPUESTA LOGRADA CON GEMINI
                    </span>
                    
                    <h5 className="font-sans font-bold text-sm text-zinc-200 uppercase tracking-wide">{cwResult.title}</h5>
                    
                    <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-none mt-3 relative leading-relaxed text-xs text-zinc-300 whitespace-pre-wrap font-sans font-light">
                      {cwResult.copy}
                      <button
                        onClick={() => copyToClipboard('cw_res', cwResult.copy)}
                        className="absolute top-2.5 right-2.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded-none transition opacity-60 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider cursor-pointer"
                      >
                        {copiedId === 'cw_res' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3" />} Copiar
                      </button>
                    </div>

                    {cwResult.imagePrompt && (
                      <div className="bg-zinc-900/60 p-3 rounded-none text-[9px] mt-3 border border-zinc-850 font-mono">
                        <span className="font-bold text-zinc-500 block uppercase mb-1">PROMPT SUGERIDO PARA IMAGEN IA</span>
                        <span className="text-zinc-400 font-sans font-light italic leading-normal block">
                          {cwResult.imagePrompt}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleAddCwToCalendar}
                      className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-[10px] font-mono font-bold py-2.5 rounded-none uppercase tracking-wider transition mt-5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> AGREGAR PROPUESTA AL CALENDARIO
                    </button>
                  </motion.div>
                )}

              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t-2 border-zinc-950 text-center text-[9px] text-zinc-500 font-mono uppercase tracking-widest bg-zinc-900">
                Acceso bajo motor LLM de Gemini en Español
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
