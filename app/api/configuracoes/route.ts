import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chave = searchParams.get('chave')
  
  if (!chave) {
    return NextResponse.json({ error: 'Chave obrigatória' }, { status: 400 })
  }
  
  const config = await sql`
    SELECT valor FROM configuracoes WHERE chave = ${chave}
  `
  
  return NextResponse.json({ valor: config[0]?.valor || null })
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  const { chave, valor } = await request.json()
  
  await sql`
    INSERT INTO configuracoes (chave, valor) 
    VALUES (${chave}, ${valor})
    ON CONFLICT (chave) DO UPDATE SET valor = ${valor}
  `
  
  return NextResponse.json({ success: true })
}