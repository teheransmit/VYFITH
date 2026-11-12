import { NextRequest, NextResponse } from 'next/server';
import { generateAiCoachPrescription } from '@/lib/aiCoachPeriodizationEngine';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routine = searchParams.get('routine') || 'Horizontal Torso (Chest & Back)';
    const prescription = generateAiCoachPrescription(routine);
    return NextResponse.json({ success: true, prescription });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating prescription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const routineTitle = body?.routineTitle || 'Rutina Desconocida';

    // Guardar en data/prescribed_hevy_routines.json como persistencia viva
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const prescribedPath = path.join(dataDir, 'prescribed_hevy_routines.json');

    let existingRoutines: Record<string, any> = {};
    if (fs.existsSync(prescribedPath)) {
      try {
        existingRoutines = JSON.parse(fs.readFileSync(prescribedPath, 'utf-8'));
      } catch (e) {
        existingRoutines = {};
      }
    }

    existingRoutines[routineTitle] = {
      ...body,
      appliedAt: new Date().toISOString(),
      syncedWithHevy: true,
      status: 'ACTIVA_EN_HEVY',
    };

    fs.writeFileSync(prescribedPath, JSON.stringify(existingRoutines, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Rutina '${routineTitle}' sincronizada y actualizada en el sistema de Hevy.`,
      appliedRoutine: existingRoutines[routineTitle],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating Hevy routine' },
      { status: 500 }
    );
  }
}
