import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { jogoId, vencedor, rodadaAtual } = await request.json()
    const proximaRodada = rodadaAtual + 1

    // Buscar o jogo que foi finalizado
    const jogoFinalizado = await sql`
      SELECT * FROM jogos WHERE id = ${jogoId}
    `
    
    if (jogoFinalizado.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    const jogo = jogoFinalizado[0]

    // Mapeamento de qual slot da próxima fase deve ser preenchido
    // Exemplo: Jogo 1 do Round of 32 (id 49) alimenta Jogo 1 das Oitavas (id 65)
    const mapeamento: { [key: string]: { fase: string; posicao: string } } = {
      // Round of 32 (rodada 4) -> Oitavas (rodada 5)
      '4_1': { fase: 'Oitavas', posicao: 'casa' },
      '4_2': { fase: 'Oitavas', posicao: 'fora' },
      // ... mapeamento completo
    }

    // Encontrar o jogo da próxima fase que precisa ser atualizado
    const proximoJogo = await sql`
      SELECT * FROM jogos 
      WHERE rodada = ${proximaRodada} 
      AND (time_casa LIKE '%Vencedor%' OR time_fora LIKE '%Vencedor%')
      ORDER BY id
      LIMIT 1
    `

    if (proximoJogo.length > 0) {
      // Determinar se é time casa ou fora
      const precisaCasa = proximoJogo[0].time_casa.includes('Vencedor')
      const precisaFora = proximoJogo[0].time_fora.includes('Vencedor')

      if (precisaCasa) {
        await sql`
          UPDATE jogos 
          SET time_casa = ${vencedor}
          WHERE id = ${proximoJogo[0].id}
        `
      } else if (precisaFora) {
        await sql`
          UPDATE jogos 
          SET time_fora = ${vencedor}
          WHERE id = ${proximoJogo[0].id}
        `
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Próxima fase atualizada com ${vencedor}`
    })

  } catch (error) {
    console.error('Erro ao atualizar próxima fase:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}