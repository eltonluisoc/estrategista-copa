import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const participante = searchParams.get('participante') || ''

  try {
    const historico = await sql`
      SELECT 
        u.nome as participante,
        p.rodada,
        t.nome as time_escolhido,
        j.time_casa || ' x ' || j.time_fora as jogo,
        CASE 
          WHEN j.finalizado = true AND j.vencedor_id = p.time_id THEN '✅ Acertou'
          WHEN j.finalizado = true AND (j.vencedor_id != p.time_id OR j.vencedor_id IS NULL) THEN '❌ Errou'
          ELSE '⏳ Aguardando'
        END as resultado,
        p.data_palpite
      FROM palpites p
      JOIN usuarios u ON u.id = p.usuario_id
      JOIN times t ON t.id = p.time_id
      JOIN jogos j ON j.rodada = p.rodada 
        AND (j.time_casa = t.nome OR j.time_fora = t.nome)
      WHERE u.email != 'admin@estrategista.com'
        AND u.nome ILIKE ${'%' + participante + '%'}
        AND j.prazo < NOW()  -- 🔥 SÓ PALPITES DE JOGOS COM PRAZO EXPIRADO
      ORDER BY u.nome, p.rodada
    `

    return NextResponse.json(historico)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}