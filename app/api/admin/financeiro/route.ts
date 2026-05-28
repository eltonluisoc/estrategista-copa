import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Buscar valor da inscrição da tabela de configurações
    const config = await sql`
      SELECT valor FROM configuracoes WHERE chave = 'valor_inscricao'
    `
    const valorInscricao = parseInt(config[0]?.valor || '20')

    // Contar usuários aprovados (excluindo admin)
    const aprovados = await sql`
      SELECT COUNT(*) as total FROM usuarios 
      WHERE aprovado = true AND email != 'admin@estrategista.com'
    `
    
    const totalAprovados = parseInt(aprovados[0].total)
    const totalArrecadado = totalAprovados * valorInscricao
    const custos = totalArrecadado * 0.10
    const premio = totalArrecadado - custos
    
    return NextResponse.json({
      totalArrecadado,
      custos: Math.floor(custos),
      premio: Math.floor(premio),
      totalAprovados,
      valorInscricao
    })
  } catch (error) {
    console.error('Erro ao calcular financeiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}