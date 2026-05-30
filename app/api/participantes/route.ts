import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Buscar modo teste
  const config = await sql`
    SELECT valor FROM configuracoes WHERE chave = 'modo_teste'
  `
  const modoTeste = config.length > 0 ? config[0].valor === 'true' : false

  // Buscar todos os participantes (exceto admin)
  const participantes = await sql`
    SELECT id, nome, email, status, rodada_eliminacao
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
  `
  
  // Buscar palpites
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
           j.vencedor_id, j.finalizado, j.prazo
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada 
      AND (j.time_casa = t.nome OR j.time_fora = t.nome)
    ORDER BY p.rodada
  `
  
  const agora = new Date()
  
  const participantesComDados = participantes.map((p: any) => {
    if (p.status === 'eliminado') {
      return { ...p, rodada_atual: null, acertos: [], palpite_atual: null, palpite_atual_visivel: false }
    }
    
    const palpitesDoUsuario = palpites.filter((pal: any) => pal.usuario_id === p.id)
    
    if (palpitesDoUsuario.length === 0) {
      return { ...p, rodada_atual: 1, acertos: [], palpite_atual: null, palpite_atual_visivel: false }
    }
    
    const acertos = []
    let rodadaAtual = 1
    let ultimoPalpite = null
    let palpiteAtual = null
    let palpiteAtualVisivel = false
    
    // CORREÇÃO: Separar palpites finalizados dos não finalizados
    const palpitesFinalizados = palpitesDoUsuario.filter((pal: any) => pal.finalizado === true)
    const palpitesNaoFinalizados = palpitesDoUsuario.filter((pal: any) => pal.finalizado === false)
    
    // Processar acertos (apenas finalizados)
    for (const palpite of palpitesFinalizados) {
      ultimoPalpite = palpite
      
      if (palpite.vencedor_id && palpite.time_id === palpite.vencedor_id) {
        acertos.push({
          rodada: palpite.rodada,
          time: palpite.time_nome
        })
        rodadaAtual = palpite.rodada + 1
      } else if (palpite.vencedor_id && palpite.time_id !== palpite.vencedor_id) {
        return { 
          ...p, 
          status: 'eliminado', 
          rodada_eliminacao: palpite.rodada, 
          acertos,
          palpite_atual: null,
          palpite_atual_visivel: false
        }
      }
    }
    
    // REGRA CRÍTICA: Se houver palpite NÃO finalizado, força rodada = 1
    if (palpitesNaoFinalizados.length > 0) {
      rodadaAtual = 1
      const ultimoNaoFinalizado = palpitesNaoFinalizados[palpitesNaoFinalizados.length - 1]
      ultimoPalpite = ultimoNaoFinalizado
      
      const prazo = ultimoNaoFinalizado.prazo ? new Date(ultimoNaoFinalizado.prazo) : null
      const prazoExpirado = prazo ? agora > prazo : false
      
      if (modoTeste) {
        palpiteAtual = ultimoNaoFinalizado.time_nome
        palpiteAtualVisivel = true
      } else if (prazoExpirado) {
        palpiteAtual = ultimoNaoFinalizado.time_nome
        palpiteAtualVisivel = true
      }
    }
    
    return { 
      ...p, 
      rodada_atual: rodadaAtual, 
      acertos,
      palpite_atual: palpiteAtual,
      palpite_atual_visivel: palpiteAtualVisivel
    }
  })
  
  // Ordenar
  const ordenados = participantesComDados.sort((a: any, b: any) => {
    if (a.status === 'eliminado' && b.status !== 'eliminado') return 1
    if (a.status !== 'eliminado' && b.status === 'eliminado') return -1
    
    const rodadaA = a.rodada_atual || 0
    const rodadaB = b.rodada_atual || 0
    
    if (rodadaA !== rodadaB) {
      return rodadaB - rodadaA
    }
    
    return a.nome.localeCompare(b.nome)
  })
  
  return NextResponse.json(ordenados)
}