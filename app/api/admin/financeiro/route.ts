import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

async function getValorInscricao() {
  const config = await sql`
    SELECT valor FROM configuracoes WHERE chave = 'valor_inscricao'
  `
  return parseInt(config[0]?.valor || '20')
}

export async function GET() {
  const valorInscricao = await getValorInscricao()
  
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
}