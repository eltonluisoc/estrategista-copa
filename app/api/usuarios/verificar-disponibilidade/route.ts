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

    const { rodada } = await request.json()

    // Buscar todos os participantes ativos
    const participantes = await sql`
      SELECT id, nome FROM usuarios 
      WHERE status = 'ativo' AND email != 'admin@estrategista.com'
    `

    // Buscar times que jogam nesta rodada
    const timesDaRodada = await sql`
      SELECT DISTINCT time_casa as time_nome FROM jogos WHERE rodada = ${rodada} AND finalizado = false
      UNION
      SELECT DISTINCT time_fora as time_nome FROM jogos WHERE rodada = ${rodada} AND finalizado = false
    `

    const eliminadosSemOpcao = []

    for (const participante of participantes) {
      // Buscar times já usados pelo participante
      const timesUsados = await sql`
        SELECT time_id FROM palpites WHERE usuario_id = ${participante.id}
      `
      const idsUsados = timesUsados.map(t => t.time_id)

      // Verificar times disponíveis na rodada
      let temOpcao = false
      for (const time of timesDaRodada) {
        const timeId = await sql`
          SELECT id FROM times WHERE nome = ${time.time_nome}
        `
        if (timeId.length > 0 && !idsUsados.includes(timeId[0].id)) {
          temOpcao = true
          break
        }
      }

      if (!temOpcao) {
        // Eliminar participante por falta de opção
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodada}
          WHERE id = ${participante.id}
        `
        eliminadosSemOpcao.push(participante.nome)
      }
    }

    return NextResponse.json({
      success: true,
      eliminadosSemOpcao,
      message: `${eliminadosSemOpcao.length} participante(s) eliminado(s) por falta de opções na rodada ${rodada}`
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}