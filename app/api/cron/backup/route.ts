import { NextResponse } from 'next/server';
import { enviarBackupPorEmail } from '@/lib/backup-email';

export async function GET(request: Request) {
  // Verificar se é chamada manual (via navegador) ou cron
  const url = new URL(request.url);
  const manual = url.searchParams.get('manual') === 'true';
  
  const resultado = await enviarBackupPorEmail(!manual);
  return NextResponse.json(resultado);
}