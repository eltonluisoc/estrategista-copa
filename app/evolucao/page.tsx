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
  const [classificado, setClassificado] = useState(0);
  const [pendentes, setPendentes] = useState(0);

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
      const participantesClassificados = participantes.filter((p: any) => p.status === 'classificado').length;
      
      setTotalInicial(totalParticipantes);
      setTotalAtivos(participantesAtivos);
      setTotalEliminadosReais(participantesEliminados);
      setClassificado(participantesClassificados);
      setPendentes(participantesAtivos - participantesClassificados);
      
      const eliminadosMap: { [key: number]: number } = {};
      eliminadosPorRodada.forEach((item: any) => {
        eliminadosMap[item.rodada_eliminacao] = parseInt(item.total);
      });
      
      let maxRod = 1;
      participantes.forEach((p: any) => {
        const rodada = p.status === 'ativo' ? (p.rodada_atual || 1) : (p.rodada_eliminacao || 1);
        if (rodada > maxRod) maxRod = rodada;
      });
      
      const statsCalculadas: RodadaStats[] = [];
      let acumuladoEliminados = 0;
      
      for (let i = 1; i <= maxRod; i++) {
        const eliminadosNestaRodada = eliminadosMap[i] || 0;
        const ativosNestaRodada = totalParticipantes - acumuladoEliminados;
        
        acumuladoEliminados += eliminadosNestaRodada;
        
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
      <div className="min-h-screen bg-gradient-to-br from-[#0b1a2b] to-[#050d15]">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-[#f39c12] text-xl">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const taxaEliminacao = totalInicial > 0 ? ((totalEliminadosReais / totalInicial) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2b] to-[#050d15]">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        
        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-pulse">📊</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                <span className="text-[#f39c12]">TRAJETÓRIA</span> DOS PARTICIPANTES
              </h1>
              <p className="text-[#8ba0b8] text-sm tracking-widest mt-1">
                ✦ ACOMPANHE QUEM AVANÇOU RODADA APÓS RODADA
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a2d45] border border-[#f39c12]/25 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#f39c12]">{classificado}</span>
              <span className="text-[10px] text-[#8ba0b8] uppercase tracking-wider">⭐ Classificado</span>
            </div>
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a2d45] border border-[#3498db]/15 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#3498db]">{pendentes}</span>
              <span className="text-[10px] text-[#8ba0b8] uppercase tracking-wider">⏳ Pendentes</span>
            </div>
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a2d45] border border-[#e74c3c]/12 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#e74c3c]">{totalEliminadosReais}</span>
              <span className="text-[10px] text-[#8ba0b8] uppercase tracking-wider">⚡ Eliminados</span>
            </div>
          </div>
        </div>

        {/* ========== STATS GRID ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <div className="bg-[#1a2d45] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#f39c12]/30">
            <Users className="w-6 h-6 text-[#f39c12] mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{totalInicial}</div>
            <div className="text-[#8ba0b8] text-[10px] uppercase tracking-wider">Participantes Iniciais</div>
          </div>
          <div className="bg-[#1a2d45] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#2ecc71]/30">
            <Trophy className="w-6 h-6 text-[#2ecc71] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#2ecc71]">{totalAtivos}</div>
            <div className="text-[#8ba0b8] text-[10px] uppercase tracking-wider">Ainda na Competição</div>
          </div>
          <div className="bg-[#1a2d45] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#e74c3c]/30">
            <Award className="w-6 h-6 text-[#e74c3c] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#e74c3c]">{totalEliminadosReais}</div>
            <div className="text-[#8ba0b8] text-[10px] uppercase tracking-wider">Eliminados</div>
          </div>
          <div className="bg-[#1a2d45] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#3498db]/30">
            <TrendingUp className="w-6 h-6 text-[#3498db] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#3498db]">{taxaEliminacao}%</div>
            <div className="text-[#8ba0b8] text-[10px] uppercase tracking-wider">Taxa de Eliminação</div>
          </div>
        </div>

        {/* ========== TIMELINE ========== */}
        <div className="bg-[#0f2235]/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 sm:p-8 mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#f39c12]" />
            Linha do Tempo
          </h2>
          
          <div className="min-w-[750px]">
            <div className="flex justify-between items-start gap-2 relative py-4">
              {/* Linha de progresso */}
              <div className="absolute top-[45px] left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-[#f39c12] via-[#3498db] to-[#f39c12] opacity-20 rounded-full"></div>

              {stats.map((item, index) => (
                <div key={item.rodada} className="flex-1 text-center min-w-[70px] relative">
                  {/* Círculo da rodada */}
                  <div className="flex justify-center mb-4">
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center 
                      border-2 transition-all duration-300 hover:scale-105
                      ${item.rodada === stats.length 
                        ? 'bg-gradient-to-br from-[#f39c12]/20 to-[#f39c12]/5 border-[#f39c12] shadow-[0_0_30px_rgba(243,156,18,0.15)]' 
                        : 'bg-[#1a2d45] border-[#f39c12]/40'
                      }
                    `}>
                      <span className={`text-xl font-extrabold ${item.rodada === stats.length ? 'text-[#f39c12]' : 'text-[#f39c12]'}`}>
                        {item.rodada}
                      </span>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="mt-1">
                    <div className="text-[10px] text-[#8ba0b8] tracking-widest mb-1">RODADA {item.rodada}</div>
                    <div className={`text-3xl font-extrabold ${item.rodada === stats.length ? 'text-[#f39c12]' : 'text-[#2ecc71]'}`}>
                      {item.ativos}
                    </div>
                    <div className="text-[10px] text-[#6a8aaa] mb-1">ativos</div>
                    {item.eliminados > 0 && (
                      <div className="text-[11px] text-[#e74c3c]">{item.eliminados} elim.</div>
                    )}
                    {item.variacao < 0 && (
                      <div className="text-[10px] text-[#e74c3c] font-semibold mt-1">▼ {Math.abs(item.variacao)}</div>
                    )}
                    {item.rodada === 1 && (
                      <div className="text-[9px] bg-[#f39c12]/15 text-[#f39c12] px-3 py-0.5 rounded-full inline-block mt-2">
                        🎯 INÍCIO
                      </div>
                    )}
                    {item.rodada === stats.length && (
                      <div className="text-[9px] bg-[#f39c12]/20 text-[#f39c12] px-3 py-0.5 rounded-full inline-block mt-2 border border-[#f39c12]/30 animate-pulse">
                        👑 CLASSIFICADO
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2ecc71]"></div>
              <span className="text-[#8ba0b8] text-xs">Participantes Ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#e74c3c]/50"></div>
              <span className="text-[#8ba0b8] text-xs">Eliminados na Rodada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#f39c12]/50 to-transparent"></div>
              <span className="text-[#8ba0b8] text-xs">Progressão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f39c12] shadow-[0_0_15px_rgba(243,156,18,0.3)]"></div>
              <span className="text-[#8ba0b8] text-xs">⭐ Classificado</span>
            </div>
          </div>
        </div>

        {/* ========== PENDENTES BAR ========== */}
        {pendentes > 0 && (
          <div className="flex items-center justify-center gap-4 flex-wrap p-4 rounded-xl bg-[#3498db]/5 border border-[#3498db]/15">
            <span className="text-2xl">⏳</span>
            <span className="text-[#8ba0b8] text-sm">Próxima rodada:</span>
            <span className="text-2xl font-bold text-[#3498db]">{pendentes}</span>
            <span className="text-[#8ba0b8] text-sm">
              participantes disputam as <span className="text-white font-medium">vagas restantes</span>
            </span>
          </div>
        )}

        {/* ========== FOOTER ========== */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#8ba0b8] hover:text-[#f39c12] transition-colors text-sm">
            ← Voltar para o Ranking
          </Link>
        </div>
      </div>
    </div>
  );
}