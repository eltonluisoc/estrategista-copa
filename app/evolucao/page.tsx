'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Calendar, Award, BarChart3 } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';
import Link from 'next/link';

interface RodadaStats {
  rodada: number;
  ativos: number;
  eliminados: number;
  totalEliminados: number;
  variacao: number;
  percentual: number;
  isFutura: boolean;
}

export default function EvolucaoPage() {
  const [stats, setStats] = useState<RodadaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInicial, setTotalInicial] = useState(0);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [totalEliminadosReais, setTotalEliminadosReais] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [participantesRes, eliminadosRes] = await Promise.all([
        fetch('/api/participantes'),
        fetch('/api/eliminados-por-rodada')
      ]);
      
      const data = await participantesRes.json();
      const eliminadosPorRodada = await eliminadosRes.json();
      const participantes = data.ranking || [];
      
      const totalParticipantes = participantes.length;
      const participantesAtivos = participantes.filter((p: any) => p.status === 'ativo').length;
      const participantesEliminados = participantes.filter((p: any) => p.status === 'eliminado').length;
      
      setTotalInicial(totalParticipantes);
      setTotalAtivos(participantesAtivos);
      setTotalEliminadosReais(participantesEliminados);
      
      // Mapear eliminados por rodada
      const eliminadosMap: { [key: number]: number } = {};
      eliminadosPorRodada.forEach((item: any) => {
        eliminadosMap[item.rodada_eliminacao] = parseInt(item.total);
      });
      
      // ========== ENCONTRAR A ÚLTIMA RODADA COM DADOS ==========
      let maxRodComDados = 1;
      participantes.forEach((p: any) => {
        let rodada = 1;
        if (p.status === 'eliminado' && p.rodada_eliminacao) {
          rodada = p.rodada_eliminacao;
        } else if (p.status === 'ativo' && p.rodada_atual) {
          rodada = p.rodada_atual;
        }
        if (rodada > maxRodComDados) maxRodComDados = rodada;
      });
      
      console.log('Última rodada com dados:', maxRodComDados);
      
      // ========== MÁXIMO DE RODADAS = 8 ==========
      const maxRod = 8;
      
      const statsCalculadas: RodadaStats[] = [];
      let acumuladoEliminados = 0;
      
      for (let i = 1; i <= maxRod; i++) {
        const eliminadosNestaRodada = eliminadosMap[i] || 0;
        
        // ========== CORREÇÃO: SÓ MOSTRA ATIVOS SE A RODADA JÁ ACONTECEU ==========
        let ativosNestaRodada = 0;
        let isFutura = false;
        
        if (i <= maxRodComDados) {
          // Rodada com dados: calcula ativos
          ativosNestaRodada = Math.max(0, totalParticipantes - acumuladoEliminados);
        } else {
          // Rodada futura: mostra "—"
          ativosNestaRodada = -1; // -1 indica "sem dados"
          isFutura = true;
        }
        
        acumuladoEliminados += eliminadosNestaRodada;
        
        const variacao = -eliminadosNestaRodada;
        const percentual = totalParticipantes > 0 && ativosNestaRodada > 0
          ? parseFloat(((ativosNestaRodada / totalParticipantes) * 100).toFixed(1))
          : 0;
        
        statsCalculadas.push({
          rodada: i,
          ativos: ativosNestaRodada,
          eliminados: eliminadosNestaRodada,
          totalEliminados: acumuladoEliminados,
          variacao: variacao,
          percentual: percentual > 0 ? percentual : 0,
          isFutura: isFutura
        });
      }
      
      setStats(statsCalculadas);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const taxaEliminacao = totalInicial > 0 ? ((totalEliminadosReais / totalInicial) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30 mb-4">
            <BarChart3 className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-xs font-semibold tracking-wider">EVOLUÇÃO DA COMPETIÇÃO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Trajetória dos <span className="text-yellow-500">Participantes</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Acompanhe como os participantes avançaram (ou foram eliminados) rodada após rodada
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-xl p-3 sm:p-4 text-center border border-green-500/30">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-white">{totalInicial}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Iniciais</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-xl p-3 sm:p-4 text-center border border-blue-500/30">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{totalAtivos}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Ainda na Competição</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-xl p-3 sm:p-4 text-center border border-red-500/30">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-red-400">{totalEliminadosReais}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Eliminados</div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 rounded-xl p-3 sm:p-4 text-center border border-purple-500/30">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-purple-400">{taxaEliminacao}%</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Taxa de Eliminação</div>
          </div>
        </div>

        {/* Linha do Tempo */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            Linha do Tempo
          </h2>
          
          <div className="timeline-wrapper" style={{ minWidth: '100%', overflowX: 'auto' }}>
            <div className="timeline-track" style={{ minWidth: '900px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: '0', position: 'relative', padding: '20px 0 30px 0' }}>
              {stats.map((item, index) => {
                const isFutura = item.isFutura;
                const temDados = !isFutura && item.ativos > 0;
                
                return (
                  <div key={item.rodada} className="timeline-node" style={{ flex: '1', textAlign: 'center', minWidth: '100px', position: 'relative', opacity: isFutura ? 0.4 : 1 }}>
                    <div className="timeline-dot-wrapper" style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                      <div className={`timeline-dot ${item.rodada === 1 ? 'timeline-dot-start' : ''}`} style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: isFutura ? 'linear-gradient(135deg, #1a2a1a, #0a1a0a)' : 'linear-gradient(135deg, #1a3a2a, #0a1a10)',
                        border: `3px solid ${isFutura ? '#2a4a2a' : '#eab308'}`,
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        position: 'relative', 
                        zIndex: '10', 
                        boxShadow: isFutura ? 'none' : '0 0 20px rgba(234, 179, 8, 0.3)',
                        transition: 'all 0.3s ease' 
                      }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: isFutura ? '#4a6a4a' : '#eab308' }}>{item.rodada}</span>
                      </div>
                      {index < stats.length - 1 && (
                        <div className="timeline-connector" style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          width: '100%', 
                          height: '3px', 
                          background: `linear-gradient(90deg, ${isFutura ? '#2a4a2a' : '#eab308'}, ${isFutura ? '#1a2a1a' : 'rgba(234, 179, 8, 0.1)'})`,
                          transform: 'translateY(-50%)', 
                          zIndex: '1' 
                        }}></div>
                      )}
                    </div>
                    
                    <div className="timeline-info" style={{ marginTop: '8px' }}>
                      <div className="timeline-rodada" style={{ fontSize: '0.7rem', color: isFutura ? '#4a6a4a' : '#9ca3af', letterSpacing: '1px', marginBottom: '6px' }}>
                        {isFutura ? `RODADA ${item.rodada} (futura)` : `RODADA ${item.rodada}`}
                      </div>
                      {isFutura ? (
                        <div style={{ fontSize: '0.8rem', color: '#4a6a4a' }}>—</div>
                      ) : (
                        <>
                          <div className="timeline-ativos" style={{ fontSize: '1.8rem', fontWeight: '800', color: '#4ade80', lineHeight: '1.1' }}>{item.ativos}</div>
                          <div className="timeline-ativos-label" style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '4px' }}>ativos</div>
                          {item.eliminados > 0 && (
                            <div className="timeline-eliminados" style={{ fontSize: '0.7rem', color: '#f87171' }}>{item.eliminados} elim.</div>
                          )}
                          {item.variacao < 0 && (
                            <div className="timeline-variacao" style={{ fontSize: '0.65rem', color: '#f87171', marginTop: '6px', fontWeight: '600' }}>▼ {Math.abs(item.variacao)}</div>
                          )}
                          {item.rodada === 1 && (
                            <div className="timeline-badge-start" style={{ fontSize: '0.6rem', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginTop: '10px' }}>🎯 INÍCIO</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-glow"></div>
              <span className="text-gray-400 text-xs">Participantes Ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <span className="text-gray-400 text-xs">Eliminados na Rodada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
              <span className="text-gray-400 text-xs">Progressão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2a4a2a] border border-[#4a6a4a]"></div>
              <span className="text-gray-400 text-xs">Rodada Futura</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm">
            ← Voltar para o Ranking
          </Link>
        </div>
      </div>
    </div>
  );
}