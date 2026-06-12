import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

  app.use(express.json());

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

      try {
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
      } catch (error: any) {
        if (error.message && error.message.includes("Alibaba")) {
          throw error;
        }
        throw new Error(`Error de comunicación con Qwen: ${error.message || error}`);
      }
    }
  };

  // API routes
  app.post("/api/generate-strategy", async (req, res) => {
    try {
      const { name, niche, description, targetAudience, socialHandles } = req.body;
      if (!name || !niche || !description) {
        return res.status(400).json({ error: "Faltan campos obligatorios: name, niche, description" });
      }

      const prompt = `Actúa como un Analista de Marketing Digital de primer nivel mundial adaptado para emprendedores hispanos.
Genera una estrategia completa de marketing para redes sociales con un calendario mensual de contenidos preciso para el siguiente negocio:

Nombre del negocio: "${name}"
Nicho/Sector: "${niche}"
Descripción del negocio: "${description}"
Audiencia Objetivo: "${targetAudience || 'Emprendedores, público general interesado en el sector'}"
Redes sociales del negocio: ${JSON.stringify(socialHandles || {})}

Devuelve un JSON estrictamente estructurado en español con el siguiente esquema exacto de TypeScript:
{
  "title": "Estrategia de posicionamiento de marca",
  "summary": "Resumen estratégico detallado (3-4 párrafos explicativos con consejos accionables de marketing digital para este nicho)",
  "posts": [
    {
      "title": "Título llamativo del post",
      "copy": "El copy completo persuasivo, optimizado en español, con emojis y hashtags adecuados para vender más",
      "channel": "Instagram",
      "scheduledDate": "Día 1",
      "type": "Carrusel",
      "imageUrlPrompt": "Un prompt detallado de imagen en inglés para colocar en un generador de imágenes de IA que describa una escena estética que represente este post"
    }
  ]
}

Genera exactamente 6 posts bien distribuidos para un mes (por ejemplo, distribuidos en Día 1, Día 5, Día 10, Día 15, Día 20 y Día 25).
Asegúrate de que cada copy de post sea real, completo, listo para copiar y de calidad profesional Premium. No uses placeholders.`;

      const responseText = await callAI(prompt);
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error generating strategy:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
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
