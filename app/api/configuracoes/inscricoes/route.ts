import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const config = await sql`
      SELECT valor FROM configuracoes WHERE chave = 'inscricoes_abertas'
    `
    const inscricoesAbertas = config.length > 0 ? config[0].valor === 'true' : true
    
    return NextResponse.json({ inscricoes_abertas: inscricoesAbertas })
  } catch (error) {
    return NextResponse.json({ inscricoes_abertas: true })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { inscricoes_abertas } = await request.json()
    
    await sql`
      INSERT INTO configuracoes (chave, valor) 
      VALUES ('inscricoes_abertas', ${inscricoes_abertas ? 'true' : 'false'})
      ON CONFLICT (chave) DO UPDATE SET valor = ${inscricoes_abertas ? 'true' : 'false'}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}