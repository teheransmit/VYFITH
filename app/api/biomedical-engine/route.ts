import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import {
  BiomedicalInputPayload,
  BiomedicalPrescriptionOutput,
  computeDeterministicBiomedicalAnalysis,
  DEFAULT_SANTIAGO_BIOMEDICAL_INPUT,
} from '@/lib/biomedicalEngine';
import { corsHeaders } from '@/lib/healthIngestHandler';

declare global {
  var __LATEST_BIOMEDICAL_PRESCRIPTION:
    | {
        prescription: BiomedicalPrescriptionOutput;
        input: BiomedicalInputPayload;
        updatedAt: string;
        engineSource: 'gemini-3.8-flash + Mathematical Matrix' | 'Deterministic Mathematical Matrix';
      }
    | undefined;
}

const BIOMEDICAL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    readinessScore: { type: Type.NUMBER },
    readinessCategory: { type: Type.STRING },
    biomedicalSummary: {
      type: Type.OBJECT,
      properties: {
        acwr: { type: Type.NUMBER },
        acwrStatus: { type: Type.STRING },
        rhrBaselineTrend: { type: Type.STRING },
        sleepQualityIndex: { type: Type.STRING },
        cnsRecoveryPercentage: { type: Type.NUMBER },
      },
      required: [
        'acwr',
        'acwrStatus',
        'rhrBaselineTrend',
        'sleepQualityIndex',
        'cnsRecoveryPercentage',
      ],
    },
    gymPrescription: {
      type: Type.OBJECT,
      properties: {
        intensityRecommendation: { type: Type.STRING },
        recommendedMuscleGroups: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        groupsToRest: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        tonnageTargetKg: { type: Type.NUMBER },
        physiologicalRationale: { type: Type.STRING },
      },
      required: [
        'intensityRecommendation',
        'recommendedMuscleGroups',
        'groupsToRest',
        'tonnageTargetKg',
        'physiologicalRationale',
      ],
    },
    academicCognitivePrescription: {
      type: Type.OBJECT,
      properties: {
        cognitiveBandwidth: { type: Type.STRING },
        recommendedFocusBlocks: { type: Type.STRING },
        stressMitigation: { type: Type.STRING },
      },
      required: ['cognitiveBandwidth', 'recommendedFocusBlocks', 'stressMitigation'],
    },
    temporalInsights: {
      type: Type.OBJECT,
      properties: {
        sevenDaysInsight: { type: Type.STRING },
        thirtyDaysInsight: { type: Type.STRING },
        sixMonthsProjection: { type: Type.STRING },
      },
      required: ['sevenDaysInsight', 'thirtyDaysInsight', 'sixMonthsProjection'],
    },
  },
  required: [
    'readinessScore',
    'readinessCategory',
    'biomedicalSummary',
    'gymPrescription',
    'academicCognitivePrescription',
    'temporalInsights',
  ],
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawOnly = searchParams.get('format') === 'strict';

  if (!global.__LATEST_BIOMEDICAL_PRESCRIPTION) {
    const computed = computeDeterministicBiomedicalAnalysis(DEFAULT_SANTIAGO_BIOMEDICAL_INPUT);
    global.__LATEST_BIOMEDICAL_PRESCRIPTION = {
      prescription: computed.prescription,
      input: computed.normalizedInput,
      updatedAt: new Date().toISOString(),
      engineSource: 'Deterministic Mathematical Matrix',
    };
  }

  if (rawOnly) {
    return NextResponse.json(global.__LATEST_BIOMEDICAL_PRESCRIPTION.prescription, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const computedDiagnostics = computeDeterministicBiomedicalAnalysis(
    global.__LATEST_BIOMEDICAL_PRESCRIPTION.input
  ).diagnostics;

  return NextResponse.json(
    {
      ...global.__LATEST_BIOMEDICAL_PRESCRIPTION.prescription,
      _meta: {
        athlete: 'Santiago Smit Teherán Mogollón',
        affiliation: 'UPB Montería • 6.° Semestre Ingeniería Civil',
        wearable: 'Xiaomi Smart Band 9 Pro (Mi Fitness / Health Connect)',
        updatedAt: global.__LATEST_BIOMEDICAL_PRESCRIPTION.updatedAt,
        engineSource: global.__LATEST_BIOMEDICAL_PRESCRIPTION.engineSource,
        diagnostics: computedDiagnostics,
        inputSnapshot: global.__LATEST_BIOMEDICAL_PRESCRIPTION.input,
      },
    },
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const useGemini = body.useGemini !== false && Boolean(process.env.GEMINI_API_KEY);
    const { prescription: basePrescription, diagnostics, normalizedInput } =
      computeDeterministicBiomedicalAnalysis(body);

    let finalPrescription: BiomedicalPrescriptionOutput = basePrescription;
    let engineSource: 'gemini-3.8-flash + Mathematical Matrix' | 'Deterministic Mathematical Matrix' =
      'Deterministic Mathematical Matrix';

    if (useGemini && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const systemInstruction = `Eres el Motor de Inteligencia Biomédica, Fisiología del Ejercicio y Rendimiento Académico de VYFITH / MegaProyecto, diseñado para Santiago Smit Teherán Mogollón (Estudiante de 6.° Semestre de Ingeniería Civil en la UPB Montería, deportista de fuerza en Hevy / UPB Gym y desarrollador de software).
Reglas estrictas:
1. Rigor científico absoluto: Utiliza terminología de fisiología del ejercicio (ACWR, unidades motoras de alto umbral, resíntesis de fosfocreatina, tono vagal/parasimpático), neurobiología del descanso (fases N3 y REM, plasticidad hipocampal) y biomecánica sin rodeos ni explicaciones genéricas.
2. Personalización para Santiago: Relaciona directamente con sus asignaturas críticas de 6.° semestre en la UPB Montería (${normalizedInput.academicContext.criticalSubjects.join(', ')}), su Xiaomi Smart Band 9 Pro y sus entrenamientos en Hevy.
3. Respeta exactamente los valores numéricos precalculados por la matriz matemática:
   - readinessScore: ${basePrescription.readinessScore}
   - acwr: ${basePrescription.biomedicalSummary.acwr}
   - acwrStatus: "${basePrescription.biomedicalSummary.acwrStatus}"
   - rhrBaselineTrend: "${basePrescription.biomedicalSummary.rhrBaselineTrend}"
   - cnsRecoveryPercentage: ${basePrescription.biomedicalSummary.cnsRecoveryPercentage}
   - tonnageTargetKg: ${basePrescription.gymPrescription.tonnageTargetKg}
4. Sin texto de relleno ni disclaimers médicos redundantes. Devuelve exclusivamente el JSON estructurado.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: JSON.stringify({
            input: normalizedInput,
            precalculatedMathematics: diagnostics,
            baselineOutput: basePrescription,
          }),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: BIOMEDICAL_RESPONSE_SCHEMA,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as BiomedicalPrescriptionOutput;
          finalPrescription = {
            ...parsed,
            readinessScore: basePrescription.readinessScore,
            biomedicalSummary: {
              ...parsed.biomedicalSummary,
              acwr: basePrescription.biomedicalSummary.acwr,
              acwrStatus: basePrescription.biomedicalSummary.acwrStatus,
              rhrBaselineTrend: basePrescription.biomedicalSummary.rhrBaselineTrend,
              cnsRecoveryPercentage: basePrescription.biomedicalSummary.cnsRecoveryPercentage,
            },
            gymPrescription: {
              ...parsed.gymPrescription,
              tonnageTargetKg: basePrescription.gymPrescription.tonnageTargetKg,
            },
          };
          engineSource = 'gemini-3.8-flash + Mathematical Matrix';
        }
      } catch (geminiErr) {
        console.warn('Fallback to deterministic mathematical matrix:', geminiErr);
      }
    }

    global.__LATEST_BIOMEDICAL_PRESCRIPTION = {
      prescription: finalPrescription,
      input: normalizedInput,
      updatedAt: new Date().toISOString(),
      engineSource,
    };

    const { searchParams } = new URL(req.url);
    if (searchParams.get('format') === 'strict' || body.strictOnly === true) {
      return NextResponse.json(finalPrescription, {
        status: 200,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(
      {
        ...finalPrescription,
        _meta: {
          athlete: 'Santiago Smit Teherán Mogollón',
          affiliation: 'UPB Montería • 6.° Semestre Ingeniería Civil',
          wearable: 'Xiaomi Smart Band 9 Pro (Mi Fitness / Health Connect)',
          updatedAt: global.__LATEST_BIOMEDICAL_PRESCRIPTION.updatedAt,
          engineSource,
          diagnostics,
          inputSnapshot: normalizedInput,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Error en el Motor de Inteligencia Biomédica',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
