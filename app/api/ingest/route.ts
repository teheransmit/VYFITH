import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Inicialización del cliente Gemini. 
// Requiere la variable de entorno GEMINI_API_KEY.
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Cargar las System Instructions diseñadas para el rol
    const instructionsPath = path.join(process.cwd(), 'SystemInstructions.txt');
    const systemInstruction = fs.readFileSync(instructionsPath, 'utf8');

    // 2. Definir el esquema de salida estructurada (Structured Output Schema)
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
          description: "Observaciones analíticas que cruzan múltiples dominios."
        },
        actionable_recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Recomendaciones precisas y ejecutables para optimizar el bienestar integral."
        }
      },
      required: ["daily_summary", "overtraining_alerts", "multivariable_insights", "actionable_recommendations"]
    };

    // 3. Llamada al modelo utilizando Gemini 2.5 Pro
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
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
      }
    });

    if (response.text) {
      // Parsear y retornar el JSON estructurado
      const insights = JSON.parse(response.text);
      return NextResponse.json(insights, { status: 200 });
    }
    
    throw new Error("Gemini no devolvió texto en la respuesta.");
  } catch (error: any) {
    console.error("Error en el endpoint unificado:", error);
    return NextResponse.json({ error: "Fallo en procesamiento unificado", details: error.message }, { status: 500 });
  }
}

