  import React, { useState, useEffect } from 'react';
  import { 
    X, 
    Check, 
    Sparkles, 
    Edit3, 
    Trash2, 
    Calendar, 
    Clock, 
    Copy, 
    MessageCircle, 
    Hash, 
    Upload, 
    ImageIcon, 
    Video as VideoIcon, 
    ChevronRight, 
    RotateCw,
    AlertCircle,
    Rocket
  } from 'lucide-react';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { doc, setDoc, deleteDoc } from 'firebase/firestore';
  import { db, storage } from '../lib/firebase';
  import { CalendarPost } from '../types';

  interface PostDetailsModalProps {
    userId: string;
    post: CalendarPost;
    onClose: () => void;
    onUpdate: (updatedPost: CalendarPost) => void;
    onDelete: (postId: string) => void;
    onLimitExceeded?: (type: string) => void;
  }

  export default function PostDetailsModal({ userId, post, onClose, onUpdate, onDelete, onLimitExceeded }: PostDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'edit' | 'ai-variations' | 'multimedia'>('edit');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

    // Form Fields
    const [title, setTitle] = useState(post.title || '');
    const [copy, setCopy] = useState(post.copy || '');
    const [cta, setCta] = useState(post.cta || '');
    const [hashtags, setHashtags] = useState(post.hashtags ? post.hashtags.join(', ') : '');
    const [scheduledDate, setScheduledDate] = useState(post.scheduledDate || '');
    const [scheduledTime, setScheduledTime] = useState(post.scheduledTime || '18:00');
    const [channel, setChannel] = useState(post.channel || 'Instagram');
    const [status, setStatus] = useState(post.status || 'Borrador');
    const [type, setType] = useState(post.type || 'Imagen');
    const [imageUrlPrompt, setImageUrlPrompt] = useState(post.imageUrlPrompt || '');
    const [imageUrl, setImageUrl] = useState(post.imageUrl || '');
    const [videoUrl, setVideoUrl] = useState(post.videoUrl || '');

    // Helper to parse and select Day and Week easily
    const parseDayName = (dateStr: string): string => {
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

    const [selectedDay, setSelectedDay] = useState(parseDayName(post.scheduledDate || 'Lunes'));
    const [selectedWeek, setSelectedWeek] = useState<number>(post.weekNum || 1);

    // Auto-sync scheduledDate when selectedDay or selectedWeek changes
    useEffect(() => {
      setScheduledDate(`${selectedDay} de la Semana ${selectedWeek}`);
    }, [selectedDay, selectedWeek]);

    // AI Alternatives Generation
    const [aiVariations, setAiVariations] = useState<{
      copies: string[];
      ctas: string[];
      titles: string[];
    } | null>(null);
    const [loadingVariations, setLoadingVariations] = useState(false);

    // Upload Replace file State
    const [replaceUploading, setReplaceUploading] = useState(false);
    const [uploadLog, setUploadLog] = useState('');

    // Gemini Image Generator State
    const [generatingImage, setGeneratingImage] = useState(false);
    const [imageGenerationLog, setImageGenerationLog] = useState('');
    const [imageEngine, setImageEngine] = useState<'free' | 'gemini'>('free');

    // Copy and Publish Confirmation Overlay States
    const [copiedText, setCopiedText] = useState(false);
    const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleCopyAndPublish = () => {
      const formattedHashtags = hashtags
        .split(',')
        .map(h => h.trim())
        .filter(Boolean)
        .map(h => h.startsWith('#') ? h : `#${h}`)
        .join(' ');
      const fullText = `${copy}\n\n${cta ? `🔗 ${cta}\n\n` : ''}${formattedHashtags}`;
      
      navigator.clipboard.writeText(fullText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
      setShowPublishConfirmation(true);
    };

    const confirmAsPublished = async () => {
      setSaving(true);
      setError(null);
      try {
        const hashtagsArray = hashtags
          .split(',')
          .map(h => h.trim().replace(/^#/, ''))
          .filter(Boolean);

        const updatedObj = {
          title,
          copy,
          cta,
          hashtags: hashtagsArray,
          scheduledDate,
          scheduledTime,
          channel,
          status: 'Publicado' as const,
          type,
          imageUrlPrompt,
          imageUrl,
          videoUrl,
          weekNum: Number(selectedWeek)
        };

        const docRef = doc(db, `users/${userId}/calendar`, post.id);
        const fullObj = {
          id: post.id,
          userId: userId,
          businessId: post.businessId,
          strategyId: post.strategyId || '',
          priority: post.priority || 'Media',
          createdAt: post.createdAt || new Date().toISOString(),
          ...updatedObj
        };

        await setDoc(docRef, fullObj, { merge: true });
        setStatus('Publicado');
        onUpdate(fullObj as CalendarPost);
        setShowPublishConfirmation(false);
      } catch (err) {
        console.error(err);
        setError("Error al marcar la publicación como publicada.");
      } finally {
        setSaving(false);
      }
    };

    // Handle direct single edits saving
    const handleSaveChanges = async () => {
      setSaving(true);
      setError(null);
      try {
        const hashtagsArray = hashtags
          .split(',')
          .map(h => h.trim().replace(/^#/, ''))
          .filter(Boolean);

        const updatedObj = {
          title,
          copy,
          cta,
          hashtags: hashtagsArray,
          scheduledDate,
          scheduledTime,
          channel,
          status,
          type,
          imageUrlPrompt,
          imageUrl,
          videoUrl,
          weekNum: Number(selectedWeek)
        };

        const docRef = doc(db, `users/${userId}/calendar`, post.id);
        
        const fullObj = {
          id: post.id,
          userId: userId,
          businessId: post.businessId,
          strategyId: post.strategyId || '',
          priority: post.priority || 'Media',
          createdAt: post.createdAt || new Date().toISOString(),
          ...updatedObj
        };

        await setDoc(docRef, fullObj, { merge: true });

        onUpdate(fullObj as CalendarPost);
        
        onClose();
      } catch (err) {
        console.error(err);
        setError("Error al guardar cambios editoriales en la base de datos.");
      } finally {
        setSaving(false);
      }
    };

    // Trigger Gemini variations (copies, ctas, titles)
    const fetchAIVariations = async () => {
      setLoadingVariations(true);
      setError(null);
      try {
        const res = await fetch('/api/generate-post-variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: title,
            currentCopy: copy
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error === 'LIMIT_EXCEEDED') {
            if (onLimitExceeded) onLimitExceeded('copies');
            throw new Error("LÍMITE EXCEDIDO: Has agotado los créditos de redacción de tu plan actual. Por favor actualiza tu membresía.");
          }
          throw new Error(errData.error || "Socio IA no disponible. Comprueba tu conexión o clave de API.");
        }

        const data = await res.json();
        setAiVariations(data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Ocurrió un error obteniendo alternativas creativas.");
      } finally {
        setLoadingVariations(false);
      }
    };

    // 1-Click apply variaton helper
    const applyVariation = (field: 'title' | 'copy' | 'cta', value: string) => {
      setSuccessFeedback(null);
      if (field === 'title') {
        setTitle(value);
        setSuccessFeedback("✓ ¡Título alternativo aplicado con éxito al borrador!");
      }
      if (field === 'copy') {
        setCopy(value);
        setSuccessFeedback("✓ ¡Copy alternativo aplicado con éxito al borrador!");
      }
      if (field === 'cta') {
        setCta(value);
        setSuccessFeedback("✓ ¡Llamado a la Acción (CTA) aplicado con éxito!");
      }
      setTimeout(() => setSuccessFeedback(null), 3000);
    };

    // Replace image/video in local backend and do AI Auto-Reanalysis + Copy adjustment
    const handleUploadReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      setReplaceUploading(true);
      setUploadLog('Preparando archivo para la carga instantánea sin CORS...');
      setError(null);

      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;

        setUploadLog('Subiendo archivo al servidor de marketing...');
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
          throw new Error(errData.error || "Fallo al subir el archivo al servidor.");
        }

        const { url: downloadUrl } = await uploadRes.json();
        const absoluteUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`;

        if (isVideo) {
          setVideoUrl(absoluteUrl);
          setImageUrl('');
          setType('Video');
        } else {
          setImageUrl(absoluteUrl);
          setVideoUrl('');
          setType('Imagen');
        }

        setUploadLog('Analizando archivo con marketcore Vision...');
        
        // Analyze file with our endpoint
        const analysisRes = await fetch('/api/analyze-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: absoluteUrl,
            type: file.type,
            name: file.name
          })
        });

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          setUploadLog('Escribiendo copy persuasivo con la información del recurso...');

          // Update post copy, hashtags and prompts automatically based on analysis
          const copyRes = await fetch('/api/generate-copywriter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              topic: `Venta y promoción de producto: ${analysisData.productShown}. Recomendaciones estéticas a destacar: ${analysisData.recommendations?.slice(0, 2).join('; ')}`,
              channel,
              tone: 'persuasivo y emocional',
              businessInfo: { name: post.title }
            })
          });

          if (!copyRes.ok) {
            const errData = await copyRes.json().catch(() => ({}));
            if (errData.error === 'LIMIT_EXCEEDED') {
              if (onLimitExceeded) onLimitExceeded('copies');
              throw new Error("LÍMITE EXCEDIDO: Has agotado tus créditos de Copies de tu plan actual. Por favor actualiza tu membresía.");
            }
            throw new Error(errData.error || "No se pudo autogenerar la redacción.");
          }

          if (copyRes.ok) {
            const copyData = await copyRes.json();
            setCopy(copyData.copy || copy);
            setTitle(copyData.title || title);
            if (copyData.imagePrompt) {
              setImageUrlPrompt(copyData.imagePrompt);
            }
            setUploadLog('¡Reemplazo exitoso! Redacción e imagen actualizadas.');
          } else {
            setUploadLog('Material guardado mas no se pudo regenerar redacción automáticamente.');
          }
        } else {
          setUploadLog('Material guardado sin análisis automatizado provisto.');
        }

      } catch (err: any) {
        console.error(err);
        setError("Error al reemplazar el recurso de forma persistente: " + (err.message || err));
      } finally {
        setReplaceUploading(false);
      }
    };

    // Call server to generate image (supports free engine and automatic key/quota high-availability fallbacks)
    const handleGenerateImage = async () => {
      if (!imageUrlPrompt.trim()) {
        setError("Por favor define un prompt de imagen antes de generar.");
        return;
      }
      setGeneratingImage(true);
      setError(null);
      setImageGenerationLog(imageEngine === 'gemini' ? 'Contactando a marketcore para generar la imagen...' : 'Conectando al Motor Libre (Pollinations AI)...');

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            prompt: imageUrlPrompt.trim(),
            aspectRatio: '1:1',
            engine: imageEngine
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error === 'LIMIT_EXCEEDED') {
            if (onLimitExceeded) onLimitExceeded('images');
            throw new Error("LÍMITE EXCEDIDO: Has agotado tus créditos de generación de imágenes. Por favor actualiza tu membresía.");
          }
          throw new Error(errData.error || "No se pudo generar la imagen.");
        }

        const { base64Image, source } = await res.json();
        setImageGenerationLog('Guardando la imagen en el servidor...');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64Image,
            filename: `generated_${post.id}_${Date.now()}.png`,
            mimeType: 'image/png'
          })
        });

        if (!uploadRes.ok) {
          throw new Error("No se pudo guardar la imagen en el servidor de marketing.");
        }

        const { url: downloadUrl } = await uploadRes.json();
        const absoluteUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`;

        setImageUrl(absoluteUrl);
        setVideoUrl('');
        setType('Imagen');

        if (source === 'gemini') {
          setImageGenerationLog('¡Imagen generada exitosamente con Gemini 2.5!');
        } else {
          setImageGenerationLog('¡Imagen generada exitosamente con el Motor Libre!');
        }
        setGeneratingImage(false);
        return;
      } catch (err: any) {
        console.warn("Backend image request failed/blocked:", err);
        if (err.message && err.message.includes("LÍMITE EXCEDIDO")) {
          setError(err.message);
          setGeneratingImage(false);
          return;
        }
      }

      // Client direct fetch (runs fully on browser, bypassing any server-side restrictions or proxy blocks)
      try {
        setImageGenerationLog('El servidor de generación está saturado. Conectando desde tu navegador directamente al Motor Libre...');
        const seed = Math.floor(Math.random() * 10000000);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageUrlPrompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        const browserRes = await fetch(pollUrl);
        if (!browserRes.ok) {
          throw new Error("El motor libre alternativo de respaldo también falló.");
        }

        const blob = await browserRes.blob();
        
        // Read blob of pollination to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(blob);
        const base64Data = await base64Promise;

        setImageGenerationLog('Almacenando imagen generada de forma segura...');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64Data,
            filename: `generated_${post.id}_${Date.now()}.png`,
            mimeType: 'image/png'
          })
        });

        if (!uploadRes.ok) {
          throw new Error("No se pudo almacenar la imagen generada.");
        }

        const { url: downloadUrl } = await uploadRes.json();
        const absoluteUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`;

        setImageUrl(absoluteUrl);
        setVideoUrl('');
        setType('Imagen');
        setImageGenerationLog('¡Imagen generada exitosamente con el Motor Libre de respaldo!');
      } catch (err: any) {
        console.error("Total image generation fail:", err);
        setError("No se pudo generar la imagen mediante ninguno de los canales. Comprueba tu conexión a internet o intenta de nuevo.");
      } finally {
        setGeneratingImage(false);
      }
    };

    const handlePostDelete = async () => {
      if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        setError("⚠️ ¿Estás absolutamente seguro de querer eliminar esta publicación? Pulsa de nuevo el botón de borrar para confirmar de manera definitiva.");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await deleteDoc(doc(db, `users/${userId}/calendar`, post.id));
        onDelete(post.id);
        onClose();
      } catch (err: any) {
        setError("Fallo al eliminar documento del calendario: " + (err.message || err));
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-900/60 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose}></div>

        {/* Main Drawer body */}
        <div className="w-full max-w-xl bg-white border-l-2 border-zinc-200 h-full flex flex-col justify-between shadow-2xl relative z-10 font-sans">
          
          {/* Header */}
          <div className="px-6 py-5 border-b-2 border-zinc-200 flex justify-between items-center bg-zinc-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-zinc-100 text-zinc-900 font-mono py-1 px-2 border border-zinc-250 uppercase block tracking-wider">
                {channel}
              </span>
              <span className="text-zinc-900 text-xs font-bold uppercase tracking-wider">
                EDITANDO PLANIFICACIÓN
              </span>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 font-bold cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inner Navigation Tabs */}
          <div className="bg-zinc-50 px-6 py-2 border-b border-zinc-200 flex items-center gap-3 text-[11px] font-mono select-none flex-shrink-0">
            <button 
              type="button" 
              onClick={() => setActiveTab('edit')} 
              className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'edit' ? 'border-zinc-900 text-zinc-905 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              Editar Campos
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('ai-variations'); if (!aiVariations) fetchAIVariations(); }} 
              className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'ai-variations' ? 'border-zinc-900 text-zinc-905 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              Variantes IA ✨
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('multimedia')} 
              className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'multimedia' ? 'border-zinc-900 text-zinc-905 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              Multimedia
            </button>
          </div>

          {successFeedback && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-emerald-800 text-xs font-mono flex items-center justify-between gap-2">
              <span className="font-bold flex-1">{successFeedback}</span>
              <button 
                type="button" 
                onClick={() => setSuccessFeedback(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-rose-800 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {/* Content body split by Tabs */}
          <div className="flex-1 p-6 overflow-y-auto bg-white space-y-5">
            
            {activeTab === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Concepto o Título de la Publicación</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Copy Persuasivo de Publicación</label>
                  <textarea
                    value={copy}
                    onChange={(e) => setCopy(e.target.value)}
                    rows={8}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-3.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none resize-none font-sans font-light leading-relaxed whitespace-pre-wrap"
                  />
                  <button
                    type="button"
                    onClick={handleCopyAndPublish}
                    className="mt-2.5 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-[9px] tracking-widest font-bold py-2.5 px-3 rounded-none uppercase flex items-center justify-center gap-2 border-r-4 border-b-4 border-emerald-900 active:translate-y-0.5 active:translate-x-0.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> COPIAR COPY E INICIAR PUBLICACIÓN EN {channel.toUpperCase()}
                  </button>
                  {copiedText && (
                    <span className="text-[9px] text-emerald-600 font-mono font-bold block mt-1 uppercase tracking-wider text-right animate-pulse">✓ ¡Copiado al portapapeles!</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">CTA Recomendado</label>
                    <input
                      type="text"
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Hashtags (Separados por coma)</label>
                    <input
                      type="text"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      placeholder="ej: marketing, panaderia, ventas"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2.5 px-3 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-[10px]">
                  <div>
                    <label className="text-zinc-550 block mb-1 uppercase tracking-wider">Semana</label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2 text-[11px] text-zinc-800 focus:border-zinc-500 focus:outline-none font-sans font-bold"
                    >
                      <option value={1}>Semana 1</option>
                      <option value={2}>Semana 2</option>
                      <option value={3}>Semana 3</option>
                      <option value={4}>Semana 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1 uppercase tracking-wider">Día Planificado</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2 text-[11px] text-zinc-800 focus:border-zinc-500 focus:outline-none font-sans font-bold"
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
                    <label className="text-zinc-550 block mb-1 uppercase tracking-wider">Hora Destino</label>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-2.5 text-[11px] text-zinc-800 focus:border-zinc-500 focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1 uppercase tracking-wider">Estado Post</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-2 px-1.5 text-[11px] text-zinc-805 focus:border-zinc-500 focus:outline-none font-sans font-bold uppercase"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Pendiente de aprobación">Pendiente</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Programado">Programado</option>
                      <option value="Publicado">Publicado</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Vencido">Vencido</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-variations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-200">
                  <div className="text-xs">
                    <span className="font-mono font-bold block text-zinc-900">VARIACIONES EDITORIALES MULTI-TRAYECTORIA</span>
                    <p className="text-[10px] text-zinc-500 font-sans font-light leading-normal">Genera opciones de copies estructurados en AIDA, llamados creativos a la acción y títulos con 1-click aplicables.</p>
                  </div>
                  <button
                    onClick={fetchAIVariations}
                    disabled={loadingVariations}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[9px] font-bold p-2 border border-zinc-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingVariations ? 'animate-spin' : ''}`} /> REGENERAR
                  </button>
                </div>

                {loadingVariations ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Generando alternativas mediante motor marketcore...</span>
                  </div>
                ) : aiVariations ? (
                  <div className="space-y-5">
                    {/* Copies variants */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase tracking-wider">Copys Opcionales Alternativos</span>
                      {aiVariations.copies?.map((val, idx) => (
                        <div key={idx} className="bg-zinc-50 p-3.5 border border-zinc-200 flex flex-col gap-2 relative group hover:border-zinc-400 transition mt-2.5 shadow-2xs">
                          <p className="text-[11px] text-zinc-700 leading-relaxed font-light whitespace-pre-wrap">{val}</p>
                          <button
                            type="button"
                            onClick={() => applyVariation('copy', val)}
                            className="bg-zinc-900 border border-zinc-750 text-white text-[9px] font-mono py-1 px-2.5 uppercase font-bold self-end hover:bg-zinc-800 transition mt-1.5"
                          >
                            Aplicar este copy
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* CTAs variants */}
                    <div className="space-y-2.5 pt-4 border-t border-zinc-200">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase tracking-wider">Llamados a la Acción de Reemplazo</span>
                      <div className="grid grid-cols-1 gap-2">
                        {aiVariations.ctas?.map((val, idx) => (
                          <div key={idx} className="bg-zinc-50 py-2.5 px-3.5 border border-zinc-200 flex items-center justify-between gap-3 text-[11px] hover:border-zinc-350 transition shadow-2xs">
                            <span className="text-zinc-600 italic font-mono">"{val}"</span>
                            <button
                              onClick={() => applyVariation('cta', val)}
                              className="bg-zinc-900 border border-zinc-750 text-[9px] font-mono px-2 py-1 uppercase text-white hover:bg-zinc-800"
                            >
                              Aplicar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Titles variants */}
                    <div className="space-y-2.5 pt-4 border-t border-zinc-200">
                      <span className="text-[10px] font-mono font-bold text-zinc-550 text-zinc-500 block uppercase tracking-wider">Conceptos y Títulos sugeridos</span>
                      <div className="grid grid-cols-1 gap-2">
                        {aiVariations.titles?.map((val, idx) => (
                          <div key={idx} className="bg-zinc-50 py-2.5 px-3.5 border border-zinc-200 flex items-center justify-between gap-3 text-[11px] hover:border-zinc-350 transition shadow-2xs">
                            <span className="text-zinc-800 font-bold uppercase">{val}</span>
                            <button
                              onClick={() => applyVariation('title', val)}
                              className="bg-zinc-900 border border-zinc-750 text-[9px] font-mono px-2 py-1 uppercase text-white hover:bg-zinc-800"
                            >
                              Aplicar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-xs font-mono">Haz clic en regenerar para cargar datos de variaciones creativas.</div>
                )}
              </div>
            )}

            {activeTab === 'multimedia' && (
              <div className="space-y-5">
                
                {/* Media viewer */}
                <div className="bg-zinc-50 p-4 border border-zinc-200 flex flex-col gap-3">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">RECURSO MULTIMEDIA ASOCIADO</span>
                  
                  {imageUrl ? (
                    <div className="aspect-video bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
                      <img src={imageUrl} alt="Contenido del post" className="w-full h-full object-cover" />
                    </div>
                  ) : videoUrl ? (
                    <div className="aspect-video bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-8 bg-zinc-50 border border-dashed border-zinc-200 text-center text-[10px] font-mono text-zinc-500 uppercase">
                      No posee imágenes ni videos subidos. Utiliza el generador de prompts IA sugerido:
                    </div>
                  )}

                  {/* Image Generation block with fallback engine selection */}
                  <div className="bg-zinc-100 p-4 border border-zinc-200 text-xs mt-2 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Rocket className="w-4 h-4 text-zinc-700" />
                        <span className="text-[9.5px] font-mono font-bold text-zinc-800 block uppercase tracking-wider">CREACIÓN DE IMAGEN CON IA</span>
                      </div>
                      {/* Engine selection */}
                      <select
                        value={imageEngine}
                        onChange={(e) => setImageEngine(e.target.value as any)}
                        className="bg-white border border-zinc-300 text-[9.5px] font-mono font-bold text-zinc-750 py-1 px-2 focus:outline-none focus:border-zinc-500 rounded-none uppercase"
                      >
                        <option value="free">Motor Libre (Sin Cuotas)</option>
                        <option value="gemini">marketcore 2.5 (Requiere Pro Key)</option>
                      </select>
                    </div>

                    <p className="text-[10px] text-zinc-500 font-light leading-normal">
                      {imageEngine === 'gemini' ? (
                        <span className="text-amber-800 font-medium">
                          ⚠️ Las claves de API marketcore gratuitas limitan la creación de imágenes a 0. Si falla por cuota, el sistema usará automáticamente el Motor Libre de respaldo para que nunca te quedes sin tu imagen.
                        </span>
                      ) : (
                        "Edita el prompt de abajo (en inglés da mejores resultados) y presiona generar. El motor libre creará una imagen única de alta calidad sin ningún límite de API."
                      )}
                    </p>

                    <textarea
                      value={imageUrlPrompt}
                      onChange={(e) => setImageUrlPrompt(e.target.value)}
                      placeholder="ej: An organic sourdough bread slice on a rustic wooden table with morning light, high detail photorealistic..."
                      rows={3}
                      className="w-full bg-white border border-zinc-250 py-2 px-3 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none resize-none font-sans"
                    />
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImage || !imageUrlPrompt.trim()}
                        className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-mono text-[10px] font-bold py-2.5 px-4 border border-zinc-750 cursor-pointer flex items-center gap-1.5 uppercase transition"
                      >
                        <Rocket className={`w-3.5 h-3.5 ${generatingImage ? 'animate-pulse' : ''}`} />
                        {generatingImage ? 'Generando...' : `Generar con ${imageEngine === 'gemini' ? 'Gemini 2.5' : 'Motor Libre'}`}
                      </button>
                    </div>

                    {generatingImage && (
                      <div className="flex items-center gap-2.5 bg-zinc-50 p-2.5 border border-zinc-200 text-[10px] font-mono mt-2">
                        <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                        <span className="uppercase text-[9px] text-zinc-500 tracking-wider font-bold">{imageGenerationLog}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subir reemplazo */}
                <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-none space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-800 block uppercase">Subir o Reemplazar con Archivo Real</span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans font-light">Carga una nueva foto o video. Al hacerlo, el sistema disparará la IA de marketcore Vision para analizar el contenido estético y reestructurará su copy, hashtags sugeridos e indicaciones.</p>
                  
                  <div className="pt-2 flex flex-col gap-2.5">
                    <label className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs py-3 px-4 rounded-none cursor-pointer text-center flex items-center justify-center gap-2 shadow-xs">
                      <Upload className="w-4 h-4" /> Seleccionar Nueva Foto o Video
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={handleUploadReplacement}
                        className="hidden" 
                      />
                    </label>

                    {replaceUploading && (
                      <div className="flex items-center gap-2.5 bg-zinc-100 p-3 mt-1 border border-zinc-200 text-xs font-mono">
                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                        <span className="uppercase text-[9px] text-zinc-500 tracking-wider font-bold">{uploadLog}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer controls */}
          <div className="px-6 py-4.5 border-t-2 border-zinc-200 flex justify-between items-center bg-zinc-50 flex-shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={handlePostDelete}
              className={`px-4 py-2.5 rounded-none font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border ${
                showDeleteConfirm 
                  ? 'text-white bg-red-600 border-red-705 shadow-sm animate-pulse' 
                  : 'text-rose-600 border-transparent hover:border-rose-200 hover:bg-rose-50/40'
              }`}
            >
              <Trash2 className="w-4 h-4" /> {showDeleteConfirm ? "⚠️ CONFIRMAR BORRADO" : "Eliminar Publicación"}
            </button>

            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="bg-white border border-zinc-250 hover:bg-zinc-100 py-2.5 px-4 rounded-none text-zinc-505 hover:text-zinc-905 uppercase tracking-widest cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-zinc-900 hover:bg-zinc-800 text-white border-r-4 border-b-4 border-zinc-500 active:translate-y-0.5 font-bold tracking-widest py-2.5 px-5 rounded-none uppercase cursor-pointer"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {showPublishConfirmation && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col justify-center p-6 z-50 animate-fade-in font-sans">
              <div className="border-4 border-emerald-500 bg-white p-6 max-h-[90%] overflow-y-auto space-y-5 text-zinc-900 shadow-2xl">
                <div className="flex items-center gap-3 border-b-2 border-emerald-200 pb-3">
                  <div className="bg-emerald-100 p-2 border border-emerald-400 rounded-none text-emerald-800">
                     <Rocket className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800">🚀 ¡Copiado con éxito!</h3>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-tight uppercase">SaaS MarkeCore Redes Integridad</p>
                  </div>
                </div>

                <div className="text-xs space-y-3 leading-relaxed font-light">
                  <p>
                    El copy de tu publicación, hashtags y llamados a la acción optimizados han sido copiados en el portapapeles de tu dispositivo.
                  </p>
                  <div className="bg-zinc-50 border border-zinc-200 p-3 font-mono text-[9.5px] max-h-24 overflow-y-auto rounded-none text-zinc-650 block">
                    {copy}
                  </div>
                  <p className="font-bold text-zinc-950">
                    Paso siguiente: Abre tu cuenta de {channel} y publica tu contenido en este momento perfecto para capturar el mayor alcance orgánico.
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200 space-y-3">
                  <span className="text-[9px] font-mono font-bold text-zinc-400 block uppercase tracking-wider text-center">CONFIRMACIÓN DE ESTADO</span>
                  
                  <div className="flex flex-col gap-2 font-mono">
                    <button
                      type="button"
                      onClick={confirmAsPublished}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-none text-xs tracking-widest uppercase cursor-pointer border-b-4 border-emerald-950 shadow-xs text-center"
                    >
                      ✓ ¡SÍ, YA ESTÁ PUBLICADO!
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPublishConfirmation(false)}
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-850 border border-zinc-350 py-2 px-4 rounded-none text-xs tracking-wider uppercase cursor-pointer text-center"
                    >
                      Aún no / Publicar después
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }
