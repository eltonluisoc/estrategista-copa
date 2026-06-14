import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Buscar participantes aprovados (pagamento confirmado OU aprovado manualmente por cartão)
  const participantesAprovados = await sql`
    SELECT COUNT(*) as total
    FROM usuarios 
    WHERE email != 'admin@estrategista.com' AND (aprovado = true OR pagamento_confirmado = true)
  `
  
  const totalAprovados = participantesAprovados[0]?.total || 0
  
  // Buscar todos os participantes (exceto admin) - INCLUINDO aprovado e pagamento_confirmado
  const participantes = await sql`
    SELECT id, nome, email, status, rodada_eliminacao, rodada_atual, pontos, aprovado, pagamento_confirmado
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
  `
  
  // Buscar palpites com resultados (query corrigida com subconsulta para prazo)
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
           j.vencedor_id, j.finalizado, 
           COALESCE(
             (SELECT prazo FROM jogos WHERE rodada = p.rodada AND time_casa = t.nome LIMIT 1),
             (SELECT prazo FROM jogos WHERE rodada = p.rodada AND time_fora = t.nome LIMIT 1)
           ) as prazo,
           j.gols_casa, j.gols_fora
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
        palpite_atual_visivel: false,
        aprovado: p.aprovado,
        pagamento_confirmado: p.pagamento_confirmado
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
        palpite_atual_visivel: false,
        aprovado: p.aprovado,
        pagamento_confirmado: p.pagamento_confirmado
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
        // CORREÇÃO: Comparar timestamps diretamente (evita conversão de fuso)
        const prazoExpirado = palpite.prazo ? new Date(palpite.prazo + ' UTC').getTime() <= new Date().getTime() : false
        
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
      palpite_atual_visivel: palpiteAtualVisivel,
      aprovado: p.aprovado,
      pagamento_confirmado: p.pagamento_confirmado
    }
  })
  
  // ========== DEBUG: Identificar quem está sendo excluído ==========
  console.log('\n=== VERIFICANDO QUEM NÃO É CONSIDERADO ATIVO ===');
  participantesComDados.forEach((p: any) => {
    const estaAtivo = p.status === 'ativo';
    const pagou = (p.aprovado === true || p.pagamento_confirmado === true);
    if (estaAtivo && !pagou) {
      console.log(`❌ EXCLUÍDO: ${p.nome} - aprovado: ${p.aprovado}, pag_conf: ${p.pagamento_confirmado}`);
    }
    if (!estaAtivo) {
      console.log(`❌ NÃO ESTÁ ATIVO: ${p.nome} - status: ${p.status}`);
    }
    if (estaAtivo && pagou) {
      console.log(`✅ INCLUÍDO: ${p.nome}`);
    }
  });
  console.log('==================================================\n');
  
  // Separar ativos (APENAS quem pagou - por PIX ou cartão - E está ativo)
  const ativosFiltrados = participantesComDados.filter((p: any) => {
    const estaAtivo = p.status === 'ativo';
    const pagou = (p.aprovado === true || p.pagamento_confirmado === true);
    return estaAtivo && pagou;
  });
  
  const eliminados = participantesComDados.filter((p: any) => p.status === 'eliminado');
  
  // Ordenar ativos
  ativosFiltrados.sort((a: any, b: any) => {
    if (a.rodada_atual !== b.rodada_atual) {
      return b.rodada_atual - a.rodada_atual;
    }
    return (b.pontos || 0) - (a.pontos || 0);
  });
  
  // Ordenar eliminados
  eliminados.sort((a: any, b: any) => {
    return (b.rodada_eliminacao || 0) - (a.rodada_eliminacao || 0);
  });
  
  // Calcular posições
  const todosParticipantes = [...ativosFiltrados, ...eliminados];
  const ordenados = [];
  
  for (let i = 0; i < todosParticipantes.length; i++) {
    const atual = todosParticipantes[i];
    let posicao = i + 1;
    
    if (i > 0) {
      const anterior = todosParticipantes[i - 1];
      const valorAtual = atual.status === 'ativo' 
        ? atual.rodada_atual 
        : atual.rodada_eliminacao;
      const valorAnterior = anterior.status === 'ativo' 
        ? anterior.rodada_atual 
        : anterior.rodada_eliminacao;
      
      if (valorAtual === valorAnterior) {
        posicao = ordenados[i - 1].posicao;
      }
    }
    
    ordenados.push({
      ...atual,
      posicao: posicao
    });
  }
  
  // Calcular quem está em primeiro (maior rodada entre ativos)
  let qtosEmPrimeiro = 0;
  let maiorRodada = 0;
  
  if (ativosFiltrados.length > 0) {
    const rodadasValidas = ativosFiltrados
      .map((a: any) => a.rodada_atual)
      .filter((r: any) => r !== null && r !== undefined && typeof r === 'number');
    
    if (rodadasValidas.length > 0) {
      maiorRodada = Math.max(...rodadasValidas);
      qtosEmPrimeiro = ativosFiltrados.filter((a: any) => a.rodada_atual === maiorRodada).length;
    } else {
      maiorRodada = 1;
      qtosEmPrimeiro = ativosFiltrados.length;
    }
  }
  
  // Retornar com os campos para premiação
  return NextResponse.json({
    ranking: ordenados,
    totalAprovados: totalAprovados,
    participantesAtivos: ativosFiltrados.length,
    maiorRodada: maiorRodada,
    qtosEmPrimeiro: qtosEmPrimeiro
  });
}