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
    
    // Buscar palpites com jogos finalizados
    const palpites = await sql`
      SELECT p.usuario_id, p.rodada, p.time_id, t.nome as time_nome,
             j.vencedor_id, j.finalizado
      FROM palpites p
      JOIN times t ON p.time_id = t.id
      LEFT JOIN jogos j ON j.rodada = p.rodada 
        AND (j.time_casa = t.nome OR j.time_fora = t.nome)
      WHERE j.finalizado = true AND j.vencedor_id IS NOT NULL
    `
    
    const disponibilidade = []
    
    for (const usuario of ativos) {
      const palpitesUsuario = palpites.filter(p => p.usuario_id === usuario.id)
      const timesUsados = []
      
      for (const palpite of palpitesUsuario) {
        if (palpite.vencedor_id === palpite.time_id) {
          timesUsados.push(palpite.time_nome)
        }
      }
      
      const timesDisponiveis = timesLista.filter(t => !timesUsados.includes(t))
      const podeContinuar = timesDisponiveis.length > 0
      
      // Se não tem mais times disponíveis, eliminar automaticamente
      if (!podeContinuar && timesUsados.length > 0) {
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${palpitesUsuario.length + 1}
          WHERE id = ${usuario.id}
        `
      }
      
      disponibilidade.push({
        nome: usuario.nome,
        email: usuario.email,
        times_usados: timesUsados,
        total_usados: timesUsados.length,
        times_disponiveis: timesDisponiveis.length,
        pode_continuar: podeContinuar,
        eliminado_automatico: !podeContinuar
      })
    }
    
    const eliminadosAuto = disponibilidade.filter(d => d.eliminado_automatico).length
    
    return NextResponse.json({
      participantes: disponibilidade,
      total_ativos: ativos.length,
      eliminados_automaticos: eliminadosAuto,
      message: `${eliminadosAuto} participantes eliminados automaticamente por falta de times disponíveis`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao verificar disponibilidade' }, { status: 500 })
  }
}