import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const jogos = await sql`SELECT * FROM jogos ORDER BY data_hora`
  return NextResponse.json(jogos)
}