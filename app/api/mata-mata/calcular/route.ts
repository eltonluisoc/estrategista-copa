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
    
    // Mapeamento oficial dos confrontos do Round of 32
const confrontos = [
  // Jogos com 3º lugares (dependem da classificação geral)
  { casa: 'Vencedor Grupo A', fora: '3º melhor grupo (C/D/E/F)', prioridade: 'primeiro_melhor_terceiro' },
  { casa: 'Vencedor Grupo B', fora: '3º melhor grupo (C/D/E/F)', prioridade: 'segundo_melhor_terceiro' },
  { casa: 'Vencedor Grupo I', fora: '3º melhor grupo (C/D/E/F)', prioridade: 'terceiro_melhor_terceiro' },
  { casa: 'Vencedor Grupo J', fora: '3º melhor grupo (C/D/E/F)', prioridade: 'quarto_melhor_terceiro' },
  
  // Jogos entre 1º e 2º lugares de grupos diferentes
  { casa: 'Vencedor Grupo C', fora: '2º lugar Grupo D', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo D', fora: '2º lugar Grupo C', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo E', fora: '2º lugar Grupo F', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo F', fora: '2º lugar Grupo E', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo G', fora: '2º lugar Grupo H', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo H', fora: '2º lugar Grupo G', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo K', fora: '2º lugar Grupo L', prioridade: 'fixo' },
  { casa: 'Vencedor Grupo L', fora: '2º lugar Grupo K', prioridade: 'fixo' },
]

// Organizar melhores terceiros
const melhoresTerceiros = terceiros.sort((a, b) => 
  b.pontos - a.pontos || b.saldo_gols - a.saldo_gols || b.gols_pro - a.gols_pro
).slice(0, 8)

// Atribuir os melhores terceiros aos confrontos específicos
const confrontosComTimes = confrontos.map(confronto => {
  if (confronto.prioridade === 'primeiro_melhor_terceiro' && melhoresTerceiros[0]) {
    return { ...confronto, fora: melhoresTerceiros[0].time_nome }
  }
  if (confronto.prioridade === 'segundo_melhor_terceiro' && melhoresTerceiros[1]) {
    return { ...confronto, fora: melhoresTerceiros[1].time_nome }
  }
  if (confronto.prioridade === 'terceiro_melhor_terceiro' && melhoresTerceiros[2]) {
    return { ...confronto, fora: melhoresTerceiros[2].time_nome }
  }
  if (confronto.prioridade === 'quarto_melhor_terceiro' && melhoresTerceiros[3]) {
    return { ...confronto, fora: melhoresTerceiros[3].time_nome }
  }
  return confronto
})
    
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