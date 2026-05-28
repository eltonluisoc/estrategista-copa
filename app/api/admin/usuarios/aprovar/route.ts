import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  const { usuarioId } = await request.json()
  
  await sql`
    UPDATE usuarios 
    SET aprovado = true, status = 'ativo' 
    WHERE id = ${usuarioId}
  `
  
  return NextResponse.json({ success: true })
}