import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.email !== 'admin@estrategista.com') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { jogoId, vencedor, rodadaAtual } = await request.json()
    const proximaRodada = rodadaAtual + 1

    // Buscar o jogo finalizado
    const jogoFinalizado = await sql`
      SELECT * FROM jogos WHERE id = ${jogoId}
    `
    if (jogoFinalizado.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    // Buscar jogos da próxima fase que ainda têm placeholders
    const jogosProximaFase = await sql`
      SELECT * FROM jogos 
      WHERE rodada = ${proximaRodada} 
      AND (time_casa LIKE '%Vencedor%' OR time_fora LIKE '%Vencedor%' 
           OR time_casa LIKE '%Vitória%' OR time_fora LIKE '%Vitória%')
      ORDER BY id
    `

    if (jogosProximaFase.length === 0) {
      return NextResponse.json({ message: 'Nenhum slot pendente na próxima fase' })
    }

    // Encontrar o primeiro slot não preenchido
    let slotAtualizado = false
    for (const jogo of jogosProximaFase) {
      if (jogo.time_casa.includes('Vencedor') || jogo.time_casa.includes('Vitória')) {
        await sql`
          UPDATE jogos 
          SET time_casa = ${vencedor}
          WHERE id = ${jogo.id}
        `
        slotAtualizado = true
        break
      }
      if (jogo.time_fora.includes('Vencedor') || jogo.time_fora.includes('Vitória')) {
        await sql`
          UPDATE jogos 
          SET time_fora = ${vencedor}
          WHERE id = ${jogo.id}
        `
        slotAtualizado = true
        break
      }
    }

    if (slotAtualizado) {
      return NextResponse.json({ 
        success: true, 
        message: `✅ ${vencedor} avançou para a próxima fase!` 
      })
    } else {
      return NextResponse.json({ message: 'Nenhum slot disponível' })
    }

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}