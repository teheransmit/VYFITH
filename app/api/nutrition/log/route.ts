import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyNutritionState,
  addFoodItemToMeal,
  updateWaterIntake,
  saveDailyNutritionState,
} from '@/lib/nutritionStore';
import { MealType } from '@/lib/fitiaEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const state = getDailyNutritionState();
    return NextResponse.json(
      {
        success: true,
        data: state,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error cargando bitácora de nutrición' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Caso 1: Registrar consumo de agua (ml)
    if (body.action === 'add_water' || body.waterDeltaMl) {
      const delta = Number(body.waterDeltaMl || body.deltaMl || 250);
      const updated = updateWaterIntake(delta);
      return NextResponse.json(
        {
          success: true,
          message: `Registrados +${delta} ml de hidratación`,
          data: updated,
        },
        { headers: corsHeaders }
      );
    }

    // Caso 2: Agregar alimento a una comida (Desayuno, Almuerzo, Cena, Snacks)
    if (body.mealType && body.item) {
      const mealType = body.mealType as MealType;
      const updated = addFoodItemToMeal(mealType, body.item);
      return NextResponse.json(
        {
          success: true,
          message: `Alimento agregado a ${mealType.toUpperCase()} exitosamente`,
          data: updated,
        },
        { headers: corsHeaders }
      );
    }

    // Caso 3: Guardar estado completo
    if (body.state) {
      const updated = saveDailyNutritionState(body.state);
      return NextResponse.json(
        {
          success: true,
          message: 'Estado diario de nutrición guardado',
          data: updated,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Parámetros insuficientes para registrar nutrición' },
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error guardando registro de nutrición' },
      { status: 500, headers: corsHeaders }
    );
  }
}
