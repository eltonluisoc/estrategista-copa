import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Buscar todos os participantes (exceto admin)
  const participantes = await sql`
    SELECT id, nome, email, status, rodada_eliminacao, rodada_atual, pontos
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
  `
  
  // Buscar palpites com resultados
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
           j.vencedor_id, j.finalizado, j.prazo, j.gols_casa, j.gols_fora
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada 
      AND (j.time_casa = t.nome OR j.time_fora = t.nome)
    ORDER BY p.rodada ASC, p.data_palpite ASC
  `
  
  const agora = new Date()
  
  const participantesComDados = participantes.map((p: any) => {
    if (p.status === 'eliminado') {
      return { 
        ...p, 
        rodada_atual: p.rodada_atual || null, 
        acertos: [], 
        palpite_atual: null, 
        palpite_atual_visivel: false 
      }
    }
    
    const palpitesDoUsuario = palpites.filter((pal: any) => pal.usuario_id === p.id)
    const palpitesOrdenados = [...palpitesDoUsuario].sort((a, b) => a.rodada - b.rodada)
    
    if (palpitesOrdenados.length === 0) {
      return { 
        ...p, 
        rodada_atual: p.rodada_atual || 1, 
        acertos: [], 
        palpite_atual: null, 
        palpite_atual_visivel: false 
      }
    }
    
    const acertos = []
    let palpiteAtual = null
    let palpiteAtualVisivel = false
    
    for (const palpite of palpitesOrdenados) {
      if (palpite.finalizado === true && palpite.vencedor_id) {
        if (palpite.time_id === palpite.vencedor_id) {
          acertos.push({
            rodada: palpite.rodada,
            time: palpite.time_nome
          })
        }
      } else {
        const prazo = palpite.prazo ? new Date(palpite.prazo) : null
        const prazoExpirado = prazo ? agora > prazo : false
        
        if (prazoExpirado) {
          palpiteAtual = palpite.time_nome
          palpiteAtualVisivel = true
        } else {
          palpiteAtual = null
          palpiteAtualVisivel = false
        }
        break
      }
    }
    
    return { 
      ...p, 
      status: p.status,
      rodada_atual: p.rodada_atual || 1,
      acertos,
      palpite_atual: palpiteAtual,
      palpite_atual_visivel: palpiteAtualVisivel
    }
  })
  
  // ============================================================
  // CORREÇÃO DO RANKING - Posição por rodada alcançada
  // ============================================================
  
  // 1. Separar ativos (ainda na competição) e eliminados
  const ativos = participantesComDados.filter((p: any) => p.status === 'ativo');
  const eliminados = participantesComDados.filter((p: any) => p.status === 'eliminado');
  
  // 2. Ordenar ativos por rodada_atual (maior primeiro) e depois por pontos
  ativos.sort((a: any, b: any) => {
    if (a.rodada_atual !== b.rodada_atual) {
      return b.rodada_atual - a.rodada_atual;
    }
    return (b.pontos || 0) - (a.pontos || 0);
  });
  
  // 3. Ordenar eliminados por rodada_eliminacao (maior primeiro = quem foi mais longe)
  eliminados.sort((a: any, b: any) => {
    return (b.rodada_eliminacao || 0) - (a.rodada_eliminacao || 0);
  });
  
  // 4. Calcular posição para cada participante
  const todosParticipantes = [...ativos, ...eliminados];
  const ordenados = [];
  
  for (let i = 0; i < todosParticipantes.length; i++) {
    const atual = todosParticipantes[i];
    let posicao = i + 1; // posição padrão
    
    // Verificar se tem participantes empatados antes
    if (i > 0) {
      const anterior = todosParticipantes[i - 1];
      const valorAtual = atual.status === 'ativo' 
        ? atual.rodada_atual 
        : atual.rodada_eliminacao;
      const valorAnterior = anterior.status === 'ativo' 
        ? anterior.rodada_atual 
        : anterior.rodada_eliminacao;
      
      if (valorAtual === valorAnterior) {
        // Mesma posição do anterior
        posicao = ordenados[i - 1].posicao;
      }
    }
    
    ordenados.push({
      ...atual,
      posicao: posicao
    });
  }
  
  return NextResponse.json(ordenados)
}