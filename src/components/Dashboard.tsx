import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  getDocs, 
  getDoc,
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
import PremiumUpgradeModal from './PremiumUpgradeModal';
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
  History,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  CheckSquare,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import StrategyWizard from './StrategyWizard';
import PostDetailsModal from './PostDetailsModal';

const getDayOfWeek = (scheduledDate: string): string => {
  const normalized = (scheduledDate || '').toLowerCase();
  if (normalized.includes('lun')) return 'Lunes';
  if (normalized.includes('mar')) return 'Martes';
  if (normalized.includes('mie') || normalized.includes('mié')) return 'Miércoles';
  if (normalized.includes('jue')) return 'Jueves';
  if (normalized.includes('vie')) return 'Viernes';
  if (normalized.includes('sab') || normalized.includes('sáb')) return 'Sábado';
  if (normalized.includes('dom')) return 'Domingo';
  return 'Lunes'; // Fallback
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const userId = user?.uid || '';

  // Data states from Firestore
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarPost[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Live Firebase-Synchronized Subscription and Paywall States
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    copiesUsed: number;
    imagesUsed: number;
    strategiesUsed: number;
    weeklyPlansUsed: number;
  }>({
    plan: 'FREE',
    status: 'ACTIVE',
    copiesUsed: 0,
    imagesUsed: 0,
    strategiesUsed: 0,
    weeklyPlansUsed: 0
  });

  // Active workspace states
  const [activeBusiness, setActiveBusiness] = useState<BusinessProfile | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [showAllCalendarPosts, setShowAllCalendarPosts] = useState(false);

  // Form states for adding business
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizNiche, setNewBizNiche] = useState('');
  const [newBizDesc, setNewBizDesc] = useState('');
  const [newBizAudience, setNewBizAudience] = useState('');
  const [newBizInsta, setNewBizInsta] = useState('');
  const [newBizTikTok, setNewBizTikTok] = useState('');
  const [newBizFb, setNewBizFb] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [addingBiz, setAddingBiz] = useState(false);

  // Modals / Wizard Toggles
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);

  // Active Calendar Filters
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterChannel, setFilterChannel] = useState<string>('Todos');
  const [filterWeek, setFilterWeek] = useState<string>('Todos');
  const [calendarView, setCalendarView] = useState<'grid' | 'list'>('grid');

  // Strategy layout tab toggle
  const [stratTab, setStratTab] = useState<'resume' | 'diagnostic' | 'weekly'>('resume');

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

  // Email Alert queue simulation states
  const [simulatingAlertId, setSimulatingAlertId] = useState<string | null>(null);

  // Unified custom interactive confirmation/alert dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  } | null>(null);
  const [selectedInboxEmail, setSelectedInboxEmail] = useState<any | null>(null);
  const [inboxEmails, setInboxEmails] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('markecore_inbox_emails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [alertTab, setAlertTab] = useState<'sim' | 'inbox'>('sim');
  const [appToasts, setAppToasts] = useState<any[]>([]);

  // Real-time and simulated test variables for dynamic notification checkups
  const [useRealTime, setUseRealTime] = useState<boolean>(true);
  const [testDay, setTestDay] = useState<string>('Miércoles');
  const [testTime, setTestTime] = useState<string>('18:30');
  const [testWeek, setTestWeek] = useState<number>(1);
  const [tick, setTick] = useState<number>(0);
  const [sentAlertEmails, setSentAlertEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('markecore_sent_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic ticking every 5 seconds to re-evaluate remaining times & fire notifications on matching minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host: string | null; from: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/smtp-config-status')
      .then(res => res.json())
      .then(data => setSmtpStatus(data))
      .catch(err => console.error("Error fetching SMTP status:", err));
  }, []);

  const getActiveTimeDetails = () => {
    if (useRealTime) {
      const now = new Date();
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const currentDay = days[now.getDay()];
      const currentHour = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      return {
        day: currentDay,
        time: currentHour,
        week: 1
      };
    } else {
      return {
        day: testDay,
        time: testTime,
        week: testWeek
      };
    }
  };

  // Automatic Real-Time Dynamic Alerts engine
  useEffect(() => {
    if (calendarItems.length === 0 || !activeBusiness) return;

    const activeDetails = getActiveTimeDetails();
    const activePosts = calendarItems.filter(p => p.businessId === activeBusiness.id);

    activePosts.forEach(post => {
      if (post.status !== 'Programado' && post.status !== 'Pendiente de aprobación') return;

      const postDay = getDayOfWeek(post.scheduledDate);
      const postWeek = Number(post.weekNum || 1);

      // Day and week must match for the current scheduled strategy week
      if (postWeek === activeDetails.week && postDay === activeDetails.day) {
        if (!post.scheduledTime) return;
        const [postH, postM] = post.scheduledTime.split(':').map(Number);
        const [currH, currM] = activeDetails.time.split(':').map(Number);
        
        const postTotalMin = postH * 60 + postM;
        const currTotalMin = currH * 60 + currM;
        const diff = postTotalMin - currTotalMin;

        let detectedType: string | null = null;
        let badgeText = "";
        let SpanishWarning = "";

        // Evaluate precise standard trigger boundaries
        if (diff === 30 || (diff <= 31 && diff >= 29)) {
          detectedType = '30min';
          badgeText = "PRÓXIMO POST (30m) 🕒";
          SpanishWarning = `¡Faltan 30 minutos para tu hora boom en ${post.channel}! Prepara el copy y entra a publicar.`;
        } else if (diff === 10 || (diff <= 11 && diff >= 9)) {
          detectedType = '10min';
          badgeText = "ALERTA CRÍTICA (10m) ⏰";
          SpanishWarning = `¡Solo quedan 10 minutos para publicar en ${post.channel}! Tu momento de oro está cerca.`;
        } else if (diff === 5 || (diff <= 6 && diff >= 4)) {
          detectedType = '5min';
          badgeText = "ROJO DE EMERGENCIA (5m) 🚨";
          SpanishWarning = `¡ROJO DE EMERGENCIA! Faltan solo 5 minutos para publicar en su hora boom de ${post.channel}. ¡Publica ya!`;
        } else if (diff === 0 || (diff <= 1 && diff >= -1)) {
          detectedType = 'now';
          badgeText = "¡HORA BOOM ACTIVA! 🔥";
          SpanishWarning = `¡Ya es hora! Tu momento de oro en ${post.channel} está activo. ¡Entra y publica ahora!`;
        } else if (diff === -15 || (diff <= -12 && diff >= -18)) {
          detectedType = 'missed';
          badgeText = "MULTA DE CONFIGURACIÓN ⚠️";
          SpanishWarning = `Alerta de retraso: Tu post en ${post.channel} ya debería estar publicado. ¡Completa la acción!`;
        }

        if (detectedType) {
          const key = `${post.id}-${detectedType}`;
          if (!sentAlertEmails.includes(key)) {
            const updatedSent = [...sentAlertEmails, key];
            setSentAlertEmails(updatedSent);
            localStorage.setItem('markecore_sent_alerts', JSON.stringify(updatedSent));

            // Fire real mail alert dispatch
            handleTriggerEmailAlert(post, detectedType);

            // Toast feedback
            const newToast = {
              id: 'toast_' + Date.now() + Math.random(),
              postTitle: post.title,
              postId: post.id,
              channel: post.channel,
              alertType: detectedType,
              badge: badgeText,
              msg: SpanishWarning,
              timestamp: new Date().toISOString()
            };
            setAppToasts(prev => [newToast, ...prev].slice(0, 4));
          }
        }
      }
    });
  }, [tick, calendarItems, activeBusiness, useRealTime, testDay, testTime, testWeek, sentAlertEmails]);

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
      // 0. Fetch/Initialize subscription
      try {
        const subRef = doc(db, "subscriptions", userId);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          setSubscription(subSnap.data() as any);
        } else {
          const defaultSub = {
            plan: 'FREE',
            status: 'ACTIVE',
            copiesUsed: 0,
            imagesUsed: 0,
            strategiesUsed: 0,
            weeklyPlansUsed: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(subRef, defaultSub);
          setSubscription(defaultSub);
        }
      } catch (err) {
        console.error("Error loading subscription from Firestore:", err);
      }

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

  const handleOpenNewBusinessModal = () => {
    if (subscription.plan === 'FREE' && businesses.length >= 3) {
      setGenError("LÍMITE ALCANZADO: El plan GRATUITO permite registrar hasta 3 emprendimientos. Por favor, actualízate a PRO para marcas ilimitadas.");
      setShowPaywall(true);
      return;
    }
    setNewBizName('');
    setNewBizNiche('');
    setNewBizDesc('');
    setNewBizAudience('');
    setNewBizInsta('');
    setNewBizTikTok('');
    setNewBizFb('');
    setIsEditMode(false);
    setShowAddBusiness(true);
    setFormError(null);
  };

  const handleStartEditBusiness = () => {
    if (!activeBusiness) return;
    setNewBizName(activeBusiness.name);
    setNewBizNiche(activeBusiness.niche);
    setNewBizDesc(activeBusiness.description);
    setNewBizAudience(activeBusiness.targetAudience || '');
    setNewBizInsta(activeBusiness.socialHandles?.instagram || '');
    setNewBizTikTok(activeBusiness.socialHandles?.tiktok || '');
    setNewBizFb(activeBusiness.socialHandles?.facebook || '');
    setIsEditMode(true);
    setShowAddBusiness(true);
    setFormError(null);
  };

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newBizName.trim() || !newBizNiche.trim() || !newBizDesc.trim()) {
      setFormError("Por favor completa los campos principales obligatorios (Nombre, Nicho y Descripción).");
      return;
    }

    if (!isEditMode && subscription.plan === 'FREE' && businesses.length >= 3) {
      setFormError("LÍMITE ALCANZADO: El plan GRATUITO permite registrar hasta 3 emprendimientos. Por favor, actualízate a PRO para marcas ilimitadas.");
      setShowPaywall(true);
      return;
    }

    setAddingBiz(true);
    const path = `users/${userId}/businesses`;

    if (isEditMode && activeBusiness) {
      const updatedBiz: BusinessProfile = {
        ...activeBusiness,
        name: newBizName,
        niche: newBizNiche,
        description: newBizDesc,
        targetAudience: newBizAudience || 'Emprendedores y consumidores con interés directo',
        socialHandles: {
          instagram: newBizInsta || '',
          tiktok: newBizTikTok || '',
          facebook: newBizFb || '',
        }
      };

      try {
        await setDoc(doc(db, path, activeBusiness.id), updatedBiz);
        setBusinesses(prev => prev.map(biz => biz.id === activeBusiness.id ? updatedBiz : biz));
        setActiveBusiness(updatedBiz);

        // Reset form
        setNewBizName('');
        setNewBizNiche('');
        setNewBizDesc('');
        setNewBizAudience('');
        setNewBizInsta('');
        setNewBizTikTok('');
        setNewBizFb('');
        setShowAddBusiness(false);
        setIsEditMode(false);
        setSuccessMsg("¡Los cambios en el perfil de tu negocio han sido guardados con éxito!");
      } catch (err) {
        setFormError("Error al guardar los cambios en la base de datos.");
        handleFirestoreError(err, OperationType.WRITE, `${path}/${activeBusiness.id}`);
      } finally {
        setAddingBiz(false);
      }
    } else {
      const newId = 'biz_' + Math.random().toString(36).substring(2, 9);
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
    }
  };

  const handleGenerateStrategy = () => {
    if (!activeBusiness) {
      setGenError("Primero selecciona o registra un perfil de negocio activo.");
      return;
    }
    setShowWizard(true);
  };

  const handleWizardSuccess = (newStrat: MarketingStrategy, newPosts: CalendarPost[]) => {
    setStrategies(prev => [newStrat, ...prev]);
    setCalendarItems(prev => [...newPosts, ...prev]);
    setSelectedStrategyId(newStrat.id);
    setShowWizard(false);
    setSuccessMsg("¡Estrategia y calendario de contenidos guardados con éxito!");
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

  const handleDeletePost = (postId: string) => {
    setConfirmDialog({
      title: "Eliminar Publicación",
      message: "¿Seguro que deseas desechar esta propuesta del calendario? Se eliminará definitivamente de tu historial.",
      type: "danger",
      onConfirm: async () => {
        const path = `users/${userId}/calendar/${postId}`;
        try {
          await deleteDoc(doc(db, `users/${userId}/calendar`, postId));
          setCalendarItems(prev => prev.filter(item => item.id !== postId));
          setSuccessMsg("Publicación eliminada correctamente.");
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteStrategy = (stratId: string) => {
    setConfirmDialog({
      title: "Eliminar Estrategia",
      message: "¿Seguro que deseas eliminar esta estrategia de marketing permanente junto con sus sugerencias?",
      type: "danger",
      onConfirm: async () => {
        const path = `users/${userId}/strategies/${stratId}`;
        try {
          await deleteDoc(doc(db, `users/${userId}/strategies`, stratId));
          setStrategies(prev => prev.filter(item => item.id !== stratId));
          if (selectedStrategyId === stratId) {
            setSelectedStrategyId(null);
          }
          setSuccessMsg("Estrategia eliminada con éxito.");
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteBusiness = (bizId: string) => {
    const targetBiz = businesses.find(b => b.id === bizId);
    if (!targetBiz) return;
    setConfirmDialog({
      title: "Eliminar Emprendimiento",
      message: `¿Seguro que deseas eliminar el emprendimiento "${targetBiz.name}"? Se borrarán todos sus registros asociados de la base de datos de manera definitiva.`,
      type: "danger",
      onConfirm: async () => {
        const path = `users/${userId}/businesses/${bizId}`;
        try {
          await deleteDoc(doc(db, `users/${userId}/businesses`, bizId));
          
          const updatedList = businesses.filter(b => b.id !== bizId);
          setBusinesses(updatedList);

          if (activeBusiness?.id === bizId) {
            if (updatedList.length > 0) {
              setActiveBusiness(updatedList[0]);
            } else {
              setActiveBusiness(null);
            }
            setSelectedStrategyId(null);
          }

          setSuccessMsg(`✓ Emprendimiento "${targetBiz.name}" eliminado correctamente.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
        setConfirmDialog(null);
      }
    });
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
          userId,
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
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'LIMIT_EXCEEDED') {
          setShowPaywall(true);
          throw new Error("LÍMITE ALCANZADO: Has agotado tus créditos de redacción en el Plan Gratuito. ¡Por favor actualízate para desbloquear copias e imágenes ilimitadas!");
        }
        throw new Error(errorData.error || "Socio IA no disponible. Comprueba conexión.");
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
      strategyId: activeStrategy?.id || '',
      title: cwResult.title || "Post Alternativo",
      copy: cwResult.copy || "",
      channel: cwChannel,
      scheduledDate: "Planificado",
      type: "Post Estructural",
      imageUrlPrompt: cwResult.imagePrompt || "",
      status: 'Borrador',
      weekNum: 1,
      priority: 'Media',
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

  const handleTriggerEmailAlert = async (post: CalendarPost, alertType: string) => {
    setSimulatingAlertId(`${post.id}-${alertType}`);
    try {
      const res = await fetch('/api/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: user?.email || 'velkoryauramiza@gmail.com',
          post,
          alertType,
          businessName: activeBusiness?.name || "tu negocio"
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newMail = {
          id: 'email_' + Date.now(),
          postId: post.id,
          postTitle: post.title,
          alertType,
          subject: data.subject,
          html: data.html,
          timestamp: new Date().toISOString(),
          unread: true,
          realEmailDetail: data.realEmailDetail,
          smtpUsed: data.smtpUsed
        };
        setInboxEmails(prev => {
          const updated = [newMail, ...prev];
          localStorage.setItem('markecore_inbox_emails', JSON.stringify(updated));
          return updated;
        });
        setSuccessMsg(`¡Alerta de correo de la hora boom (${alertType}) procesada con éxito!`);
      }
    } catch (err) {
      console.error(err);
      setAlertMsg("Fallo al despachar alerta de correo.");
    } finally {
      setSimulatingAlertId(null);
    }
  };

  // Check URL parameters for direct email CTA action links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId');
    const action = params.get('action');
    if (postId && action === 'mark_published' && calendarItems.length > 0) {
      const target = calendarItems.find(p => p.id === postId);
      if (target && target.status !== 'Publicado') {
        const updated = { ...target, status: 'Publicado' as const };
        const docRef = doc(db, `users/${userId}/calendar`, postId);
        setDoc(docRef, updated, { merge: true })
          .then(() => {
            setCalendarItems(prev => prev.map(p => p.id === postId ? updated : p));
            setSuccessMsg(`¡Publicación "${target.title}" confirmada como Publicada vía el enlace del correo! 🎉`);
          })
          .catch(console.error);
      }
      // Remove query string cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [calendarItems, userId]);

  const filterCalendarByBiz = (bizId: string) => {
    const bizPosts = calendarItems.filter(item => item.businessId === bizId);
    if (showAllCalendarPosts) {
      return bizPosts;
    }
    if (activeStrategy) {
      const isLatestStrategy = businessStrats[0]?.id === activeStrategy.id;
      return bizPosts.filter(item => {
        if (item.strategyId) {
          return item.strategyId === activeStrategy.id;
        }
        return isLatestStrategy;
      });
    }
    return bizPosts;
  };

  const filterStrategiesByBiz = (bizId: string) => {
    return strategies.filter(item => item.businessId === bizId);
  };

  const businessStrats = filterStrategiesByBiz(activeBusiness?.id || '')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeStrategy = businessStrats.find(s => s.id === selectedStrategyId) || businessStrats[0];

  return (
    <div className="min-h-screen bg-[#fafafc] text-zinc-800 flex flex-col md:flex-row font-sans selection:bg-zinc-200 selection:text-zinc-900">
      
      {/* FLOATING SYSTEM NOTIFICATION ALERTS */}
      <div className="fixed bottom-5 right-5 z-[9999] space-y-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        <AnimatePresence>
          {appToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              className="pointer-events-auto bg-zinc-950 border border-zinc-900 text-white p-4 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)] flex flex-col gap-2 relative overflow-hidden"
              style={{
                boxShadow: toast.alertType === 'now' 
                  ? '4px 4px 0px 0px rgba(16,185,129,1)' 
                  : toast.alertType === 'missed'
                    ? '4px 4px 0px 0px rgba(99,102,241,1)' 
                    : toast.alertType === '10min'
                      ? '4px 4px 0px 0px rgba(239,68,68,1)' 
                      : '4px 4px 0px 0px rgba(245,158,11,1)' 
              }}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[8px] font-mono font-black tracking-widest px-1.5 py-0.5 text-black ${
                  toast.alertType === 'now' ? 'bg-emerald-400' :
                  toast.alertType === 'missed' ? 'bg-indigo-400' :
                  toast.alertType === '10min' ? 'bg-rose-500' : 'bg-amber-400'
                }`}>
                  {toast.badge}
                </span>
                <button 
                  onClick={() => setAppToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-zinc-400 hover:text-white font-bold text-xs cursor-pointer focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] font-sans font-medium text-zinc-100 pr-2 leading-relaxed">
                {toast.msg}
              </p>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5 mt-1">
                <span className="text-[7.5px] text-zinc-400 font-mono">
                  AUTO_DISPATCHED OK 📡
                </span>
                
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => {
                      const foundItem = calendarItems.find(p => p.id === toast.postId);
                      if (foundItem) {
                        navigator.clipboard.writeText(foundItem.copy || "");
                        setSuccessMsg("¡Texto copy de la publicación copiado al portapapeles!");
                      }
                    }}
                    className="text-[7.5px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold px-2 py-1 tracking-wider uppercase cursor-pointer"
                  >
                    📋 COPIAR COPY
                  </button>
                  <button 
                    onClick={() => {
                      if (toast.postId) {
                        const target = calendarItems.find(p => p.id === toast.postId);
                        if (target) {
                          const updated = { ...target, status: 'Publicado' as const };
                          const docRef = doc(db, `users/${userId}/calendar`, toast.postId);
                          setDoc(docRef, updated, { merge: true })
                            .then(() => {
                              setCalendarItems(prev => prev.map(p => p.id === toast.postId ? updated : p));
                              setSuccessMsg(`¡Publicación "${target.title}" confirmada como publicada! 🎉`);
                              // Dismiss toast
                              setAppToasts(prev => prev.filter(t => t.id !== toast.id));
                            })
                            .catch(console.error);
                        }
                      }
                    }}
                    className="text-[7.5px] bg-[#00ff66] text-black font-black px-2 py-1 tracking-wider uppercase cursor-pointer border-0"
                  >
                    ✓ PUBLICADO
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-5 flex flex-col justify-between shadow-xs">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-zinc-900 p-2.5 rounded-none border border-zinc-900">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-sans font-bold text-base text-zinc-900 uppercase tracking-wider">
                Mercadea<span className="text-zinc-650 bg-zinc-100 text-zinc-600 border border-zinc-205 px-1.5 py-0.5 ml-1.5 text-[10px] font-mono font-bold rounded-none">_IA</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-none font-sans">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-none object-cover border border-zinc-200" />
            ) : (
              <div className="w-9 h-9 bg-zinc-200 rounded-none flex items-center justify-center font-bold text-zinc-800 border border-zinc-300">
                {user?.displayName?.substring(0, 1) || 'E'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-900 truncate uppercase tracking-wide">{user?.displayName}</p>
              <div className="flex gap-1 items-center mt-1 flex-wrap">
                <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded-none block w-max uppercase tracking-wider border ${
                  subscription.plan === 'FREE' 
                    ? 'bg-zinc-100 text-zinc-600 border-zinc-200' 
                    : subscription.plan === 'PRO'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                      : subscription.plan === 'EMPRENDEDOR'
                        ? 'bg-zinc-900 text-white border-zinc-950'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {subscription.plan}
                </span>
                {subscription.plan === 'FREE' && (
                  <button 
                    onClick={() => setShowPaywall(true)}
                    className="text-[8px] font-mono font-bold text-indigo-600 hover:text-indigo-850 transition underline underline-offset-1 uppercase tracking-wider cursor-pointer"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Business Select Section */}
          <div className="flex flex-col gap-2 pt-4 border-t border-zinc-200">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 tracking-widest">
              <span>MIS NEGOCIOS {subscription.plan === 'FREE' && `(${businesses.length}/3)`}</span>
              <button 
                onClick={handleOpenNewBusinessModal}
                className="text-zinc-800 hover:text-zinc-600 transition"
                title="Registrar nuevo negocio"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {businesses.length === 0 ? (
              <p className="text-[11px] text-zinc-500 font-mono italic p-1">Ningún negocio configurado.</p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1.5">
                {businesses.map(biz => (
                  <div
                    key={biz.id}
                    className={`w-full flex items-center justify-between transition font-sans border ${
                      activeBusiness?.id === biz.id 
                        ? 'bg-zinc-900 border-zinc-905 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,0.15)]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveBusiness(biz);
                        setSelectedStrategyId(null);
                      }}
                      className="flex-1 text-left px-3 py-2.5 text-xs font-bold flex items-center gap-2 truncate cursor-pointer bg-transparent border-0 text-inherit focus:outline-none"
                    >
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate uppercase tracking-wide">{biz.name}</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBusiness(biz.id);
                      }}
                      className={`px-2 py-2.5 transition text-inherit ${
                        activeBusiness?.id === biz.id 
                          ? 'hover:text-red-400 text-white/70' 
                          : 'hover:text-red-500 text-zinc-400'
                      } cursor-pointer border-0 bg-transparent focus:outline-none`}
                      title="Eliminar o archivar emprendimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 mt-6 flex flex-col gap-2">
          <button
            onClick={() => setShowCopywriterDrawer(true)}
            className="w-full bg-zinc-900 border border-zinc-900 text-white hover:bg-zinc-800 px-4 py-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-white" /> REDACTOR COPY IA
          </button>
          
          <button 
            onClick={logout}
            className="w-full bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 py-2.5 px-4 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN DATA FEED INSIDE CONTAINER */}
      <main className="flex-1 bg-[#fbfbfc] p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {successMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-mono p-4 rounded-none mb-6 flex gap-2.5 items-center justify-between shadow-[2px_2px_0px_0px_rgba(16,185,129,0.15)]">
            <div className="flex gap-2 items-center">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="uppercase tracking-wider">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-750 hover:text-emerald-950 font-bold text-xs cursor-pointer">✕</button>
          </div>
        )}

        {genError && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-950 text-xs font-mono p-4 rounded-none mb-6 flex gap-2.5 items-center justify-between shadow-[2px_2px_0px_0px_rgba(244,63,94,0.15)]">
            <div className="flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="uppercase tracking-wider">{genError}</span>
            </div>
            <button onClick={() => setGenError(null)} className="text-zinc-500 hover:text-zinc-900 font-bold text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* LOADING SCREEN */}
        {loadingData ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 border-2 border-zinc-900 border-t-transparent rounded-none animate-spin"></div>
            <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Sincronizando perfiles de marca y plan desde Firestore...</p>
          </div>
        ) : businesses.length === 0 ? (
          
          /* WIZARD REGISTER FIRST TIME - 3 STEPS AT HOME */
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-white border-2 border-zinc-200 p-8 text-center relative rounded-none shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
              
              <div className="bg-zinc-50 border border-zinc-200 p-4 inline-block rounded-none mb-6">
                <Building2 className="w-10 h-10 text-zinc-805 text-zinc-800" />
              </div>

              <h2 className="font-sans font-bold text-2xl md:text-3xl tracking-tight text-zinc-900 uppercase mb-2">
                ¡Bienvenido a tu Espacio Creativo!
              </h2>
              <p className="text-zinc-650 font-light text-xs max-w-lg mx-auto leading-relaxed">
                Para que nuestro Analista de Marketing IA pueda estructurar tu calendario mensual listo, primero necesitamos registrar tu negocio de forma transparente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 text-left text-xs font-mono">
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200">
                  <span className="font-bold text-zinc-900 text-sm block mb-1">STEP_01</span>
                  <span className="font-bold text-zinc-700 block mb-1 uppercase text-[10px] tracking-wide">Registras tu marca</span>
                  <p className="text-zinc-650 text-[11px] leading-normal font-sans font-light">Nos describes tus productos y target ideal.</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200">
                  <span className="font-bold text-zinc-900 text-sm block mb-1">STEP_02</span>
                  <span className="font-bold text-zinc-700 block mb-1 uppercase text-[10px] tracking-wide">Generas estrategia</span>
                  <p className="text-zinc-650 text-[11px] leading-normal font-sans font-light">El Analista IA de Gemini armará tu plan de copy.</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200">
                  <span className="font-bold text-zinc-900 text-sm block mb-1">STEP_03</span>
                  <span className="font-bold text-zinc-700 block mb-1 uppercase text-[10px] tracking-wide">Calendario Listo</span>
                  <p className="text-zinc-650 text-[11px] leading-normal font-sans font-light">Copias tus posts listos con 1-click al portapapeles.</p>
                </div>
              </div>

              <button
                onClick={handleOpenNewBusinessModal}
                className="bg-zinc-900 hover:bg-zinc-950 text-white font-mono font-bold py-4 px-6 rounded-none text-xs uppercase tracking-widest border-r-4 border-b-4 border-zinc-600 active:translate-y-0.5 inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                Comenzar Registro Ahora <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

        ) : (
          
          /* ACTIVE USER WORKSPACE DENT */
          <div>
            
            {/* Header section of dashboard */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-6 mb-10">
              <div>
                <span className="text-[9px] text-zinc-550 font-mono font-bold tracking-widest uppercase block mb-1">MARCA SELECCIONADA</span>
                <h1 className="font-sans font-bold text-2.5xl md:text-3xl text-zinc-900 tracking-tight flex items-center gap-2.5 uppercase">
                  {activeBusiness?.name}
                  <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono tracking-wider py-1 px-2.5 rounded-none uppercase">
                    {activeBusiness?.niche}
                  </span>
                </h1>
                <p className="text-xs text-zinc-600 mt-2 max-w-xl truncate leading-normal italic font-sans font-light">{activeBusiness?.description}</p>
                <div className="mt-3.5">
                  <button
                    onClick={handleStartEditBusiness}
                    className="text-[10px] font-mono font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 uppercase tracking-wider py-1.5 px-3 border border-zinc-200 bg-zinc-50 drop-shadow-xs transition duration-200 hover:bg-zinc-100 cursor-pointer w-max"
                    id="btn-edit-business-data"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-zinc-800" /> Editar Datos de Marca
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateStrategy}
                  disabled={generatingStrategy}
                  className="bg-zinc-900 hover:bg-zinc-950 text-white disabled:opacity-50 disabled:pointer-events-none py-3.5 px-5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-r-4 border-b-4 border-zinc-600 active:translate-y-0.5 transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {generatingStrategy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-none animate-spin"></div>
                      <span>ARMANDO PLAN ESTRELLA CON GEMINI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>CREAR NUEVA ESTRATEGIA IA</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* If no strategies generated yet for the current business profile */}
            {filterStrategiesByBiz(activeBusiness?.id || '').length === 0 ? (
              
              <div className="bg-white border-2 border-zinc-200 rounded-none p-8 text-center max-w-xl mx-auto my-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-none inline-block mb-4">
                  <Sparkles className="w-8 h-8 text-zinc-900" />
                </div>
                <h3 className="text-sm font-mono font-bold text-zinc-900 uppercase tracking-wider mb-2">No hay estrategia para {activeBusiness?.name}</h3>
                <p className="text-xs text-zinc-650 max-w-md mx-auto leading-relaxed font-sans font-light">
                  Haz clic en el botón de la esquina superior derecha <strong>"CREAR NUEVA ESTRATEGIA IA"</strong>. Nuestra IA analizará tu nicho en tiempo real y te programará publicaciones optimizadas (diarias, semanales, quincenales o mensuales) con copies persuasivos y prompts ilustrativos listos para redes.
                </p>
              </div>

            ) : (
              
              /* DATA BOARDS: STRATEGIES SUMMARY & EDITORIAL CALENDAR FILTERED BY ACT_BIZ */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Strategic summary from Gemini */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Premium Brand Strategy report with Interactive Tabs */}
                  <div className="bg-white border-2 border-zinc-200 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4 font-mono font-bold text-[10px] text-zinc-500">
                      <span className="tracking-widest uppercase flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-zinc-800" /> PLAN ESTRATÉGICO DIRECTIVO
                      </span>
                    </div>

                    {/* Selector de Historial de Estrategias y Título */}
                    {businessStrats.length > 1 && (
                      <div className="mb-4 pb-4 border-b border-zinc-200">
                        <label className="text-[9px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-widest">VER OTRA ESTRATEGIA (HISTORIAL)</label>
                        <select
                          value={activeStrategy?.id || ''}
                          onChange={(e) => {
                            setSelectedStrategyId(e.target.value);
                            setStratTab('resume');
                          }}
                          className="w-full text-[10px] bg-zinc-50 border border-zinc-200 p-2 font-mono font-bold tracking-wide uppercase focus:outline-hidden focus:border-zinc-400 cursor-pointer rounded-none text-zinc-800"
                          id="select-strategy-history"
                        >
                          {businessStrats.map((strat) => (
                            <option key={strat.id} value={strat.id}>
                              {strat.title} ({new Date(strat.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {[activeStrategy].filter(Boolean).map(strat => (
                      <div key={strat.id} className="relative font-sans text-xs space-y-4">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-sans font-extrabold text-sm text-zinc-900 uppercase tracking-wide leading-tight">{strat.title}</h4>
                          <button 
                            onClick={() => handleDeleteStrategy(strat.id)}
                            className="text-[9px] font-mono text-rose-500 hover:text-rose-450 uppercase cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                        
                        {/* Strategy Sub-Tabs Navigation */}
                        <div className="bg-zinc-100 p-1 border border-zinc-200 flex items-center gap-1 text-[9px] font-mono select-none">
                          <button 
                            onClick={() => setStratTab('resume')}
                            className={`flex-1 py-1 text-center uppercase font-bold transition ${stratTab === 'resume' ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                          >
                            Resumen
                          </button>
                          <button 
                            onClick={() => setStratTab('diagnostic')}
                            className={`flex-1 py-1 text-center uppercase font-bold transition ${stratTab === 'diagnostic' ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs' : 'text-zinc-500 hover:text-zinc-805'}`}
                          >
                            Dirección
                          </button>
                          <button 
                            onClick={() => setStratTab('weekly')}
                            className={`flex-1 py-1 text-center uppercase font-bold transition ${stratTab === 'weekly' ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs' : 'text-zinc-500 hover:text-zinc-805'}`}
                          >
                            Semanas
                          </button>
                        </div>

                        {/* Interactive Tab Displays */}
                        {stratTab === 'resume' && (
                          <div className="space-y-3 pt-2">
                            <div>
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">RESUMEN DEL PLAN</span>
                              <p className="text-zinc-700 leading-relaxed font-light mt-0.5 whitespace-pre-wrap">{strat.summary}</p>
                            </div>
                            {strat.mainGoal && (
                              <div className="bg-zinc-50 p-2.5 border border-zinc-200">
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">OBJETIVO SMART PRINCIPAL</span>
                                <p className="text-zinc-800 font-medium font-sans mt-0.5 leading-relaxed">{strat.mainGoal}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {stratTab === 'diagnostic' && (
                          <div className="space-y-3 pt-2">
                            {strat.diagnostic && (
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">DIAGNÓSTICO SITUACIONAL IA</span>
                                <p className="text-zinc-700 font-light mt-0.5 leading-relaxed">{strat.diagnostic}</p>
                              </div>
                            )}
                            {strat.suggestedKPIs && strat.suggestedKPIs.length > 0 && (
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">VALORES KPI RECOMENDADOS</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {strat.suggestedKPIs.map((k, i) => (
                                    <span key={i} className="text-[9px] bg-zinc-50 text-zinc-700 border border-zinc-200 py-0.5 px-2 font-mono uppercase tracking-wide">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {strat.recommendedTone && (
                              <div className="bg-zinc-50 p-2.5 border border-zinc-200">
                                <span className="text-[9px] font-mono text-zinc-555 text-zinc-500 block uppercase">Tono editorial:</span>
                                <p className="text-zinc-700 mt-0.5 font-light">{strat.recommendedTone}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {stratTab === 'weekly' && (
                          <div className="space-y-2.5 pt-2 max-h-[30vh] overflow-y-auto">
                            {strat.weeklyPlan && strat.weeklyPlan.map((wk: any, idx: number) => (
                              <div key={idx} className="bg-zinc-50 p-2.5 border border-zinc-200 relative">
                                <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase block tracking-wider">SEMANA {idx + 1}</span>
                                <p className="text-zinc-800 text-xs font-bold mt-0.5 leading-tight">{wk.objective}</p>
                                <p className="text-[10px] text-zinc-500 font-light mt-1 whitespace-pre-wrap">CTA: "{wk.cta}"</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 border-t border-zinc-200 text-[9px] font-mono text-zinc-550 uppercase tracking-wider flex justify-between">
                          <span>CREADA: {new Date(strat.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alertas & Control de Publicación */}
                  <div className="bg-white border-2 border-zinc-200 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-900 uppercase block">ALERTAS & CONTROL DE PUBLICACIÓN</span>
                        <p className="text-[10px] text-zinc-500 font-sans font-light mt-0.5 leading-tight">Garantiza constancia periódica en tus redes</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                        {/* CONTROLES DE FECHA/HORA DINÁMICA (Elegante y Swiss Neat) */}
                        <div className="bg-zinc-50 border border-zinc-200 p-3.5 space-y-3 font-mono text-[9.5px]">
                          <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                            <span className="text-zinc-650 font-bold uppercase tracking-wider">⏱️ Reloj Activo de Referencia</span>
                            
                            <div className="flex bg-zinc-200 p-0.5 rounded-none border border-zinc-300">
                              <button
                                type="button"
                                onClick={() => setUseRealTime(true)}
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase cursor-pointer ${useRealTime ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-650'}`}
                              >
                                Real
                              </button>
                              <button
                                type="button"
                                onClick={() => setUseRealTime(false)}
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase cursor-pointer ${!useRealTime ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-650'}`}
                              >
                                Prueba
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 py-1">
                            <div className="flex flex-col">
                              <span className="text-zinc-400 text-[8px] uppercase font-bold">Modo actual:</span>
                              <span className="font-bold text-zinc-800 text-[10px] tracking-tight">
                                {useRealTime ? '🟢 HORA DISPOSITIVO (REAL)' : '⚡ PRUEBA DE ALERTAS MANUAL'}
                              </span>
                            </div>
                            
                            <div className="bg-zinc-950 text-[#00ff66] font-bold px-3 py-1.5 text-sm tracking-wide border border-zinc-800 font-mono flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping"></span>
                              {getActiveTimeDetails().day.toUpperCase()} {getActiveTimeDetails().time}
                            </div>
                          </div>

                          {!useRealTime && (
                            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 border border-zinc-200 animate-fade-in">
                              <div>
                                <span className="text-zinc-400 text-[7.5px] uppercase block mb-1 font-bold">Día:</span>
                                <select
                                  value={testDay}
                                  onChange={(e) => setTestDay(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-300 px-1 py-0.5 text-[9px] font-bold text-zinc-800"
                                >
                                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <span className="text-zinc-400 text-[7.5px] uppercase block mb-1 font-bold">Hora de Prueba:</span>
                                <input
                                  type="text"
                                  value={testTime}
                                  onChange={(e) => setTestTime(e.target.value)}
                                  placeholder="18:30"
                                  className="w-full bg-zinc-50 border border-zinc-300 px-1 py-0.5 text-[9px] font-mono font-bold text-zinc-800 text-center focus:outline-none"
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTestDay('Miércoles');
                                    setTestTime('18:30');
                                    setSuccessMsg("Reloj de prueba calibrado a Miércoles 18:30. ¡Listo para interactuar!");
                                  }}
                                  className="w-full py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-950 text-white font-bold text-[8px] uppercase cursor-pointer"
                                  title="Calibrar ensayo de Miércoles 18:30"
                                >
                                  Reset 18:30
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-500 font-sans font-light leading-relaxed">
                          Tus alertas automáticas se disparan dinámicamente a tu correo registrado <strong>{user?.email || 'velkoryauramiza@gmail.com'}</strong>. Se actualizan dinámicamente según la hora activa de referencia.
                        </p>

                        {/* Direct scheduled alerts list with in-app warning messages & publication state confirmation */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {filterCalendarByBiz(activeBusiness?.id || 'null_biz')
                            .filter(p => p.status === 'Programado' || p.status === 'Pendiente de aprobación')
                            .map(post => {
                              const activeDetails = getActiveTimeDetails();
                              const postDay = getDayOfWeek(post.scheduledDate);
                              const postWeek = Number(post.weekNum || 1);
                              const isToday = postWeek === activeDetails.week && postDay === activeDetails.day;

                              let diff = 9999;
                              let labelStyle = "bg-zinc-100 text-zinc-855 text-zinc-700 border border-zinc-300";
                              let alertMsgText = "";
                              let alertBadge = "🕒 EN ESPERA DE DÍA";
                              let urgencyLevel: 'waiting' | 'warn30' | 'warn10' | 'emergency' | 'now' | 'retrasado' = 'waiting';

                              if (isToday && post.scheduledTime) {
                                const [pH, pM] = post.scheduledTime.split(':').map(Number);
                                const [cH, cM] = activeDetails.time.split(':').map(Number);
                                diff = (pH * 60 + pM) - (cH * 60 + cM);

                                if (diff > 30) {
                                  alertBadge = `🕒 FALTAN ${diff} MIN`;
                                  labelStyle = "bg-zinc-105 text-zinc-700 border border-zinc-300 font-bold";
                                  alertMsgText = `Aún faltan ${diff} minutos para tu hora boom en ${post.channel}. Prepara tus gráficos.`;
                                  urgencyLevel = 'waiting';
                                } else if (diff <= 30 && diff > 10) {
                                  alertBadge = `🕒 FALTAN ${diff} MIN`;
                                  labelStyle = "bg-amber-100 text-amber-800 border-2 border-amber-400 font-bold";
                                  alertMsgText = `Para tu negocio ${activeBusiness?.name || 'tu negocio'}, tu publicación está cerca. ¡Faltan exactamente ${diff} minutos para tu hora boom en ${post.channel}! No lo dejes pasar, prepara las imágenes.`;
                                  urgencyLevel = 'warn30';
                                } else if (diff <= 10 && diff > 5) {
                                  alertBadge = `⏰ ALERTA CRÍTICA (${diff} MIN)`;
                                  labelStyle = "bg-rose-100 text-rose-800 border-2 border-rose-400 font-black animate-pulse";
                                  alertMsgText = `¡Atención! Es hora de alistarse, faltan solo ${diff} minutos para publicar tu post de hora boom en tu red social ${post.channel}.`;
                                  urgencyLevel = 'warn10';
                                } else if (diff <= 5 && diff > 0) {
                                  alertBadge = `🚨 ROJO EMERGENCIA (${diff} MIN)`;
                                  labelStyle = "bg-red-600 text-white border-2 border-red-800 font-black animate-bounce";
                                  alertMsgText = `🚨 ¡ROJO DE EMERGENCIA DE PUBLICACIÓN! Faltan solo ${diff} minutos para publicar tu post en ${post.channel}. Se te está perdiendo la oportunidad estelar deengagement. ¡Súbelo ya!`;
                                  urgencyLevel = 'emergency';
                                } else if (diff === 0) {
                                  alertBadge = `🔥 ¡MOMENTO DE ORO ACTIVO!`;
                                  labelStyle = "bg-emerald-500 text-white font-black animate-pulse border border-emerald-600";
                                  alertMsgText = `🔥 ¡Llegó tu momento de oro! Ya es exactamente la hora boom registrada para publicar en tu ${post.channel}. ¡Copia el contenido y publícalo ahora mismo!`;
                                  urgencyLevel = 'now';
                                } else {
                                  alertBadge = `💸 RETRASADO (${Math.abs(diff)} MIN)`;
                                  labelStyle = "bg-indigo-150 bg-indigo-50 text-indigo-900 border-2 border-indigo-400 font-extrabold";
                                  alertMsgText = `⚠️ Alerta de retraso: Tu post para ${post.channel} tiene ya un retraso de ${Math.abs(diff)} minutos respecto a su hora planificada. ¡Por favor completa la acción ahora!`;
                                  urgencyLevel = 'retrasado';
                                }
                              } else {
                                alertMsgText = `Programado para el día ${postDay} de la Semana Estratégica ${postWeek}. El contador dinámico se activará automáticamente el día y semana indicados.`;
                              }

                              return (
                                <div key={post.id} className="bg-zinc-50 border-2 border-zinc-200 p-4 text-[10px] space-y-3 shadow-xs">
                                  <div className="flex justify-between items-start font-mono">
                                    <div className="overflow-hidden pr-2">
                                      <span className="bg-zinc-900 text-white text-[7.5px] px-2 py-0.5 tracking-wider uppercase font-bold mr-1.5">{post.channel}</span>
                                      <span className="text-zinc-900 font-bold text-xs uppercase block truncate mt-1">{post.title}</span>
                                      <span className="text-zinc-500 text-[9px] flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3 text-zinc-400" /> {post.scheduledDate} a las {post.scheduledTime}
                                      </span>
                                    </div>
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 text-[8.5px] uppercase font-bold tracking-tight border border-amber-300">
                                      Programado
                                    </span>
                                  </div>

                                  {/* DINAMIC ALERTS ALONG WITH LIVE IN-APP COUNTDOWNS (FALTAN X MINUTOS COMO DIJO EL USUARIO) */}
                                  <div className="bg-white border text-[10px] p-3 space-y-2 rounded-none relative overflow-hidden">
                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                      <span className="text-[8.5px] font-mono font-bold text-zinc-400 uppercase">Estado Dinámico del Reloj:</span>
                                      <span className={`text-[8.5px] font-mono font-black py-0.5 px-2 tracking-wider ${labelStyle}`}>
                                        {alertBadge}
                                      </span>
                                    </div>
                                    
                                    <div className="text-[10px] font-sans text-zinc-800 font-light leading-relaxed">
                                      {alertMsgText}
                                    </div>
                                  </div>

                                  {/* ESTADO DE PUBLICACIÓN & CONFIRMACIÓN (BOTÓN HECHO / AÚN FALTA COMO PIDIÓ EL USUARIO) */}
                                  <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                    <div className="font-mono">
                                      <span className="text-[7.5px] text-zinc-400 uppercase tracking-widest block font-bold">CONFIRMACIÓN DE HISTORIAL</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full ${diff < 0 ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`}></span>
                                        <span className="text-[8.5px] font-bold text-zinc-700 uppercase">
                                          {diff < 0 ? '⚠️ Post Retrasado - Aún Falta Publicar' : '⚡ Programado - Aún Falta Publicar'}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const updated = { ...post, status: 'Publicado' as const };
                                        const docRef = doc(db, `users/${userId}/calendar`, post.id);
                                        await setDoc(docRef, updated, { merge: true });
                                        setCalendarItems(prev => prev.map(p => p.id === post.id ? updated : p));
                                        setSuccessMsg(`✓ Publicación "${post.title}" confirmada como publicada. ¡Felicidades! 🎉`);
                                      }}
                                      className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-950 text-white font-mono text-[7.5px] font-bold py-1.5 px-2.5 uppercase tracking-wider cursor-pointer border-0"
                                    >
                                      ✓ Hecho (Ya lo publiqué)
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          }
                          {filterCalendarByBiz(activeBusiness?.id || 'null_biz').filter(p => p.status === 'Programado' || p.status === 'Pendiente de aprobación').length === 0 && (
                            <div className="text-center py-6 bg-zinc-50 border border-zinc-150 text-[9px] text-zinc-450 uppercase font-bold italic tracking-wide">
                              No hay publicaciones programadas activas para alertas. ¡Agrega un post al calendario!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  {/* Visual helper KPI panel */}
                  <div className="bg-white border-2 border-zinc-200 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-3">MÉTRICAS EDITORIALES (MES)</span>
                    
                    <div className="flex flex-col gap-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-550 text-zinc-650">Total calendarizados:</span>
                        <span className="font-bold text-zinc-950 font-mono">{filterCalendarByBiz(activeBusiness?.id || '').length} posts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-550 text-zinc-650">Borradores (draft):</span>
                        <span className="font-bold text-zinc-650 font-mono">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'Borrador').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-550 text-zinc-650">Programados:</span>
                        <span className="font-bold text-emerald-700 font-mono animate-pulse">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'Programado').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-550 text-zinc-650">Publicados:</span>
                        <span className="font-bold text-zinc-950 font-mono">
                          {filterCalendarByBiz(activeBusiness?.id || '').filter(p => p.status === 'Publicado').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Interactive calendar posts proposed */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* CALENDAR FILTER HEADER BAR */}
                  <div className="bg-white border-2 border-zinc-200 p-4.5 rounded-none flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                    <div className="flex flex-wrap gap-4 items-center justify-between pb-3 border-b border-zinc-150">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-zinc-900" /> PLANIFICACIÓN EDITORIAL DE CONTENIDOS
                        </span>
                        {activeStrategy && (
                          <div className="text-[11px] text-zinc-650 font-medium">
                            Calendario activo de: <strong className="text-zinc-900">{activeStrategy.title}</strong>
                          </div>
                        )}
                      </div>

                      {/* Dropdown de Historial mensual en el mismo calendario */}
                      {businessStrats.length > 0 && (
                        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-100 hover:bg-zinc-200/60 transition duration-150 border border-zinc-200 px-3 py-1.5">
                          <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">MES / ESTRATEGIA:</span>
                          <select
                            value={activeStrategy?.id || ''}
                            onChange={(e) => {
                              setSelectedStrategyId(e.target.value);
                              setShowAllCalendarPosts(false);
                            }}
                            className="bg-transparent border-none text-[10px] font-mono font-bold tracking-tight text-zinc-950 focus:outline-none cursor-pointer uppercase py-0.5"
                            id="select-calendar-strategy-header"
                          >
                            {businessStrats.map((strat) => (
                              <option key={strat.id} value={strat.id}>
                                {strat.title} ({new Date(strat.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* View Switcher Toggle & Filters */}
                    <div className="flex flex-wrap gap-3 items-center text-[10px] font-mono">
                      {/* Grid / List switcher */}
                      <div className="flex border border-zinc-200 bg-zinc-50 p-0.5 rounded-none">
                        <button
                          type="button"
                          onClick={() => setCalendarView('grid')}
                          className={`px-3 py-1.5 text-[8.5px] uppercase font-bold tracking-wider rounded-none cursor-pointer transition-all ${calendarView === 'grid' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                          Vista Calendario (Mes)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarView('list')}
                          className={`px-3 py-1.5 text-[8.5px] uppercase font-bold tracking-wider rounded-none cursor-pointer transition-all ${calendarView === 'list' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                          Lista Completa
                        </button>
                      </div>

                      {/* Botón de Historial de Publicaciones */}
                      <button
                        type="button"
                        onClick={() => setShowAllCalendarPosts(!showAllCalendarPosts)}
                        className={`px-3 py-1.5 border uppercase text-[9px] font-mono font-bold tracking-wider rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
                          showAllCalendarPosts 
                            ? 'bg-zinc-900 border-zinc-900 w-fit text-white shadow-xs' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900'
                        }`}
                        title="Alternar entre ver las publicaciones del plan seleccionado, o todo el historial."
                      >
                        <History className="w-3.5 h-3.5" /> {showAllCalendarPosts ? "Ver: Todo el Historial" : "Ver: Sólo Plan Seleccionado"}
                      </button>

                      {/* Network Filter */}
                      <select 
                        value={filterChannel} 
                        onChange={(e) => setFilterChannel(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 text-zinc-700 py-1.5 px-3 rounded-none focus:outline-none uppercase text-[9px] font-bold"
                      >
                        <option value="Todos">Red social: Todas</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                      </select>

                      {/* Status Filter */}
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 text-zinc-700 py-1.5 px-3 rounded-none focus:outline-none uppercase text-[9px] font-bold"
                      >
                        <option value="Todos">Estado: Todos</option>
                        <option value="Borrador">Borradores</option>
                        <option value="Pendiente de aprobación">Pendientes</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Programado">Programado</option>
                        <option value="Publicado">Publicado</option>
                      </select>

                      {/* Week Filter */}
                      <select 
                        value={filterWeek} 
                        onChange={(e) => setFilterWeek(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 text-zinc-700 py-1.5 px-3 rounded-none focus:outline-none uppercase text-[9px] font-bold"
                      >
                        <option value="Todos font-bold">Semana: Todas</option>
                        <option value="1">Semana 1</option>
                        <option value="2">Semana 2</option>
                        <option value="3">Semana 3</option>
                        <option value="4">Semana 4</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter process lists execution */}
                  {filterCalendarByBiz(activeBusiness?.id || '')
                    .filter(p => filterChannel === 'Todos' || p.channel === filterChannel)
                    .filter(p => filterStatus === 'Todos' || p.status === filterStatus)
                    .filter(p => filterWeek === 'Todos' || String(p.weekNum) === filterWeek)
                    .length === 0 ? (
                    <div className="bg-white border-2 border-zinc-200 rounded-none p-12 text-center text-zinc-600 text-xs italic font-mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                      Ningún post del calendario coincide con los filtros aplicados. Intenta de otra forma o crea un nuevo post.
                    </div>
                  ) : calendarView === 'grid' ? (
                    <div className="flex flex-col gap-4 font-sans text-xs">
                      {/* Grid representation */}
                      <div className="grid grid-cols-7 gap-1 border-2 border-zinc-200 bg-zinc-100 p-1 select-none shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                        
                        {/* Day headers */}
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                          <div key={day} className="bg-zinc-200 border border-zinc-300 py-1.5 text-center font-mono font-bold text-zinc-700 text-[10px] uppercase tracking-wider">
                            {day}
                          </div>
                        ))}

                        {/* Weeks rows */}
                        {[1, 2, 3, 4].map((weekNum) => (
                          <React.Fragment key={weekNum}>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                              const cellPosts = filterCalendarByBiz(activeBusiness?.id || '')
                                .filter(p => filterChannel === 'Todos' || p.channel === filterChannel)
                                .filter(p => filterStatus === 'Todos' || p.status === filterStatus)
                                .filter(p => filterWeek === 'Todos' || String(p.weekNum) === filterWeek)
                                .filter(p => Number(p.weekNum) === weekNum && getDayOfWeek(p.scheduledDate) === day);

                              const isWeekFilteredOut = filterWeek !== 'Todos' && filterWeek !== String(weekNum);

                              return (
                                <div 
                                  key={`${weekNum}-${day}`}
                                  className={`border bg-white min-h-[110px] p-2 flex flex-col justify-between transition-all group relative ${
                                    isWeekFilteredOut ? 'opacity-20 border-zinc-100 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50/50'
                                  }`}
                                >
                                  {/* Week and abbreviated day */}
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                                      Sem {weekNum}
                                    </span>
                                    <span className="text-[8.5px] font-mono leading-none text-zinc-500 font-bold">
                                      {day.slice(0, 3)}
                                    </span>
                                  </div>

                                  {/* Cell posts list */}
                                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                                    {cellPosts.map(post => {
                                      const badgeColor = 
                                        post.channel === 'Instagram' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        post.channel === 'Facebook' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        post.channel === 'TikTok' ? 'bg-zinc-100 text-zinc-900 border-zinc-300' :
                                        'bg-sky-50 text-sky-700 border-sky-200';

                                      const statusText = post.status || 'Borrador';
                                      const statusDotColor = 
                                        statusText === 'Publicado' ? 'bg-zinc-400' :
                                        statusText === 'Programado' ? 'bg-emerald-500 font-extrabold' :
                                        statusText === 'Pendiente de aprobación' ? 'bg-amber-500' :
                                        statusText === 'Aprobado' ? 'bg-teal-500' :
                                        'bg-zinc-400';

                                      return (
                                        <div 
                                          key={post.id}
                                          onClick={() => setSelectedPost(post)}
                                          className="p-1 border border-zinc-200 bg-zinc-50 hover:bg-white cursor-pointer text-left transition flex flex-col gap-0.5 hover:border-zinc-400 shadow-2xs"
                                          title={`Ver o programar post: ${post.title}`}
                                        >
                                          <div className="flex items-center justify-between gap-1 leading-none">
                                            <span className={`text-[7.5px] font-mono px-1 rounded-none border leading-none py-0.5 uppercase tracking-wide truncate max-w-[45px] ${badgeColor}`}>
                                              {post.channel}
                                            </span>
                                            <span className="text-[7.5px] font-mono text-zinc-500 font-bold text-right leading-none">
                                              {post.scheduledTime || '18:00'}
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-bold text-zinc-800 truncate block leading-tight uppercase font-sans tracking-wide">
                                            {post.title}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                                            <span className="text-[7.5px] font-mono text-zinc-500 uppercase leading-none truncate max-w-[90%]">{statusText}</span>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {cellPosts.length === 0 && (
                                      <div className="h-full flex items-center justify-center">
                                        <span className="text-[7.5px] font-mono text-zinc-300 uppercase tracking-wider opacity-60 group-hover:opacity-0 transition-opacity">Vacío</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Inline direct manual addition for cell */}
                                  {!isWeekFilteredOut && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newPostId = 'post_manual_' + Math.random().toString(36).substring(2, 9);
                                        const postObj: CalendarPost = {
                                          id: newPostId,
                                          userId,
                                          businessId: activeBusiness?.id || '',
                                          strategyId: activeStrategy?.id || '',
                                          title: 'Nueva Publicación ' + day,
                                          copy: 'Escribe el copy persuasivo de tu publicación aquí...',
                                          channel: filterChannel !== 'Todos' ? (filterChannel as any) : 'Instagram',
                                          scheduledDate: `${day} de la Semana ${weekNum}`,
                                          scheduledTime: '18:00',
                                          type: 'Imagen',
                                          imageUrlPrompt: '',
                                          status: filterStatus !== 'Todos' ? (filterStatus as any) : 'Borrador',
                                          weekNum: weekNum,
                                          priority: 'Media',
                                          createdAt: new Date().toISOString()
                                        };
                                        setSelectedPost(postObj);
                                      }}
                                      className="w-full text-center py-0.5 border border-dashed border-zinc-200 hover:border-zinc-400 text-[8px] font-mono text-zinc-400 hover:text-zinc-800 uppercase transition-all opacity-0 group-hover:opacity-100 mt-1 cursor-pointer"
                                    >
                                      + Agregar
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 font-sans text-xs">
                      {filterCalendarByBiz(activeBusiness?.id || '')
                        .filter(p => filterChannel === 'Todos' || p.channel === filterChannel)
                        .filter(p => filterStatus === 'Todos' || p.status === filterStatus)
                        .filter(p => filterWeek === 'Todos' || String(p.weekNum) === filterWeek)
                        .map(post => {
                          return (
                            <div 
                              key={post.id}
                              className="bg-white border-2 border-zinc-200 hover:border-zinc-300 p-5 rounded-none transition flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] relative"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {post.weekNum && (
                                    <span className="font-mono text-[9px] text-zinc-900 font-bold bg-zinc-100 px-2 py-0.5 uppercase tracking-wider border border-zinc-200">
                                      Semana {post.weekNum}
                                    </span>
                                  )}
                                  <span className="font-mono text-[10px] text-zinc-600 font-bold bg-white px-2.5 py-1 rounded-none border border-zinc-200">
                                    {post.scheduledDate} @ {post.scheduledTime}
                                  </span>
                                  <span className={`text-[9px] font-mono font-bold py-1 px-2.5 rounded-none uppercase tracking-wider border ${
                                    post.channel === 'Instagram' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    post.channel === 'TikTok' ? 'bg-zinc-100 text-zinc-900 border-zinc-300' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {post.channel}
                                  </span>
                                  <span className="text-[9px] bg-zinc-100 font-mono text-zinc-500 px-2 py-0.5 rounded-none uppercase border border-zinc-200">
                                    {post.type}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => setSelectedPost(post)}
                                    className="text-[9px] bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 py-1 px-2.5 rounded-none uppercase tracking-wider font-mono font-bold flex items-center gap-1"
                                    title="Editar Post y Contenido"
                                  >
                                    <Edit3 className="w-3 h-3 text-zinc-605" /> Editar
                                  </button>
                                  <span 
                                    className={`text-[9px] font-mono font-bold py-1 px-2.5 rounded-none uppercase tracking-widest border ${
                                      post.status === 'Publicado' ? 'bg-zinc-100 text-zinc-900 border-zinc-200' :
                                      post.status === 'Programado' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold shadow-xs' :
                                      post.status === 'Pendiente de aprobación' ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold' :
                                      'bg-zinc-100 text-zinc-500 border-zinc-200'
                                    }`}
                                  >
                                    {post.status}
                                  </span>
                                  <button 
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-zinc-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                    title="Eliminar Publicación"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                  </button>
                                </div>
                              </div>

                              <div className="my-3.5">
                                <h5 className="font-bold text-zinc-900 text-xs mb-1 uppercase tracking-wider">{post.title}</h5>
                                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200 relative group mt-2.5">
                                  <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans font-light mt-1 text-[12px]">
                                    {post.copy}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(post.id, post.copy)}
                                    className="absolute top-2.5 right-2.5 bg-white border border-zinc-200 text-zinc-505 hover:text-zinc-900 p-1.5 rounded-none transition opacity-60 group-hover:opacity-100 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider cursor-pointer shadow-xs"
                                    title="Copiar texto listo"
                                  >
                                    {copiedId === post.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-zinc-800" /> <span className="text-zinc-900 font-bold">COPIADO</span>
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
                                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-none text-[9px] mt-1 font-mono flex justify-between items-center gap-2">
                                  <div>
                                    <span className="font-bold text-amber-850 block uppercase mb-0.5">PROMPT DE IMAGEN IA SUGERIDO</span>
                                    <span className="text-zinc-650 font-sans font-light italic leading-normal block">
                                      {post.imageUrlPrompt}
                                    </span>
                                  </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white border-2 border-zinc-200 rounded-none w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] relative overflow-hidden"
            >
              <div className="px-6 py-5 border-b-2 border-zinc-200 flex justify-between items-center">
                <span className="font-sans font-bold text-sm text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-5 h-5 text-zinc-900" /> {isEditMode ? "EDITAR PERFIL DE MARCA / NEGOCIO" : "REGISTRAR PERFIL DE NEGOCIO"}
                </span>
                <button 
                  onClick={() => setShowAddBusiness(false)}
                  className="text-zinc-500 hover:text-zinc-900 font-mono font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterBusiness} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs p-3.5 rounded-none font-mono tracking-wide leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Nombre de la Empresa o Marca *</label>
                  <input
                    type="text"
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="ej: Panadería Levadura Viva, FitStudio"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Nicho o Sector Comercial *</label>
                  <input
                    type="text"
                    value={newBizNiche}
                    onChange={(e) => setNewBizNiche(e.target.value)}
                    placeholder="ej: Alimentación Premium, Fitness y Bienestar"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Descripción del Negocio / Qué vendes *</label>
                  <textarea
                    value={newBizDesc}
                    onChange={(e) => setNewBizDesc(e.target.value)}
                    rows={3}
                    placeholder="ej: Elaboramos panes artesanales mediante masa madre de fermentación lenta..."
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans font-light leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Público Objetivo o Cliente Ideal (Opcional)</label>
                  <input
                    type="text"
                    value={newBizAudience}
                    onChange={(e) => setNewBizAudience(e.target.value)}
                    placeholder="ej: Personas interesadas en comida orgánica"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="border-t border-zinc-200 pt-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Canales de Redes Sociales Activos (Opcional)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Instagram @</span>
                      <input
                        type="text"
                        value={newBizInsta}
                        onChange={(e) => setNewBizInsta(e.target.value)}
                        placeholder="ej: levaduraviva"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2.5 text-[11px] text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">TikTok @</span>
                      <input
                        type="text"
                        value={newBizTikTok}
                        onChange={(e) => setNewBizTikTok(e.target.value)}
                        placeholder="ej: levaduraviva"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2.5 text-[11px] text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Facebook URL</span>
                      <input
                        type="text"
                        value={newBizFb}
                        onChange={(e) => setNewBizFb(e.target.value)}
                        placeholder="ej: facebook.com/levaduraviva"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2.5 text-[11px] text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 mt-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddBusiness(false)}
                    className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 px-4.5 py-2.5 rounded-none text-zinc-650 uppercase tracking-widest cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingBiz}
                    className="bg-zinc-900 hover:bg-zinc-850 text-white border-r-4 border-b-4 border-zinc-400 active:translate-y-0.5 font-bold px-5 py-2.5 rounded-none cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    {addingBiz ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> {isEditMode ? "Guardar Cambios" : "Registrar Marca"}
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
          <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs">
            {/* Backdrop close */}
            <div className="absolute inset-0" onClick={() => setShowCopywriterDrawer(false)}></div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-lg bg-white border-l-2 border-zinc-200 h-full flex flex-col justify-between shadow-2xl relative z-10 rounded-none"
            >
              {/* Drawer header */}
              <div className="px-6 py-5 border-b-2 border-zinc-200 flex justify-between items-center bg-zinc-50">
                <span className="font-sans font-bold text-sm text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-5 h-5 text-zinc-900 animate-pulse" /> REDACTOR DE COPYWRITING IA
                </span>
                <button 
                  onClick={() => setShowCopywriterDrawer(false)}
                  className="text-zinc-500 hover:text-zinc-900 font-mono font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer core content */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-white">
                
                {cwError && (
                  <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs p-3.5 rounded-none font-mono tracking-wide leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{cwError}</span>
                  </div>
                )}

                <form onSubmit={handleGenerateCustomCopy} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-550 text-zinc-650 block mb-1.5 uppercase tracking-wider">Tema o Ángulo de Venta para el post</label>
                    <textarea
                      value={cwTopic}
                      onChange={(e) => setCwTopic(e.target.value)}
                      rows={3}
                      placeholder="ej: Oferta especial o beneficios reales del producto"
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-sans font-light resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-550 text-zinc-650 block mb-1.5 uppercase tracking-wider">Red Social</label>
                      <select
                        value={cwChannel}
                        onChange={(e) => setCwChannel(e.target.value as any)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3 text-xs text-zinc-750 focus:border-zinc-500 focus:outline-none font-sans"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-550 text-zinc-650 block mb-1.5 uppercase tracking-wider">Tono del copy</label>
                      <select
                        value={cwTone}
                        onChange={(e) => setCwTone(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3 text-xs text-zinc-750 focus:border-zinc-500 focus:outline-none font-sans"
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
                    className="w-full bg-zinc-900 hover:bg-zinc-850 text-white disabled:opacity-50 disabled:pointer-events-none py-3.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-r-4 border-b-4 border-zinc-500 active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {cwLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-none animate-spin"></div>
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
                    className="bg-zinc-50 p-5 rounded-none border border-zinc-200 mt-2 relative group shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                  >
                    <span className="text-[9px] bg-zinc-100 text-zinc-700 font-mono px-2 py-0.5 rounded-none font-bold uppercase tracking-widest block w-max mb-3 border border-zinc-200">
                      PROPUESTA LOGRADA CON GEMINI
                    </span>
                    
                    <h5 className="font-sans font-bold text-sm text-zinc-900 uppercase tracking-wide">{cwResult.title}</h5>
                    
                    <div className="bg-white border border-zinc-200 p-4 rounded-none mt-3 relative leading-relaxed text-xs text-zinc-700 whitespace-pre-wrap font-sans font-light">
                      {cwResult.copy}
                      <button
                        onClick={() => copyToClipboard('cw_res', cwResult.copy)}
                        className="absolute top-2.5 right-2.5 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-900 p-1 rounded-none transition opacity-60 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider cursor-pointer"
                      >
                        {copiedId === 'cw_res' ? <Check className="w-3.5 h-3.5 text-zinc-800" /> : <Copy className="w-3" />} Copiar
                      </button>
                    </div>

                    {cwResult.imagePrompt && (
                      <div className="bg-amber-50/50 p-3 rounded-none text-[9px] mt-3 border border-amber-100 font-mono">
                        <span className="font-bold text-amber-900 block uppercase mb-1">PROMPT SUGERIDO PARA IMAGEN IA</span>
                        <span className="text-zinc-650 font-sans font-light italic leading-normal block">
                          {cwResult.imagePrompt}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleAddCwToCalendar}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-[10px] font-mono font-bold py-2.5 rounded-none uppercase tracking-wider transition mt-5 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" /> AGREGAR PROPUESTA AL CALENDARIO
                    </button>
                  </motion.div>
                )}

              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t-2 border-zinc-200 text-center text-[9px] text-zinc-500 font-mono uppercase tracking-widest bg-zinc-50">
                Acceso bajo motor LLM de Gemini en Español
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STRATEGY WIZARD MODAL WIDGET */}
      {showWizard && activeBusiness && (
        <StrategyWizard 
          userId={userId} 
          business={activeBusiness} 
          onClose={() => setShowWizard(false)} 
          onSuccess={handleWizardSuccess} 
          onLimitExceeded={() => setShowPaywall(true)}
        />
      )}

      {/* INDIVIDUAL POST DETAIL DRAWER MODAL */}
      {selectedPost && (
        <PostDetailsModal 
          userId={userId} 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onUpdate={(updated) => {
            setCalendarItems(prev => {
              const exists = prev.some(p => p.id === updated.id);
              if (exists) {
                return prev.map(p => p.id === updated.id ? updated : p);
              } else {
                return [updated, ...prev];
              }
            });
            setSelectedPost(null);
          }} 
          onDelete={(id) => {
            setCalendarItems(prev => prev.filter(p => p.id !== id));
            setSelectedPost(null);
          }} 
          onLimitExceeded={() => setShowPaywall(true)}
        />
      )}

      {/* GLOBAL HIGH-CONVERTING MONETIZATION PAYWALL */}
      <PremiumUpgradeModal 
        userId={userId}
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgradeSuccess={fetchUserContent}
        currentUsage={subscription}
      />

      {/* CUSTOM CLASSIFIED CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-90 w-full max-w-sm bg-zinc-900 border border-zinc-800 text-white p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${
                  confirmDialog.type === 'danger' 
                    ? 'bg-rose-500/20 text-rose-450 text-rose-400' 
                    : confirmDialog.type === 'warning' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider">
                  {confirmDialog.title}
                </h3>
              </div>

              <p className="text-xs font-sans text-zinc-300 leading-relaxed font-light mb-6">
                {confirmDialog.message}
              </p>

              <div className="flex justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 px-4 py-2.5 uppercase tracking-wide cursor-pointer text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-4 py-2.5 uppercase tracking-wide cursor-pointer font-bold ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-800'
                      : 'bg-indigo-600 hover:bg-indigo-400 text-white border border-indigo-750'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
