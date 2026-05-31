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
    ORDER BY p.rodada ASC, p.data_palpite ASC
  `
  
  const agora = new Date()
  
  const participantesComDados = participantes.map((p: any) => {
    // Se já está eliminado
    if (p.status === 'eliminado') {
      return { 
        ...p, 
        rodada_atual: null, 
        acertos: [], 
        palpite_atual: null, 
        palpite_atual_visivel: false 
      }
    }
    
    const palpitesDoUsuario = palpites.filter((pal: any) => pal.usuario_id === p.id)
    
    // Ordenar palpites por rodada
    const palpitesOrdenados = [...palpitesDoUsuario].sort((a, b) => a.rodada - b.rodada)
    
    // Sem palpites: rodada 1
    if (palpitesOrdenados.length === 0) {
      return { 
        ...p, 
        rodada_atual: 1, 
        acertos: [], 
        palpite_atual: null, 
        palpite_atual_visivel: false 
      }
    }
    
    const acertos = []
    let rodadaAtual = 1
    let palpiteAtual = null
    let palpiteAtualVisivel = false
    let eliminado = false
    let rodadaEliminacao = null
    
    // Processar palpites em ordem
    for (const palpite of palpitesOrdenados) {
      if (palpite.finalizado === true && palpite.vencedor_id) {
        // Jogo finalizado - verificar se acertou ou errou
        if (palpite.time_id === palpite.vencedor_id) {
          // Acertou - avança para próxima rodada
          acertos.push({
            rodada: palpite.rodada,
            time: palpite.time_nome
          })
          rodadaAtual = palpite.rodada + 1
        } else {
          // Errou - eliminado
          eliminado = true
          rodadaEliminacao = palpite.rodada
          break
        }
      } else {
        // Jogo NÃO finalizado - este é o palpite atual
        // CORREÇÃO: A rodada atual é a rodada deste palpite
        rodadaAtual = palpite.rodada
        
        const prazo = palpite.prazo ? new Date(palpite.prazo) : null
        const prazoExpirado = prazo ? agora > prazo : false
        
        // Mostrar palpite se modo teste ou prazo expirado
        if (modoTeste) {
          palpiteAtual = palpite.time_nome
          palpiteAtualVisivel = true
        } else if (prazoExpirado) {
          palpiteAtual = palpite.time_nome
          palpiteAtualVisivel = true
        }
        
        // Não processa mais palpites (próximas rodadas ainda não começaram)
        break
      }
    }
    
    // Se foi eliminado
    if (eliminado) {
      return { 
        ...p, 
        status: 'eliminado',
        rodada_eliminacao: rodadaEliminacao,
        rodada_atual: null,
        acertos,
        palpite_atual: null,
        palpite_atual_visivel: false
      }
    }
    
    return { 
      ...p, 
      status: 'ativo',
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
    
    const rodadaA = a.status === 'ativo' ? (a.rodada_atual || 0) : 0
    const rodadaB = b.status === 'ativo' ? (b.rodada_atual || 0) : 0
    
    if (rodadaA !== rodadaB) {
      return rodadaB - rodadaA
    }
    
    return a.nome.localeCompare(b.nome)
  })
  
  return NextResponse.json(ordenados)
}