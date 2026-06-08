import { NextResponse } from 'next/server';
import { enviarBackupPorEmail } from '@/lib/backup-email';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const resultado = await enviarBackupPorEmail();
  return NextResponse.json(resultado);
}