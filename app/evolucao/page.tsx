'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Target, Calendar, Award, BarChart3 } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';
import Link from 'next/link';

interface RodadaStats {
  rodada: number;
  ativos: number;
  eliminados: number;
  totalEliminados: number;
  variacao: number;
  percentual: number;
}

export default function EvolucaoPage() {
  const [stats, setStats] = useState<RodadaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInicial, setTotalInicial] = useState(0);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [totalEliminadosReais, setTotalEliminadosReais] = useState(0);
  const [maxRodada, setMaxRodada] = useState(0);

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
      
      const participantesAtivos = participantes.filter((p: any) => p.status === 'ativo').length;
      const participantesEliminados = participantes.filter((p: any) => p.status === 'eliminado').length;
      const totalParticipantes = participantes.length;
      
      setTotalInicial(totalParticipantes);
      setTotalAtivos(participantesAtivos);
      setTotalEliminadosReais(participantesEliminados);
      
      // Mapear eliminados por rodada
      const eliminadosMap: { [key: number]: number } = {};
      eliminadosPorRodada.forEach((item: any) => {
        eliminadosMap[item.rodada_eliminacao] = parseInt(item.total);
      });
      
      // Encontrar a maior rodada com dados (ativos ou eliminados)
      let maxRod = 1;
      participantes.forEach((p: any) => {
        const rodada = p.status === 'ativo' ? (p.rodada_atual || 1) : (p.rodada_eliminacao || 1);
        if (rodada > maxRod) maxRod = rodada;
      });
      setMaxRodada(maxRod);
      
      // Calcular estatísticas apenas até a rodada atual
      const statsCalculadas: RodadaStats[] = [];
      let acumuladoEliminados = 0;
      
      for (let i = 1; i <= maxRod; i++) {
        const eliminadosNestaRodada = eliminadosMap[i] || 0;
        acumuladoEliminados += eliminadosNestaRodada;
        
        const ativosNestaRodada = totalParticipantes - acumuladoEliminados;
        const variacao = -eliminadosNestaRodada;
        const percentual = totalParticipantes > 0 
          ? parseFloat(((ativosNestaRodada / totalParticipantes) * 100).toFixed(1))
          : 0;
        
        statsCalculadas.push({
          rodada: i,
          ativos: ativosNestaRodada,
          eliminados: eliminadosNestaRodada,
          totalEliminados: acumuladoEliminados,
          variacao: variacao,
          percentual: percentual
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
        
        {/* Header */}
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
          <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 rounded-xl p-3 sm:p-4 text-center border border-yellow-500/20">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-white">{totalInicial}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Participantes Iniciais</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 rounded-xl p-3 sm:p-4 text-center border border-green-500/20">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-green-400">{totalAtivos}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Ainda na Competição</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 sm:p-4 text-center border border-red-500/20">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-red-400">{totalEliminadosReais}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Eliminados</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 rounded-xl p-3 sm:p-4 text-center border border-blue-500/20">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{taxaEliminacao}%</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Taxa de Eliminação</div>
          </div>
        </div>

        {/* Linha do Tempo - APENAS RODADAS COM DADOS REAIS */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            Linha do Tempo
          </h2>
          
          <div className="timeline-wrapper" style={{ minWidth: '700px' }}>
            <div className="timeline-track">
              {stats.map((item, index) => {
                return (
                  <div key={item.rodada} className="timeline-node">
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${item.rodada === 1 ? 'timeline-dot-start' : ''}`}>
                        <span>{item.rodada}</span>
                      </div>
                      {index < stats.length - 1 && (
                        <div className="timeline-connector"></div>
                      )}
                    </div>
                    
                    <div className="timeline-info">
                      <div className="timeline-rodada">RODADA {item.rodada}</div>
                      <div className="timeline-ativos">{item.ativos}</div>
                      <div className="timeline-ativos-label">ativos</div>
                      {item.eliminados > 0 && (
                        <div className="timeline-eliminados">{item.eliminados} elim.</div>
                      )}
                      {item.variacao < 0 && (
                        <div className="timeline-variacao">▼ {Math.abs(item.variacao)}</div>
                      )}
                      {item.rodada === 1 && (
                        <div className="timeline-badge-start">🎯 INÍCIO</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Legenda */}
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
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="text-center mt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm">
            ← Voltar para o Ranking
          </Link>
        </div>
      </div>

      <style jsx>{`
        .timeline-wrapper {
          position: relative;
          width: 100%;
          overflow-x: auto;
        }
        
        .timeline-track {
          display: flex;
          justify-content: space-around;
          align-items: flex-start;
          gap: 0;
          position: relative;
          padding: 20px 0 30px 0;
        }
        
        .timeline-node {
          flex: 1;
          text-align: center;
          min-width: 100px;
          position: relative;
        }
        
        .timeline-dot-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .timeline-dot {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #1a3a2a, #0a1a10);
          border: 3px solid #eab308;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
          transition: all 0.3s ease;
        }
        
        .timeline-node:hover .timeline-dot {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(234, 179, 8, 0.4);
        }
        
        .timeline-dot span {
          font-size: 1.3rem;
          font-weight: 800;
          color: #eab308;
        }
        
        .timeline-connector {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #eab308, rgba(234, 179, 8, 0.1));
          transform: translateY(-50%);
          z-index: 1;
        }
        
        .timeline-info {
          margin-top: 8px;
        }
        
        .timeline-rodada {
          font-size: 0.7rem;
          color: #9ca3af;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        
        .timeline-ativos {
          font-size: 1.8rem;
          font-weight: 800;
          color: #4ade80;
          line-height: 1.1;
        }
        
        .timeline-ativos-label {
          font-size: 0.65rem;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .timeline-eliminados {
          font-size: 0.7rem;
          color: #f87171;
        }
        
        .timeline-variacao {
          font-size: 0.65rem;
          color: #f87171;
          margin-top: 6px;
          font-weight: 600;
        }
        
        .timeline-badge-start {
          font-size: 0.6rem;
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
          padding: 3px 10px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 10px;
        }
        
        .shadow-glow {
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.3);
        }
        
        @media (max-width: 768px) {
          .timeline-dot {
            width: 48px;
            height: 48px;
          }
          .timeline-dot span {
            font-size: 1rem;
          }
          .timeline-ativos {
            font-size: 1.3rem;
          }
          .timeline-node {
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
}