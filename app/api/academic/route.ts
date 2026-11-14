import { NextRequest, NextResponse } from 'next/server';
import {
  computeAcademicProjection,
  AcademicInteractiveOverrides,
} from '@/lib/academicReactiveEngine';
import {
  readAcademicOverridesFromDisk,
  writeAcademicOverridesToDisk,
} from '@/lib/academicStatePersistence';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const overrides = readAcademicOverridesFromDisk();
  const projection = computeAcademicProjection(overrides);
  return NextResponse.json({
    ok: true,
    overrides,
    projection,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AcademicInteractiveOverrides>;
    const current = readAcademicOverridesFromDisk();
    const nextPartial: Partial<AcademicInteractiveOverrides> = {
      ...current,
      ...body,
      courseStatuses: {
        ...current.courseStatuses,
        ...(body.courseStatuses ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const result = writeAcademicOverridesToDisk(nextPartial);
    const projection = computeAcademicProjection(result.overrides);

    return NextResponse.json({
      ok: true,
      persistedToDisk: result.persistedToDisk,
      warning: result.warning,
      overrides: result.overrides,
      projection,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Error actualizando estado académico',
      },
      { status: 400 }
    );
  }
}
