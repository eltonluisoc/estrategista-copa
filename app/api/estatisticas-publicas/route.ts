import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const usuarios = await sql`
    SELECT status, COUNT(*) as total 
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
    GROUP BY status
  `
  
  let ativos = 0
  let eliminados = 0
  
  for (const u of usuarios) {
    if (u.status === 'ativo') ativos = parseInt(u.total)
    if (u.status === 'eliminado') eliminados = parseInt(u.total)
  }
  
  return NextResponse.json({
    totalParticipantes: ativos + eliminados,
    ativos,
    eliminados
  })
}