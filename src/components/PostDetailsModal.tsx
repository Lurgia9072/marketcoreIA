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
  Image as ImageIcon, 
  Video as VideoIcon, 
  ChevronRight, 
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { CalendarPost } from '../types';

interface PostDetailsModalProps {
  userId: string;
  post: CalendarPost;
  onClose: () => void;
  onUpdate: (updatedPost: CalendarPost) => void;
  onDelete: (postId: string) => void;
}

export default function PostDetailsModal({ userId, post, onClose, onUpdate, onDelete }: PostDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'ai-variations' | 'multimedia'>('edit');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Handle direct single edits saving
  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      const hashtagsArray = hashtags
        .split(',')
        .map(h => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      const updatedObj: Partial<CalendarPost> = {
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
        videoUrl
      };

      const docRef = doc(db, `users/${userId}/calendar`, post.id);
      await updateDoc(docRef, updatedObj);

      onUpdate({
        ...post,
        ...updatedObj
      } as CalendarPost);
      
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
          title: title,
          currentCopy: copy
        })
      });

      if (!res.ok) {
        throw new Error("Socio IA no disponible. Comprueba tu conexión o clave de API.");
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
    if (field === 'title') setTitle(value);
    if (field === 'copy') setCopy(value);
    if (field === 'cta') setCta(value);
  };

  // Replace image/video in Firebase Storage and do AI Auto-Reanalysis + Copy adjustment
  const handleUploadReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setReplaceUploading(true);
    setUploadLog('Subiendo nuevo archivo a Storage...');
    setError(null);

    const file = e.target.files[0];
    const isVideo = file.type.startsWith('video/');

    try {
      const fileRef = ref(storage, `users/${userId}/material/replacement_${Date.now()}_${file.name}`);
      const snap = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snap.ref);

      if (isVideo) {
        setVideoUrl(downloadUrl);
        setImageUrl('');
        setType('Video');
      } else {
        setImageUrl(downloadUrl);
        setVideoUrl('');
        setType('Imagen');
      }

      setUploadLog('Analizando archivo con Gemini Vision...');
      
      // Analyze file with our endpoint
      const analysisRes = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: downloadUrl,
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
            topic: `Venta y promoción de producto: ${analysisData.productShown}. Recomendaciones estéticas a destacar: ${analysisData.recommendations?.slice(0, 2).join('; ')}`,
            channel,
            tone: 'persuasivo y emocional',
            businessInfo: { name: post.title }
          })
        });

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
      setError("Error al reemplazar el recurso. Valida acceso a Firebase.");
    } finally {
      setReplaceUploading(false);
    }
  };

  const handlePostDelete = async () => {
    if (!window.confirm("¿Estás absolutamente seguro de eliminar esta publicación del calendario?")) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/calendar`, post.id));
      onDelete(post.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Fallo al eliminar documento del calendario.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-950/80 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Main Drawer body */}
      <div className="w-full max-w-xl bg-zinc-900 border-l-2 border-zinc-100/15 h-full flex flex-col justify-between shadow-2xl relative z-10 font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-zinc-950 flex justify-between items-center bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-zinc-950 text-zinc-300 font-mono py-1 px-2 border border-zinc-800 uppercase block tracking-wider">
              {channel}
            </span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              EDITANDO PLANIFICACIÓN
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Navigation Tabs */}
        <div className="bg-zinc-950 px-6 py-2 border-b border-zinc-900 flex items-center gap-3 text-[11px] font-mono select-none flex-shrink-0">
          <button 
            type="button" 
            onClick={() => setActiveTab('edit')} 
            className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'edit' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Editar Campos
          </button>
          <button 
            type="button" 
            onClick={() => { setActiveTab('ai-variations'); if (!aiVariations) fetchAIVariations(); }} 
            className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'ai-variations' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Variantes IA ✨
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('multimedia')} 
            className={`pb-1 px-1 tracking-wider uppercase border-b-2 transition ${activeTab === 'multimedia' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Multimedia
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/20 border-b border-rose-900 px-6 py-3 text-zinc-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {/* Content body split by Tabs */}
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-900/35 space-y-5">
          
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Concepto o Título de la Publicación</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-none py-2.5 px-3.5 text-xs text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Copy Persuasivo de Publicación</label>
                <textarea
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  rows={8}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-none py-2 px-3.5 text-xs text-white focus:border-white focus:outline-none resize-none font-sans font-light leading-relaxed whitespace-pre-wrap"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">CTA Recomendado</label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-none py-2.5 px-3 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Hashtags (Separados por coma)</label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="ej: marketing, panaderia, ventas"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-none py-2.5 px-3 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                <div>
                  <label className="text-zinc-500 block mb-1 uppercase tracking-wider">Fecha Destino</label>
                  <input
                    type="text"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-2.5 text-[11px] text-white focus:border-white focus:outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1 uppercase tracking-wider">Hora Destino</label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2 px-2.5 text-[11px] text-white focus:border-white focus:outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1 uppercase tracking-wider">Estado Post</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-none py-2.5 px-1.5 text-[11px] text-white focus:border-white focus:outline-none font-sans font-bold uppercase"
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
              <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-850">
                <div className="text-xs">
                  <span className="font-mono font-bold block text-zinc-100">VARIACIONES EDITORIALES MULTI-TRAYECTORIA</span>
                  <p className="text-[10px] text-zinc-500 font-sans font-light leading-normal">Genera opciones de copies estructurados en AIDA, llamados creativos a la acción y títulos con 1-click aplicables.</p>
                </div>
                <button
                  onClick={fetchAIVariations}
                  disabled={loadingVariations}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[9px] font-bold p-2 border border-zinc-800 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loadingVariations ? 'animate-spin' : ''}`} /> REGENERAR
                </button>
              </div>

              {loadingVariations ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-8 h-8 border-2 border-zinc-100 border-t-transparent animate-spin"></div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Generando alternativas mediante motor Gemini...</span>
                </div>
              ) : aiVariations ? (
                <div className="space-y-5">
                  {/* Copies variants */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase tracking-wider">Copys Opcionales Alternativos</span>
                    {aiVariations.copies?.map((val, idx) => (
                      <div key={idx} className="bg-zinc-950 p-3.5 border border-zinc-900 flex flex-col gap-2 relative group hover:border-zinc-750 transition mt-2.5">
                        <p className="text-[11px] text-zinc-350 leading-relaxed font-light whitespace-pre-wrap">{val}</p>
                        <button
                          type="button"
                          onClick={() => { applyVariation('copy', val); alert('¡Copy alternativo aplicado!'); }}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-[9px] font-mono py-1 px-2.5 uppercase font-bold self-end hover:bg-white hover:text-zinc-900 transition mt-1.5"
                        >
                          Aplicar este copy
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* CTAs variants */}
                  <div className="space-y-2.5 pt-4 border-t border-zinc-950">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase tracking-wider">Llamados a la Acción de Reemplazo</span>
                    <div className="grid grid-cols-1 gap-2">
                      {aiVariations.ctas?.map((val, idx) => (
                        <div key={idx} className="bg-zinc-950 py-2.5 px-3.5 border border-zinc-900 flex items-center justify-between gap-3 text-[11px] hover:border-zinc-800 transition">
                          <span className="text-zinc-350 italic font-mono">"{val}"</span>
                          <button
                            onClick={() => { applyVariation('cta', val); alert('¡CTA aplicada!'); }}
                            className="bg-zinc-900 border border-zinc-800 text-[9px] font-mono px-2 py-1 uppercase text-zinc-400 hover:text-white"
                          >
                            Aplicar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Titles variants */}
                  <div className="space-y-2.5 pt-4 border-t border-zinc-950">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase tracking-wider">Conceptos y Títulos sugeridos</span>
                    <div className="grid grid-cols-1 gap-2">
                      {aiVariations.titles?.map((val, idx) => (
                        <div key={idx} className="bg-zinc-950 py-2.5 px-3.5 border border-zinc-900 flex items-center justify-between gap-3 text-[11px] hover:border-zinc-805 transition">
                          <span className="text-white font-bold uppercase">{val}</span>
                          <button
                            onClick={() => { applyVariation('title', val); alert('¡Título aplicado!'); }}
                            className="bg-zinc-900 border border-zinc-800 text-[9px] font-mono px-2 py-1 uppercase text-zinc-400 hover:text-white pointer-events-auto"
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
              <div className="bg-zinc-950 p-4 border border-zinc-900 flex flex-col gap-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">RECURSO MULTIMEDIA ASOCIADO</span>
                
                {imageUrl ? (
                  <div className="aspect-video bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                    <img src={imageUrl} alt="Contenido del post" className="w-full h-full object-cover" />
                  </div>
                ) : videoUrl ? (
                  <div className="aspect-video bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="py-8 bg-zinc-900/40 border border-dashed border-zinc-850 text-center text-[10px] font-mono text-zinc-650 uppercase">
                    No posee imágenes ni videos subidos. Utiliza el generador de prompts IA sugerido:
                  </div>
                )}

                {imageUrlPrompt && (
                  <div className="bg-zinc-900/60 p-3 border border-zinc-850 text-[10px] font-mono">
                    <span className="text-zinc-500 font-bold block mb-1">PROMPT DE IMAGEN SUGERIDO (IA GENERATOR)</span>
                    <span className="text-zinc-400 italic block">{imageUrlPrompt}</span>
                  </div>
                )}
              </div>

              {/* Subir reemplazo */}
              <div className="bg-zinc-950 p-5 border border-zinc-855 rounded-none space-y-3">
                <span className="text-[10px] font-mono font-bold text-zinc-200 block uppercase">Subir o Reemplazar con Archivo Real</span>
                <p className="text-[11px] text-zinc-450 leading-relaxed font-sans font-light">Carga una nueva foto o video. Al hacerlo, el sistema disparará la IA de Gemini Vision para analizar el contenido estético y reestructurará su copy, hashtags sugeridos e indicaciones.</p>
                
                <div className="pt-2 flex flex-col gap-2.5">
                  <label className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-mono text-xs py-3 px-4 rounded-none cursor-pointer text-center flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Seleccionar Nueva Foto o Video
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={handleUploadReplacement}
                      className="hidden" 
                    />
                  </label>

                  {replaceUploading && (
                    <div className="flex items-center gap-2.5 bg-zinc-900 p-3 mt-1 border border-zinc-850 text-xs font-mono">
                      <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent animate-spin"></div>
                      <span className="uppercase text-[9px] text-zinc-400 tracking-wider font-bold">{uploadLog}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="px-6 py-4.5 border-t-2 border-zinc-950 flex justify-between items-center bg-zinc-900 flex-shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={handlePostDelete}
            className="text-rose-500 border border-transparent hover:border-zinc-800 hover:bg-zinc-950/20 px-4 py-2.5 rounded-none font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Eliminar Publicación
          </button>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 py-2.5 px-4 rounded-none text-zinc-400 uppercase tracking-widest cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-zinc-100 hover:bg-white text-zinc-950 border-r-4 border-b-4 border-zinc-400 active:translate-y-0.5 font-bold tracking-widest py-2.5 px-5 rounded-none uppercase cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
