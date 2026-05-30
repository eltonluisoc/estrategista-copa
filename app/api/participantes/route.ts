import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Buscar todos os participantes (exceto admin)
  const participantes = await sql`
    SELECT id, nome, email, status, rodada_eliminacao
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
  `
  
  // Buscar palpites e resultados dos jogos
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome, 
           j.vencedor_id, j.finalizado, j.gols_casa, j.gols_fora
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada 
      AND (j.time_casa = t.nome OR j.time_fora = t.nome) AND j.finalizado = true
    ORDER BY p.rodada
  `
  
  // Calcular rodada atual de cada participante
  const participantesComRodada = participantes.map(p => {
    if (p.status === 'eliminado') {
      return { ...p, rodada_atual: null }
    }
    
    const palpitesDoUsuario = palpites.filter(pal => pal.usuario_id === p.id)
    
    if (palpitesDoUsuario.length === 0) {
      return { ...p, rodada_atual: 1 }
    }
    
    // Verificar acertos
    let rodadaAtual = 1
    for (const palpite of palpitesDoUsuario) {
      if (palpite.finalizado) {
        if (palpite.vencedor_id && palpite.time_id === palpite.vencedor_id) {
          rodadaAtual = palpite.rodada + 1
        } else if (palpite.vencedor_id && palpite.time_id !== palpite.vencedor_id) {
          // Errou - deveria estar eliminado
          return { ...p, rodada_atual: palpite.rodada, status: 'eliminado', rodada_eliminacao: palpite.rodada }
        }
      } else {
        rodadaAtual = palpite.rodada
      }
    }
    
    return { ...p, rodada_atual: rodadaAtual }
  })
  
  // Ordenar: primeiro por rodada_atual (maior), depois por nome
  const ordenados = participantesComRodada.sort((a, b) => {
    // Eliminados vão para o final
    if (a.status === 'eliminado' && b.status !== 'eliminado') return 1
    if (a.status !== 'eliminado' && b.status === 'eliminado') return -1
    
    // Ordenar por rodada atual (maior primeiro)
    if (a.rodada_atual && b.rodada_atual) {
      return b.rodada_atual - a.rodada_atual
    }
    if (a.rodada_atual && !b.rodada_atual) return -1
    if (!a.rodada_atual && b.rodada_atual) return 1
    
    // Ordem alfabética
    return a.nome.localeCompare(b.nome)
  })
  
  return NextResponse.json(ordenados)
}