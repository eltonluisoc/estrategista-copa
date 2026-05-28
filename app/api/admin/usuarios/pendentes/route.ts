import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const pendentes = await sql`
    SELECT id, nome, email, status, created_at 
    FROM usuarios 
    WHERE aprovado = false AND email != 'admin@estrategista.com'
    ORDER BY created_at ASC
  `
  return NextResponse.json(pendentes)
}