import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

const VALOR_INSCRICAO = 30

export async function GET() {
  // Excluir admin da contagem
  const aprovados = await sql`
    SELECT COUNT(*) as total FROM usuarios 
    WHERE aprovado = true AND email != 'admin@estrategista.com'
  `
  
  const totalAprovados = parseInt(aprovados[0].total)
  const totalArrecadado = totalAprovados * VALOR_INSCRICAO
  const custos = totalArrecadado * 0.10
  const premio = totalArrecadado - custos
  
  return NextResponse.json({
    totalArrecadado,
    custos: Math.floor(custos),
    premio: Math.floor(premio),
    totalAprovados
  })
}