import { NextResponse } from 'next/server';
import { enviarBackupPorEmail } from '@/lib/backup-email';

export async function GET() {
  const resultado = await enviarBackupPorEmail();
  return NextResponse.json(resultado);
}