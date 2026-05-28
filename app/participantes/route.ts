import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const participantes = await sql`
    SELECT id, nome, email, status 
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
    ORDER BY 
      CASE WHEN status = 'ativo' THEN 0 ELSE 1 END,
      nome ASC
  `
  return NextResponse.json(participantes)
}