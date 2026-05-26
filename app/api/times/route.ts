import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const times = await sql`
      SELECT id, nome, grupo FROM times ORDER BY grupo, nome
    `
    return NextResponse.json(times)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar times' }, { status: 500 })
  }
}