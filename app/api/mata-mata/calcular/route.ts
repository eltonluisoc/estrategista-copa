import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Verificar se todos os jogos da fase de grupos estão finalizados
    const gruposPendentes = await sql`
      SELECT COUNT(*) as total 
      FROM jogos 
      WHERE rodada IN (1, 2, 3) AND finalizado = false
    `

    const pendentes = parseInt(gruposPendentes[0].total)

    if (pendentes > 0) {
      return NextResponse.json({ 
        error: `Ainda faltam ${pendentes} jogos da fase de grupos para finalizar.` 
      }, { status: 400 })
    }

    // 1. Buscar classificação de todos os grupos
    const classificacao = await sql`
      SELECT c.*, t.nome as time_nome 
      FROM classificacao c
      JOIN times t ON c.time_id = t.id
      ORDER BY c.grupo, c.pontos DESC, c.saldo_gols DESC, c.gols_pro DESC
    `
    
    // 2. Agrupar por grupo
    const grupos: { [key: string]: any[] } = {}
    for (const item of classificacao) {
      if (!grupos[item.grupo]) grupos[item.grupo] = []
      grupos[item.grupo].push(item)
    }
    
    // 3. Pegar vencedores (1º lugar) e segundos lugares (2º lugar)
    const vencedores: any[] = []
    const segundos: any[] = []
    
    for (const grupo of Object.keys(grupos).sort()) {
      const times = grupos[grupo]
      if (times[0]) vencedores.push({ ...times[0], grupo })
      if (times[1]) segundos.push({ ...times[1], grupo })
    }
    
    // 4. Pegar melhores terceiros (top 8 de todos os grupos)
    const terceiros: any[] = []
    for (const grupo of Object.keys(grupos)) {
      if (grupos[grupo][2]) {
        terceiros.push({ ...grupos[grupo][2], grupo: grupos[grupo][2].grupo })
      }
    }
    terceiros.sort((a, b) => b.pontos - a.pontos || b.saldo_gols - a.saldo_gols)
    const melhoresTerceiros = terceiros.slice(0, 8)
    
    // 5. Montar confrontos do Round of 32
    const confrontos = [
      { casa: vencedores.find(v => v.grupo === 'A'), fora: melhoresTerceiros[0] },
      { casa: vencedores.find(v => v.grupo === 'B'), fora: melhoresTerceiros[1] },
      { casa: vencedores.find(v => v.grupo === 'C'), fora: segundos.find(s => s.grupo === 'D') },
      { casa: vencedores.find(v => v.grupo === 'D'), fora: segundos.find(s => s.grupo === 'C') },
      { casa: vencedores.find(v => v.grupo === 'E'), fora: segundos.find(s => s.grupo === 'F') },
      { casa: vencedores.find(v => v.grupo === 'F'), fora: segundos.find(s => s.grupo === 'E') },
      { casa: vencedores.find(v => v.grupo === 'G'), fora: segundos.find(s => s.grupo === 'H') },
      { casa: vencedores.find(v => v.grupo === 'H'), fora: segundos.find(s => s.grupo === 'G') },
      { casa: vencedores.find(v => v.grupo === 'I'), fora: melhoresTerceiros[2] },
      { casa: vencedores.find(v => v.grupo === 'J'), fora: melhoresTerceiros[3] },
      { casa: vencedores.find(v => v.grupo === 'K'), fora: segundos.find(s => s.grupo === 'L') },
      { casa: vencedores.find(v => v.grupo === 'L'), fora: segundos.find(s => s.grupo === 'K') },
    ]
    
    // 6. Atualizar os jogos do Round of 32 (rodada 4)
    const jogosRound32 = await sql`SELECT * FROM jogos WHERE rodada = 4 ORDER BY id`
    
    for (let i = 0; i < confrontos.length && i < jogosRound32.length; i++) {
      const confronto = confrontos[i]
      const jogo = jogosRound32[i]
      
      if (confronto.casa && confronto.fora) {
        await sql`
          UPDATE jogos 
          SET time_casa = ${confronto.casa.time_nome}, 
              time_fora = ${confronto.fora.time_nome}
          WHERE id = ${jogo.id}
        `
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mata-mata atualizado com sucesso!',
      confrontos: confrontos.map(c => ({
        casa: c.casa?.time_nome || 'A definir',
        fora: c.fora?.time_nome || 'A definir'
      }))
    })
    
  } catch (error) {
    console.error('Erro ao calcular mata-mata:', error)
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}