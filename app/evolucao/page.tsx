'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Target, Calendar, Award, BarChart3 } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';
import Link from 'next/link';

interface RodadaStats {
  rodada: number;
  ativos: number;
  eliminados: number;
  variacao: number;
}

export default function EvolucaoPage() {
  const [stats, setStats] = useState<RodadaStats[]>([
    { rodada: 1, ativos: 29, eliminados: 0, variacao: 0 },
    { rodada: 2, ativos: 28, eliminados: 1, variacao: -1 },
    { rodada: 3, ativos: 26, eliminados: 3, variacao: -2 },
    { rodada: 4, ativos: 22, eliminados: 7, variacao: -4 },
    { rodada: 5, ativos: 18, eliminados: 11, variacao: -4 },
    { rodada: 6, ativos: 12, eliminados: 17, variacao: -6 },
    { rodada: 7, ativos: 8, eliminados: 21, variacao: -4 },
    { rodada: 8, ativos: 4, eliminados: 25, variacao: -4 },
  ]);

  const totalInicial = stats[0]?.ativos || 0;
  const totalAtual = stats[stats.length - 1]?.ativos || 0;
  const totalEliminados = stats[stats.length - 1]?.eliminados || 0;
  const taxaEliminacao = ((totalEliminados / totalInicial) * 100).toFixed(0);

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
            <div className="text-xl sm:text-2xl font-bold text-green-400">{totalAtual}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Finalistas</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 sm:p-4 text-center border border-red-500/20">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-red-400">{totalEliminados}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Eliminados</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 rounded-xl p-3 sm:p-4 text-center border border-blue-500/20">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{taxaEliminacao}%</div>
            <div className="text-gray-400 text-[10px] sm:text-xs">Taxa de Eliminação</div>
          </div>
        </div>

        {/* Linha do Tempo - OPÇÃO 1 CORRIGIDA */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            Linha do Tempo
          </h2>
          
          <div className="overflow-x-auto pb-4">
            <div className="timeline-container" style={{ minWidth: '650px' }}>
              {stats.map((item, index) => (
                <div key={item.rodada} className="timeline-node">
                  {/* Círculo */}
                  <div className={`timeline-dot ${item.rodada === 1 ? 'timeline-dot-start' : ''} ${item.rodada === stats.length ? 'timeline-dot-end' : ''}`}>
                    <span>{item.rodada}</span>
                  </div>
                  
                  {/* Linha conectora */}
                  {index < stats.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                  
                  {/* Informações */}
                  <div className="timeline-info">
                    <div className="timeline-rodada">RODADA {item.rodada}</div>
                    <div className="timeline-ativos">{item.ativos}</div>
                    <div className="timeline-ativos-label">ativos</div>
                    <div className="timeline-eliminados">{item.eliminados} eliminados</div>
                    {item.variacao < 0 && (
                      <div className="timeline-variacao">
                        ▼ {Math.abs(item.variacao)}
                      </div>
                    )}
                    {item.rodada === 1 && (
                      <div className="timeline-start-badge">🎯 INÍCIO</div>
                    )}
                    {item.rodada === stats.length && (
                      <div className="timeline-end-badge">🏆 FINAL</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t border-white/10">
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
              <span className="text-gray-400 text-xs">Progressão da Competição</span>
            </div>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-500" />
            Detalhamento por Rodada
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Rodada</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">Ativos</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">Eliminados</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">Variação</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">% Restante</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((item) => {
                  const percentual = ((item.ativos / totalInicial) * 100).toFixed(1);
                  return (
                    <tr key={item.rodada} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-2 font-semibold text-yellow-500">Rodada {item.rodada}</td>
                      <td className="text-center py-3 px-2 text-green-400 font-medium">{item.ativos}</td>
                      <td className="text-center py-3 px-2 text-red-400">{item.eliminados}</td>
                      <td className="text-center py-3 px-2">
                        {item.variacao < 0 ? (
                          <span className="text-red-400">▼ {Math.abs(item.variacao)}</span>
                        ) : (
                          <span className="text-green-400">—</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"
                              style={{ width: `${percentual}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400 text-xs w-10">{percentual}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
          >
            ← Voltar para o Ranking
          </Link>
        </div>
      </div>

      <style jsx>{`
        .timeline-container {
          display: flex;
          position: relative;
          justify-content: space-between;
        }
        
        .timeline-node {
          flex: 1;
          text-align: center;
          position: relative;
        }
        
        .timeline-dot {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #1a3a2a, #0a1a10);
          border: 3px solid #eab308;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          position: relative;
          z-index: 10;
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
          transition: all 0.3s ease;
        }
        
        .timeline-node:hover .timeline-dot {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(234, 179, 8, 0.5);
        }
        
        .timeline-dot span {
          font-size: 1.2rem;
          font-weight: 700;
          color: #eab308;
        }
        
        .timeline-line {
          position: absolute;
          top: 28px;
          left: 50%;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, rgba(234, 179, 8, 0.4), rgba(234, 179, 8, 0.1));
          z-index: 1;
        }
        
        .timeline-info {
          margin-top: 12px;
        }
        
        .timeline-rodada {
          font-size: 0.7rem;
          color: #9ca3af;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        
        .timeline-ativos {
          font-size: 1.6rem;
          font-weight: 800;
          color: #4ade80;
          line-height: 1.2;
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
        
        .timeline-start-badge {
          font-size: 0.6rem;
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 8px;
        }
        
        .timeline-end-badge {
          font-size: 0.6rem;
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 8px;
        }
        
        .shadow-glow {
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
        }
        
        @media (max-width: 768px) {
          .timeline-dot {
            width: 44px;
            height: 44px;
          }
          .timeline-dot span {
            font-size: 0.9rem;
          }
          .timeline-line {
            top: 22px;
          }
          .timeline-ativos {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}