import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

const timesLista = [
  'Brasil', 'Argentina', 'França', 'Alemanha', 'Espanha', 'Inglaterra',
  'Portugal', 'Holanda', 'Itália', 'Bélgica', 'Croácia', 'Uruguai',
  'México', 'Coreia do Sul', 'África do Sul', 'República Tcheca',
  'Canadá', 'Bósnia', 'Catar', 'Suíça', 'Marrocos', 'Haiti', 'Escócia',
  'EUA', 'Paraguai', 'Austrália', 'Turquia', 'Curaçao', 'Costa do Marfim',
  'Equador', 'Japão', 'Suécia', 'Tunísia', 'Egito', 'Irã', 'Nova Zelândia'
]

export async function GET() {
  try {
    // Buscar participantes ativos
    const ativos = await sql`
      SELECT id, nome, email, status 
      FROM usuarios 
      WHERE email != 'admin@estrategista.com' AND status = 'ativo'
    `
    
    if (ativos.length === 0) {
      return NextResponse.json({
        participantes: [],
        total_ativos: 0,
        eliminados_automaticos: 0,
        message: 'Nenhum participante ativo encontrado',
        timestamp: new Date().toISOString()
      })
    }
    
    // Buscar todos os jogos finalizados
    const jogosFinalizados = await sql`
      SELECT id, rodada, time_casa, time_fora, vencedor_id, gols_casa, gols_fora
      FROM jogos 
      WHERE finalizado = true AND vencedor_id IS NOT NULL
    `
    
    // Buscar todos os palpites
    const todosPalpites = await sql`
      SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome
      FROM palpites p
      JOIN times t ON p.time_id = t.id
    `
    
    const disponibilidade = []
    let eliminadosAuto = 0
    
    for (const usuario of ativos) {
      // Filtrar palpites do usuário
      const palpitesUsuario = todosPalpites.filter(p => p.usuario_id === usuario.id)
      
      // Buscar jogos finalizados que o usuário ACERTOU
      const timesUsados: string[] = []
      
      for (const palpite of palpitesUsuario) {
        // Verificar se o jogo correspondente foi finalizado e o usuário acertou
        const jogo = jogosFinalizados.find(j => j.rodada === palpite.rodada)
        if (jogo && jogo.vencedor_id === palpite.time_id) {
          timesUsados.push(palpite.time_nome)
        }
      }
      
      // Calcular times disponíveis
      const timesUsadosSet = new Set(timesUsados)
      const timesDisponiveis = timesLista.filter(t => !timesUsadosSet.has(t))
      const podeContinuar = timesDisponiveis.length > 0
      
      // Se não tem mais times disponíveis E já usou pelo menos um time, eliminar
      if (!podeContinuar && timesUsados.length > 0 && palpitesUsuario.length > 0) {
        const rodadaEliminacao = palpitesUsuario.length + 1
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodadaEliminacao}
          WHERE id = ${usuario.id}
        `
        eliminadosAuto++
        console.log(`Eliminado automaticamente: ${usuario.nome} (sem times disponíveis)`)
      }
      
      disponibilidade.push({
        nome: usuario.nome,
        email: usuario.email,
        times_usados: timesUsados,
        total_usados: timesUsados.length,
        times_disponiveis: timesDisponiveis.length,
        pode_continuar: podeContinuar,
        eliminado_automatico: !podeContinuar && timesUsados.length > 0
      })
    }
    
    return NextResponse.json({
      participantes: disponibilidade,
      total_ativos: ativos.length,
      eliminados_automaticos: eliminadosAuto,
      message: eliminadosAuto > 0 
        ? `${eliminadosAuto} participante(s) eliminado(s) automaticamente por falta de times disponíveis`
        : 'Nenhum participante foi eliminado automaticamente',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ 
      error: 'Erro ao verificar disponibilidade',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}