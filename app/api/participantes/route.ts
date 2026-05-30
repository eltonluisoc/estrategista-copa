import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Buscar modo teste
  const config = await sql`
    SELECT valor FROM configuracoes WHERE chave = 'modo_teste'
  `
  const modoTeste = config.length > 0 ? config[0].valor === 'true' : true
  
  // Buscar todos os participantes (exceto admin)
  const participantes = await sql`
    SELECT id, nome, email, status, rodada_eliminacao
    FROM usuarios 
    WHERE email != 'admin@estrategista.com'
  `
  
  // Buscar palpites
  const palpites = await sql`
    SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
           j.prazo, j.finalizado
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada
    ORDER BY p.rodada
  `
  
  const agora = new Date()
  
  // Calcular rodada atual e palpite visível
  const participantesComDados = participantes.map((p: any) => {
    if (p.status === 'eliminado') {
      return { ...p, rodada_atual: null, palpite: null, palpite_visivel: false }
    }
    
    const palpitesDoUsuario = palpites.filter((pal: any) => pal.usuario_id === p.id)
    
    if (palpitesDoUsuario.length === 0) {
      return { ...p, rodada_atual: 1, palpite: null, palpite_visivel: false }
    }
    
    // Último palpite
    const ultimoPalpite = palpitesDoUsuario[palpitesDoUsuario.length - 1]
    const prazo = ultimoPalpite.prazo ? new Date(ultimoPalpite.prazo) : null
    const prazoExpirado = modoTeste ? true : (prazo && agora > prazo)
    
    return {
      ...p,
      rodada_atual: ultimoPalpite.rodada + 1,
      palpite: ultimoPalpite.time_nome,
      palpite_visivel: prazoExpirado || ultimoPalpite.finalizado
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