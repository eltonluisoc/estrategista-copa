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
  
  // Buscar palpites com resultados
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
           j.vencedor_id, j.finalizado, j.prazo
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada 
      AND (j.time_casa = t.nome OR j.time_fora = t.nome)
    ORDER BY p.rodada, p.data_palpite
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
    let palpiteAtual = null
    let palpiteAtualVisivel = false
    let ultimoPalpiteNaoFinalizado = null
    
    // Processar cada palpite em ordem
    for (const palpite of palpitesDoUsuario) {
      if (palpite.finalizado === true) {
        // Jogo finalizado
        if (palpite.vencedor_id && palpite.time_id === palpite.vencedor_id) {
          // Acertou
          acertos.push({
            rodada: palpite.rodada,
            time: palpite.time_nome
          })
          rodadaAtual = palpite.rodada + 1
        } else if (palpite.vencedor_id && palpite.time_id !== palpite.vencedor_id) {
          // Errou - eliminado
          return { 
            ...p, 
            status: 'eliminado', 
            rodada_eliminacao: palpite.rodada, 
            acertos,
            palpite_atual: null,
            palpite_atual_visivel: false
          }
        }
      } else {
        // Jogo NÃO finalizado - este é o palpite atual
        ultimoPalpiteNaoFinalizado = palpite
        // REGRA CRÍTICA: NÃO avança a rodada
      }
    }
    
    // Se há palpite não finalizado, a rodada atual é a rodada desse palpite
    if (ultimoPalpiteNaoFinalizado) {
      rodadaAtual = ultimoPalpiteNaoFinalizado.rodada
      
      const prazo = ultimoPalpiteNaoFinalizado.prazo ? new Date(ultimoPalpiteNaoFinalizado.prazo) : null
      const prazoExpirado = prazo ? agora > prazo : false
      
      if (modoTeste) {
        palpiteAtual = ultimoPalpiteNaoFinalizado.time_nome
        palpiteAtualVisivel = true
      } else if (prazoExpirado) {
        palpiteAtual = ultimoPalpiteNaoFinalizado.time_nome
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
  
  // Ordenar: ativos por rodada (decrescente), depois eliminados
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