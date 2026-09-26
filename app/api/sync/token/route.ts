import { NextResponse } from 'next/server';
import { getHealthSyncState, updateHealthSyncState } from '@/lib/healthStore';

export async function GET() {
  const state = getHealthSyncState();
  return NextResponse.json({
    pairingToken: state.pairingToken,
    deviceId: state.deviceId,
    deviceName: state.deviceName,
    isPaired: state.isPaired,
    backendSyncUrl: '/api/sync/health',
  });
}

export async function POST() {
  const newToken = `MEGA-HC-${Math.floor(1000 + Math.random() * 9000)}`;
  const updated = updateHealthSyncState((state) => {
    state.pairingToken = newToken;
    state.isPaired = true;
  });

  return NextResponse.json({
    success: true,
    pairingToken: updated.pairingToken,
    message: 'Nuevo código de emparejamiento generado exitosamente.',
  });
}
