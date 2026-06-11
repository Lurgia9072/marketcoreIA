import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Gemini features will fail.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API routes
  app.post("/api/generate-strategy", async (req, res) => {
    try {
      const { name, niche, description, targetAudience, socialHandles } = req.body;
      if (!name || !niche || !description) {
        return res.status(400).json({ error: "Faltan campos obligatorios: name, niche, description" });
      }

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "SaaS backend error: GEMINI_API_KEY is not configured in server secrets." });
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
      "channel": "Instagram", // o "TikTok" o "Facebook"
      "scheduledDate": "Día 1", // ej: "Día 1", "Día 4", "Día 8", "Día 12"
      "type": "Carrusel", // o "Reel", "Video", "Post unitario"
      "imageUrlPrompt": "Un prompt detallado de imagen en inglés para colocar en un generador de imágenes de IA que describa una escena estética que represente este post"
    }
  ]
}

Genera exactamente 6 posts bien distribuidos para un mes (por ejemplo, distribuidos en Día 1, Día 5, Día 10, Día 15, Día 20 y Día 25).
Asegúrate de que cada copy de post sea real, completo, listo para copiar y de calidad profesional Premium. No uses placeholders.`;

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
        throw new Error("No se pudo obtener una respuesta de la IA");
      }

      const parsedData = JSON.parse(responseText.trim());
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

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "SaaS backend error: GEMINI_API_KEY error." });
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
        throw new Error("Error generando copy.");
      }
      res.json(JSON.parse(responseText.trim()));
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
