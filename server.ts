import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Save the system-provided environment variables before dotenv might overwrite them
const systemGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
const systemDashscopeKey = (process.env.DASHSCOPE_API_KEY || "").trim();

dotenv.config({ override: true });

// If the system injected a real Google Gemini key, restore it to override any dummy .env values
if (systemGeminiKey.startsWith("AIzaSy") || systemGeminiKey.startsWith("AQ.")) {
  process.env.GEMINI_API_KEY = systemGeminiKey;
}
if (systemDashscopeKey && !process.env.DASHSCOPE_API_KEY) {
  process.env.DASHSCOPE_API_KEY = systemDashscopeKey;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static uploaded files
  app.use("/api/uploads", express.static(uploadsDir));

  // Dynamic AI Provider Helper function supporting both Google Gemini and Alibaba Cloud Model Studio (Qwen)
  const getProviderAndKey = (): { provider: "gemini" | "qwen"; apiKey: string } => {
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const dashscopeKey = (process.env.DASHSCOPE_API_KEY || "").trim();

    // 1. If it looks like a real Google Gemini key (typically starting with AIzaSy or AQ.)
    if (geminiKey.startsWith("AIzaSy") || geminiKey.startsWith("AQ.")) {
      return { provider: "gemini", apiKey: geminiKey };
    }

    // 2. If DASHSCOPE_API_KEY is configured with a valid-looking key that is different from geminiKey
    if (dashscopeKey && dashscopeKey.length > 0 && dashscopeKey !== geminiKey) {
      return { provider: "qwen", apiKey: dashscopeKey };
    }

    // 3. If GEMINI_API_KEY is configured but does not look like a Google Gemini key (e.g. starts with Qwen style keys and not "AIzaSy" / "AQ.")
    if (geminiKey && geminiKey.length > 0 && !geminiKey.startsWith("AIzaSy") && !geminiKey.startsWith("AQ.")) {
      // If it looks like the user's project ID/OAuth client ID instead of a key
      if (geminiKey.startsWith("gen-lang-client-") || geminiKey.includes(".apps.googleusercontent.com")) {
        return { provider: "gemini", apiKey: geminiKey }; // Let it fall through so we can give a clear validation error
      }
      return { provider: "qwen", apiKey: geminiKey };
    }

    return { provider: "gemini", apiKey: geminiKey || "" };
  };

  const callAI = async (prompt: string): Promise<string> => {
    const { provider, apiKey } = getProviderAndKey();

    try {
      if (provider === "gemini") {
        if (!apiKey) {
          throw new Error("SaaS backend error: GEMINI_API_KEY is not configured in server secrets.");
        }
        
        // Perform validation check on key format to help user debug
        if (apiKey.startsWith("gen-lang-client-")) {
          throw new Error(`Clave de API inválida: Has configurado el Project ID ("${apiKey}") en lugar de una Clave de API de Gemini válida. Las claves de API de Google Gemini válidas deben comenzar con "AIzaSy". Obtén una Clave de API real en Google AI Studio.`);
        }
        
        if (!apiKey.startsWith("AIzaSy") && !apiKey.startsWith("AQ.")) {
          throw new Error(`La clave de API provista ("${apiKey.substring(0, 8)}...") no es válida para Google Gemini. Las claves válidas de Gemini deben comenzar estrictamente con el prefijo "AIzaSy" o "AQ.". Por favor verifica tu pestaña de Secrets o archivo .env.`);
        }

        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error("No se pudo obtener una respuesta de Gemini");
        }
        return responseText.trim();
      } else {
        // Qwen / Dashscope (Alibaba Cloud Model Studio)
        if (!apiKey) {
          throw new Error("SaaS backend error: DASHSCOPE_API_KEY or Qwen key is not configured.");
        }

        const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 401) {
            throw new Error(`Error de Autenticación de Alibaba Qwen (401): La clave API provista ("${apiKey.substring(0, 8)}...") no es correcta o está inactiva.`);
          }
          throw new Error(`Alibaba Cloud Qwen API Error (${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) {
          throw new Error("No se pudo obtener una respuesta de Qwen");
        }
        return responseText.trim();
      }
    } catch (primaryError: any) {
      console.warn("=== FALLBACK ACTIVADO: El Socio IA principal falló ===");
      console.warn("Razón:", primaryError.message || primaryError);
      console.warn("Iniciando generación con Motor de Texto Libre (Pollinations AI)...");

      try {
        const fallbackResponse = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "Eres un analista de marketing experto. Generas respuestas en español. Importante: si el usuario o la instrucción solicita un formato JSON estructurado, devuelve únicamente el JSON válido, sin delimitadores ```json, sin explicaciones, sin texto adicional."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            jsonMode: true
          })
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Error en el motor de texto libre (HTTP ${fallbackResponse.status})`);
        }

        let fallbackText = await fallbackResponse.text();
        fallbackText = fallbackText.trim();

        // Robust cleansing of markdown wrappers if the free model added them
        if (fallbackText.startsWith("```json")) {
          fallbackText = fallbackText.split("```json")[1];
        } else if (fallbackText.startsWith("```")) {
          fallbackText = fallbackText.split("```")[1];
        }
        if (fallbackText.endsWith("```")) {
          fallbackText = fallbackText.substring(0, fallbackText.lastIndexOf("```"));
        }
        fallbackText = fallbackText.trim();

        console.info("=== FALLBACK EXITOSO: El Motor de Texto Libre respondió de forma correcta ===");
        return fallbackText;
      } catch (fallbackError: any) {
        console.error("=== CONTROL DE CRASH: Ambos motores de IA fallaron ===");
        console.error("Error original:", primaryError);
        console.error("Error fallback:", fallbackError);
        throw new Error(`Servicios de IA no disponibles. Error original: ${primaryError.message || "Quota/Conexión"}`);
      }
    }
  };

  // API routes
  app.post("/api/generate-complete-strategy", async (req, res) => {
    try {
      const { 
        name, 
        niche, 
        description, 
        targetAudience, 
        socialHandles,
        objectivesSelected,
        socialNetworksSelected,
        materialType,
        uploadedAnalysisSummary
      } = req.body;

      if (!name || !niche || !description) {
        return res.status(400).json({ error: "Faltan campos obligatorios: name, niche, description" });
      }

      const prompt = `Actúa como un Consultor de Marketing Digital de Elite y Director Creativo para marcas de emprendedores en Latinoamérica.
Quiero que generes un plan de marketing estratégico completo y un calendario editorial para un mes completo (4 semanas de contenidos) para el siguiente negocio, basado estrictamente en sus objetivos, redes sociales elegidas y recursos de video/foto disponibles.

INFORMACIÓN DEL NEGOCIO:
- Nombre: "${name}"
- Nicho/Sector: "${niche}"
- Descripción: "${description}"
- Audiencia Objetivo: "${targetAudience || 'Público general e interesados en el nicho'}"
- Identidad en Redes: ${JSON.stringify(socialHandles || {})}

PASO 1 - OBJETIVOS SELECCIONADOS POR EL CLIENTE PARA ESTE MES:
${(objectivesSelected || []).map((o: string) => `- ${o}`).join("\n")}

PASO 2 - REDES SOCIALES SELECCIONADAS PARA PUBLICAR:
${(socialNetworksSelected || []).map((n: string) => `- ${n}`).join("\n")}

PASO 3 Y 4 - MATERIAL Y ANÁLISIS PREVIO DE ARCHIVOS DISPONIBLES:
- Tipo de material con el que cuenta: ${materialType || 'Ninguno'}
- Análisis/Recomendaciones previas extraídas de sus fotos/videos:
${uploadedAnalysisSummary || 'Sin materiales cargados. Diseñar propuestas basadas en imágenes ilustrativas/promocionales sugeridas o grabaciones guiadas.'}

Instrucciones de Redacción y Formulación Estratégica:
1. El canal de todos los posts generados DEBE coincidir ESTRICTAMENTE con alguno de las redes seleccionadas (${(socialNetworksSelected || []).join(", ") || "Instagram"}).
2. Genera exactamente 8 publicaciones distribuidas de forma balanceada a lo largo de las 4 semanas (es decir, 2 posts por semana).
3. Asegúrate de que los tipos de publicaciones correspondan y aprovechen el material disponible. Si tienen videos, propón Reels/TikToks dinámicos. Si tienen fotos, propón carruseles o fotos estéticas del producto. Si no tienen material, propón diseños gráficos o infografías que puedan crear fácilmente.
4. Los copies deben de ser Premium: Completos, listos para usar, persuasivos, en español latinoamericano, usando emojis, disparadores mentales y ganchos impactantes.

Devuelve de manera EXCLUSIVA un objeto JSON estructurado con el siguiente formato exacto:
{
  "title": "Estrategia integral de marketing - [Mes Actual]",
  "summary": "Un resumen ejecutivo detallado y persuasivo de 3-4 párrafos estructurado con metas claras para el posicionamiento de marca.",
  "diagnostic": "Un análisis profundo del estado actual del negocio según su descripción, indicando debilidades detectadas en su comunicación y cómo corregirlas con esta estrategia.",
  "mainGoal": "Objetivo principal SMART formulado específicamente para este mes basado en los objetivos seleccionados.",
  "secondaryGoals": [
    "Objetivo secundario 1",
    "Objetivo secundario 2"
  ],
  "suggestedKPIs": [
    "KPI 1 (ej: +20% mensajes de WhatsApp)",
    "KPI 2 (ej: Aumento del 15% de alcance orgánico)"
  ],
  "targetAudience": "Descripción muy específica del perfil de usuario y dolores o necesidades que el negocio resuelve.",
  "recommendedTone": "Tono de voz de la marca recomendado para este mes (ej: Amistoso pero profesional, artesanal y cálido, directo y persuasivo). Explicar por qué.",
  "recommendedContentType": "Tipo de formatos y contenidos específicos a privilegiar (ej: Reels educativos, historias diarias de detrás de escena, memes de dolor).",
  "recommendedFrequency": "Frecuencia de publicación por red social y mejores horarios sugeridos.",
  "socialDistribution": "Distribución estratégica sugerida entre las redes elegidas (ej: TikTok 60% para captación, Instagram 40% para fidelización y venta).",
  
  "weeklyPlan": [
    {
      "week": "Semana 1",
      "objective": "Objetivo específico de la Semana 1",
      "contentType": "Formatos sugeridos principales",
      "socialNetwork": "Red social recomendada",
      "cta": "Llamado a la acción dominante para la semana",
      "expectedKPI": "KPI de medición de la semana"
    },
    {
      "week": "Semana 2",
      "objective": "Objetivo específico de la Semana 2",
      "contentType": "Formatos sugeridos principales",
      "socialNetwork": "Red social recomendada",
      "cta": "Llamado a la acción dominante",
      "expectedKPI": "KPI de medición"
    },
    {
      "week": "Semana 3",
      "objective": "Objetivo específico de la Semana 3",
      "contentType": "Formatos sugeridos",
      "socialNetwork": "Red social recomendada",
      "cta": "Llamado a la acción",
      "expectedKPI": "KPI"
    },
    {
      "week": "Semana 4",
      "objective": "Objetivo específico de la Semana 4",
      "contentType": "Formatos sugeridos",
      "socialNetwork": "Red social recomendada",
      "cta": "Llamado a la acción",
      "expectedKPI": "KPI"
    }
  ],
  
  "posts": [
    {
      "title": "Nombre o concepto de la publicación (ej: Detrás de escena de tu pan)",
      "copy": "Copy persuasivo completo listo para publicar, con gancho inicial irresistible, cuerpo del texto estructurado con beneficios, y llamada a la acción (CTA) clara.",
      "cta": "Llamado a la acción principal del post (ej: Escribe un mensaje por WhatsApp para reservar)",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "channel": "Instagram", 
      "scheduledDate": "Lunes de la Semana 1",
      "scheduledTime": "18:30",
      "type": "Reel",
      "imageUrlPrompt": "A highly detailed aesthetic instruction for AI Image generator to represent the visual aspect of this post (in English)",
      "weekNum": 1,
      "priority": "Media",
      "objective": "Educación de audiencia o Venta Directa"
    }
  ]
}`;

      const responseText = await callAI(prompt);
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error generating strategy:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });

  // PASO 4: IA Analysis for uploaded material files
  app.post("/api/analyze-file", async (req, res) => {
    try {
      const { url, type, name } = req.body;
      if (!url || !type) {
        return res.status(400).json({ error: "Faltan parámetros 'url' y 'type' para análisis" });
      }

      const isImage = type.includes("image");
      let base64Image = "";

      // Try fetching the image to pass it as binary context to Gemini if possible
      if (isImage) {
        try {
          const fetchRes = await fetch(url);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            base64Image = Buffer.from(arrayBuffer).toString("base64");
          }
        } catch (fetchErr) {
          console.warn("Could not fetch binary image for direct Gemini reading. Falling back to URL analysis.", fetchErr);
        }
      }

      const { provider, apiKey } = getProviderAndKey();

      if (provider === "gemini" && apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        
        let promptTask = "";
        let contentsData: any[] = [];

        if (isImage) {
          promptTask = `Estás analizando una imagen provista por un emprendedor en su repositorio de material para redes sociales.
Nombre del archivo: "${name || 'imagen_producto.jpg'}"

Analiza la imagen de manera experta. Identifica:
1. El producto mostrado (qué es, qué denota)
2. Calidad visual de la fotografía (composición, enfoque)
3. Fondo o escenario donde fue tomada
4. Iluminación (natural, artificial, sombras)
5. Branding o identidad (si se nota logo, colores marcarios)
6. Potencial de ventas o comercial (cómo puede usarse en un post de ventas)

Devuelve un JSON estrictamente estructurado en español con el formato:
{
  "productShown": "...",
  "quality": "...",
  "background": "...",
  "lighting": "...",
  "branding": "...",
  "potential": "...",
  "recommendations": [
    "Recomendación 1 para mejorar la toma o diseño",
    "Recomendación 2 para usarla comercialmente"
  ]
}`;

          if (base64Image) {
            contentsData = [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              },
              promptTask
            ];
          } else {
            promptTask += `\n\nAnaliza la imagen disponible en esta URL pública: ${url}`;
            contentsData = [promptTask];
          }
        } else {
          // Video analysis fallback using metadata
          promptTask = `Estás auditando un video provisto por un emprendedor para sus redes sociales.
Nombre del archivo de video: "${name || 'video_editorial.mp4'}"
URL del recurso: ${url}

No posees el stream visual directo, genera un reporte de optimización de video enfocado en un video promocional de redes sociales.
Identifica hipotéticamente según el nombre del archivo y las mejores prácticas de reels/videos:
1. Duración recomendada de visualización
2. Calidad sugerida para exportación
3. Estrategia de gancho inicial (los primeros 3 segundos)
4. Mensaje clave del cuerpo
5. CTA recomendado que debe enunciarse o aparecer escrito
6. Potencial de engagement o interacción de la temática

Devuelve un JSON estrictamente estructurado en español con el formato:
{
  "productShown": "Video/Clip para redes sociales",
  "quality": "Sugerido: Formato vertical 1080x1920 a 60fps con alta tasa de bits",
  "background": "Ambientación fluida u hogareña/comercial despejada",
  "lighting": "Iluminación facial clara o enfoque directo sin contra-luz fuerte",
  "branding": "Uso de subtítulos dinámicos de colores marcarios e intro con hook",
  "potential": "Excelente para formato de micro-contenido educativo o venta directa que incremente la retención",
  "recommendations": [
    "Corta los primeros 3 segundos para que el hook sea inmediato",
    "Agrega subtítulos auto-generados para visualización silenciosa en feed",
    "Aplica efectos de sonido sutiles en las transiciones principales"
  ]
}`;
          contentsData = [promptTask];
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contentsData,
          config: {
            responseMimeType: "application/json",
            temperature: 0.4
          }
        });

        const text = response.text;
        return res.json(JSON.parse(text || "{}"));
      } else {
        // Fallback for Qwen or offline
        const mockAnalysis = {
          productShown: "Recurso comercial para redes sociales",
          quality: "Buena composición general y colores idóneos",
          background: "Limpio y enfocado",
          lighting: "Óptima iluminación frontal para realzar el producto",
          branding: "Excelente representación de la identidad comercial",
          potential: "Altamente comercial, ideal para publicaciones promocionales directas",
          recommendations: [
            "Aprovecha esta toma para crear carruseles estéticos de tus productos.",
            "Utiliza contrastes de color fuertes en el texto superpuesto para optimizar el alcance visual."
          ]
        };
        return res.json(mockAnalysis);
      }
    } catch (error: any) {
      console.error("Error analyzing file:", error);
      res.status(500).json({ error: error.message || "Error al analizar recurso con IA" });
    }
  });

  // Post items elements regenerator & Variations helper (step 7)
  app.post("/api/generate-post-variants", async (req, res) => {
    try {
      const { title, currentCopy } = req.body;
      if (!title || !currentCopy) {
        return res.status(400).json({ error: "Faltan campos title y currentCopy" });
      }

      const prompt = `Tienes la siguiente propuesta de publicación en revisión:
Título: "${title}"
Copy Actual: "${currentCopy}"

Genera y ofrece variaciones inteligentes para que el usuario pueda elegir y optimizar.
Debes crear exactamente:
1. Tres alternativas diferentes de Copies (con enfoques: AIDA persuasivo, Educativo de valor, Directo y corto).
2. Tres alternativas de llamados a la acción (CTAs) disruptivos.
3. Tres títulos opcionales alternativos y llamativos.

Devuelve de manera exclusiva un JSON estructurado con el formato:
{
  "copies": [
    "Copy alternativo 1 que use el método AIDA...",
    "Copy alternativo 2 con enfoque educativo...",
    "Copy alternativo 3 enfocado en escasez y venta rápida..."
  ],
  "ctas": [
    "CTA alternativo 1",
    "CTA alternativo 2",
    "CTA alternativo 3"
  ],
  "titles": [
    "Título llamativo 1",
    "Título llamativo 2",
    "Título llamativo 3"
  ]
}`;

      const responseText = await callAI(prompt);
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Error generating post variants:", error);
      res.status(500).json({ error: error.message || "Error al generar alternativas" });
    }
  });

  // Supporting endpoint: copywriting generator
  app.post("/api/generate-copywriter", async (req, res) => {
    try {
      const { topic, channel, tone, businessInfo } = req.body;
      if (!topic || !channel) {
        return res.status(400).json({ error: "Faltan campos obligatorios: topic, channel" });
      }

      const prompt = `Genera un post persuasivo y profesional en español para ${channel} con un tono ${tone || "profesional y de confianza"}.
El tema de la publicación es: "${topic}"
El negocio se describe como: "${JSON.stringify(businessInfo || {})}"

Devuelve un JSON con la estructura:
{
  "title": "Título sugerido para el post",
  "copy": "Texto completo y persuasivo optimizado con emojis y hashtags estratégicos",
  "imagePrompt": "Un prompt en inglés altamente descriptivo para generador de imágenes IA para ilustrar este post"
}`;

      const responseText = await callAI(prompt);
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Error in copywriter api:", error);
      res.status(500).json({ error: error.message || "Error interno" });
    }
  });

  // New endpoint to generate image with Gemini and automatic free fallback (Pollinations AI)
  app.post("/api/generate-image", async (req, res) => {
    const { prompt, aspectRatio, engine } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Falta el campo prompt para la generación de imagen" });
    }

    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    };

    try {
      // If client requests "free" engine explicitly
      if (engine === "free") {
        console.log("Generador: Usando Motor Libre (Pollinations AI) de forma explícita...");
        const seed = Math.floor(Math.random() * 10000000);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        const imgRes = await fetch(pollUrl, { headers: browserHeaders });
        if (!imgRes.ok) {
          const textErr = await imgRes.text().catch(() => "");
          throw new Error(`El motor libre alternativo falló con estado ${imgRes.status}: ${textErr.substring(0, 100)}`);
        }
        
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        return res.json({ base64Image, source: "pollinations" });
      }

      const { provider, apiKey } = getProviderAndKey();

      if (provider === "gemini" && apiKey) {
        // Validation check on key format (same as in other routes)
        if (apiKey.startsWith("gen-lang-client-")) {
          throw new Error(`Clave de API inválida: Has configurado el Project ID ("${apiKey}") en lugar de una Clave de API de Gemini válida. Las claves de API de Google Gemini válidas deben comenzar con "AIzaSy". Obtén una Clave de API real en Google AI Studio.`);
        }
        
        if (!apiKey.startsWith("AIzaSy") && !apiKey.startsWith("AQ.")) {
          throw new Error(`La clave de API provista ("${apiKey.substring(0, 8)}...") no es válida para Google Gemini. Las claves válidas de Gemini deben comenzar estrictamente con el prefijo "AIzaSy" o "AQ.". Por favor verifica tu pestaña de Secrets o archivo .env.`);
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: prompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || "1:1",
            },
          },
        });

        let base64Image = "";
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }

        if (!base64Image) {
          throw new Error("El modelo de Gemini no retornó ninguna imagen en su respuesta.");
        }

        return res.json({ base64Image, source: "gemini" });
      } else {
        // Fallback or Qwen: auto generate for free using Pollinations
        console.log("Generador: No se encontró clave válida de Gemini. Usando Motor Libre (Pollinations AI) como fallback...");
        const seed = Math.floor(Math.random() * 10000000);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        const imgRes = await fetch(pollUrl, { headers: browserHeaders });
        if (!imgRes.ok) {
          const textErr = await imgRes.text().catch(() => "");
          throw new Error(`El motor libre alternativo falló con estado ${imgRes.status}: ${textErr.substring(0, 100)}`);
        }
        
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        return res.json({ base64Image, source: "pollinations" });
      }
    } catch (error: any) {
      console.error("Error in generate-image api:", error);
      
      // If we got any quota limit error or auth issue from Gemini, immediately attempt fallback in backend
      const errMsg = error?.message || "";
      if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Key") || errMsg.includes("Clave") || errMsg.includes("no es válida")) {
        try {
          console.log("Generador: Detectado error o límite en Gemini. Activando Motor Libre de respaldo en backend...");
          const seed = Math.floor(Math.random() * 10000000);
          const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`;
          
          const imgRes = await fetch(pollUrl, { headers: browserHeaders });
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            return res.json({ base64Image, source: "fallback-pollinations" });
          }
        } catch (fbError: any) {
          console.error("Generador: Falló también el motor de respaldo libre:", fbError);
        }
      }

      res.status(500).json({ error: error.message || "Error al generar la imagen" });
    }
  });

  // API Route to handle image/video file uploads as base64 securely
  app.post("/api/upload", (req, res) => {
    try {
      const { base64, filename, mimeType } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "Falta el contenido base64 del archivo" });
      }

      let base64Data = base64;
      if (base64.includes(";base64,")) {
        base64Data = base64.split(";base64,")[1];
      }

      const buffer = Buffer.from(base64Data, "base64");
      const cleanFilename = (filename || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${cleanFilename}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/api/uploads/${uniqueFilename}`;
      return res.json({ url: fileUrl });
    } catch (err: any) {
      console.error("Error saving upload server-side:", err);
      return res.status(500).json({ error: err.message || "Error al decodificar y guardar el archivo." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
