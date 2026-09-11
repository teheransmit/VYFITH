import { GoogleGenAI, Type, Schema } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

/**
 * MEGA PROYECTO - INGESTOR BACKEND
 * Servicio diseñado para recibir los 4 pilares de datos y procesarlos a través de Gemini
 * utilizando "Structured Outputs" para garantizar un formato JSON consumible.
 */

// Inicialización del cliente Gemini. 
// Requiere la variable de entorno GEMINI_API_KEY.
const ai = new GoogleGenAI({});

export async function processUnifiedData(payload: any) {
  try {
    // 1. Cargar las System Instructions diseñadas para el rol
    const instructionsPath = path.join(process.cwd(), 'SystemInstructions.txt');
    const systemInstruction = fs.readFileSync(instructionsPath, 'utf8');

    // 2. Definir el esquema de salida estructurada (Structured Output Schema)
    // Esto asegura que la respuesta del modelo cumpla estrictamente con la estructura esperada por las apps clientes.
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        daily_summary: {
          type: Type.STRING,
          description: "Resumen textual de la situación general del usuario integrando los 4 pilares."
        },
        overtraining_alerts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de alertas si la correlación entre carga física, HRV y sueño indica sobreentrenamiento."
        },
        multivariable_insights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Observaciones analíticas que cruzan múltiples dominios (ej. finanzas vs sueño, agenda vs entrenamientos)."
        },
        actionable_recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Recomendaciones precisas y ejecutables para optimizar el bienestar integral."
        }
      },
      required: ["daily_summary", "overtraining_alerts", "multivariable_insights", "actionable_recommendations"]
    };

    // 3. Llamada al modelo utilizando Gemini 2.5 Pro (recomendado para análisis complejo de datos)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(payload, null, 2) }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        // Forzamos el MIME type a JSON
        responseMimeType: "application/json",
        // Aplicamos el esquema
        responseSchema: responseSchema,
        // Temperatura baja para mayor consistencia y rigor analítico
        temperature: 0.1, 
      }
    });

    if (response.text) {
      // Parsear y retornar el JSON estructurado
      return JSON.parse(response.text);
    }
    
    throw new Error("Gemini no devolvió texto en la respuesta.");
  } catch (error) {
    console.error("Error en processUnifiedData:", error);
    throw error;
  }
}

/* 
 * EJEMPLO DE USO EN API (Express / Cloud Functions):
 * 
 * export const ingestorWebhook = async (req, res) => {
 *   try {
 *     // req.body debe cumplir con schema.json
 *     const insights = await processUnifiedData(req.body);
 *     res.status(200).json(insights);
 *   } catch (err) {
 *     res.status(500).json({ error: "Fallo en procesamiento unificado" });
 *   }
 * };
 */
