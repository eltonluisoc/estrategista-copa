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
}

export default function EvolucaoPage() {
  const [stats, setStats] = useState<RodadaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInicial, setTotalInicial] = useState(0);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [totalEliminadosReais, setTotalEliminadosReais] = useState(0);
  const [classificado, setClassificado] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [classificadosList, setClassificadosList] = useState<any[]>([]);

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
      
      console.log('=== DADOS DO CONSOLE ===');
      console.log('Total de participantes:', participantes.length);
      
      // ========== CONSULTA ESPECÍFICA PARA CLASSIFICADOS ==========
      const classificados = participantes.filter((p: any) => p.status === 'classificado');
      const eliminados = participantes.filter((p: any) => p.status === 'eliminado');
      const ativos = participantes.filter((p: any) => p.status === 'ativo');
      
      console.log('🔍 CLASSIFICADOS ENCONTRADOS:', classificados.length);
      console.log('📋 Lista de Classificados:', classificados.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        status: p.status,
        rodada_atual: p.rodada_atual,
        rodada_classificacao: p.rodada_classificacao
      })));
      
      console.log('📋 Lista de ELIMINADOS:', eliminados.length);
      console.log('📋 Lista de ATIVOS:', ativos.length);
      
      console.log('Eliminados por rodada:', eliminadosPorRodada);
      
      const totalParticipantes = participantes.length;
      
      const participantesAtivos = ativos.length;
      const participantesEliminados = eliminados.length;
      const participantesClassificados = classificados.length;
      
      console.log('Status - Ativos:', participantesAtivos);
      console.log('Status - Eliminados:', participantesEliminados);
      console.log('Status - Classificados:', participantesClassificados);
      
      setTotalInicial(totalParticipantes);
      setTotalAtivos(participantesAtivos);
      setTotalEliminadosReais(participantesEliminados);
      setClassificado(participantesClassificados);
      setPendentes(participantesAtivos);
      setClassificadosList(classificados);
      
      // Mapa de eliminados por rodada
      const eliminadosMap: { [key: number]: number } = {};
      eliminadosPorRodada.forEach((item: any) => {
        eliminadosMap[item.rodada_eliminacao] = parseInt(item.total);
      });
      
      console.log('Eliminados Map:', eliminadosMap);
      
      // ========== CALCULAR RODADAS ==========
      let maxRod = 1;
      participantes.forEach((p: any) => {
        let rodada = 1;
        if (p.status === 'eliminado' && p.rodada_eliminacao) {
          rodada = p.rodada_eliminacao;
        } else if (p.status === 'classificado' && p.rodada_classificacao) {
          rodada = p.rodada_classificacao;
        } else if (p.status === 'ativo' && p.rodada_atual) {
          rodada = p.rodada_atual;
        }
        if (rodada > maxRod) maxRod = rodada;
      });
      
      // Se tem classificados, adicionar uma rodada extra para mostrar
      if (participantesClassificados > 0) {
        // Usar a rodada de classificação do primeiro classificado
        const rodadaClassificacao = classificados[0]?.rodada_classificacao || maxRod;
        maxRod = Math.max(maxRod, rodadaClassificacao);
      }
      
      console.log('Maior rodada:', maxRod);
      
      const statsCalculadas: RodadaStats[] = [];
      let acumuladoEliminados = 0;
      
      for (let i = 1; i <= maxRod; i++) {
        const eliminadosNestaRodada = eliminadosMap[i] || 0;
        
        acumuladoEliminados += eliminadosNestaRodada;
        
        // CORREÇÃO: Ativos = Total - EliminadosAcumulados - Classificados
        let ativosNestaRodada = totalParticipantes - acumuladoEliminados - participantesClassificados;
        
        // Se chegou na rodada de classificação, mostrar 0 ativos (só o classificado)
        const temClassificadoNestaRodada = classificados.some((c: any) => c.rodada_classificacao === i);
        if (temClassificadoNestaRodada) {
          ativosNestaRodada = 0;
        }
        
        const variacao = -eliminadosNestaRodada;
        const percentual = totalParticipantes > 0 
          ? parseFloat(((ativosNestaRodada / totalParticipantes) * 100).toFixed(1))
          : 0;
        
        console.log(`Rodada ${i}: ativos=${ativosNestaRodada}, eliminados=${eliminadosNestaRodada}, acumulado=${acumuladoEliminados}, temClassificado=${temClassificadoNestaRodada}`);
        
        statsCalculadas.push({
          rodada: i,
          ativos: ativosNestaRodada > 0 ? ativosNestaRodada : 0,
          eliminados: eliminadosNestaRodada,
          totalEliminados: acumuladoEliminados,
          variacao: variacao,
          percentual: percentual > 0 ? percentual : 0
        });
      }
      
      console.log('Stats calculadas FINAL:', statsCalculadas);
      setStats(statsCalculadas);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] to-[#050d05]">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-[#eab308] text-xl">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const taxaEliminacao = totalInicial > 0 ? ((totalEliminadosReais / totalInicial) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] to-[#050d05]">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        
        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-pulse">📊</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                <span className="text-[#eab308]">TRAJETÓRIA</span> DOS PARTICIPANTES
              </h1>
              <p className="text-[#8aaa8a] text-sm tracking-widest mt-1">
                ✦ ACOMPANHE QUEM AVANÇOU RODADA APÓS RODADA
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a3a1a] border border-[#eab308]/25 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#eab308]">{classificado}</span>
              <span className="text-[10px] text-[#8aaa8a] uppercase tracking-wider">⭐ Classificado</span>
            </div>
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a3a1a] border border-[#22c55e]/15 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#22c55e]">{pendentes}</span>
              <span className="text-[10px] text-[#8aaa8a] uppercase tracking-wider">⏳ Pendentes</span>
            </div>
            <div className="flex flex-col items-center px-5 py-2 rounded-xl bg-[#1a3a1a] border border-[#ef4444]/12 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <span className="text-2xl font-bold text-[#ef4444]">{totalEliminadosReais}</span>
              <span className="text-[10px] text-[#8aaa8a] uppercase tracking-wider">⚡ Eliminados</span>
            </div>
          </div>
        </div>

        {/* ========== STATS GRID ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <div className="bg-[#1a3a1a] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#eab308]/30">
            <Users className="w-6 h-6 text-[#eab308] mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{totalInicial}</div>
            <div className="text-[#8aaa8a] text-[10px] uppercase tracking-wider">Participantes Iniciais</div>
          </div>
          <div className="bg-[#1a3a1a] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#22c55e]/30">
            <Trophy className="w-6 h-6 text-[#22c55e] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#22c55e]">{totalAtivos}</div>
            <div className="text-[#8aaa8a] text-[10px] uppercase tracking-wider">Ainda na Competição</div>
          </div>
          <div className="bg-[#1a3a1a] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#ef4444]/30">
            <Award className="w-6 h-6 text-[#ef4444] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#ef4444]">{totalEliminadosReais}</div>
            <div className="text-[#8aaa8a] text-[10px] uppercase tracking-wider">Eliminados</div>
          </div>
          <div className="bg-[#1a3a1a] rounded-xl p-4 text-center border border-white/5 transition-all hover:border-[#eab308]/30">
            <BarChart3 className="w-6 h-6 text-[#eab308] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#eab308]">{taxaEliminacao}%</div>
            <div className="text-[#8aaa8a] text-[10px] uppercase tracking-wider">Taxa de Eliminação</div>
          </div>
        </div>

        {/* ========== TIMELINE ========== */}
        <div className="bg-[#0f2a0f]/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 sm:p-8 mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#eab308]" />
            Linha do Tempo
          </h2>
          
          <div className="min-w-[750px]">
            <div className="flex justify-between items-start gap-2 relative py-4">
              {/* Linha de progresso */}
              <div className="absolute top-[45px] left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-[#eab308] via-[#22c55e] to-[#eab308] opacity-20 rounded-full"></div>

              {stats.map((item, index) => {
                const isLastRound = index === stats.length - 1;
                const hasClassificado = classificado > 0;
                // Verifica se tem classificado nesta rodada específica
                const temClassificadoNestaRodada = classificadosList.some((c: any) => c.rodada_classificacao === item.rodada);
                const showClassificado = temClassificadoNestaRodada || (isLastRound && hasClassificado);
                
                return (
                  <div key={item.rodada} className="flex-1 text-center min-w-[70px] relative">
                    {/* Círculo da rodada */}
                    <div className="flex justify-center mb-4">
                      <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center 
                        border-2 transition-all duration-300 hover:scale-105
                        ${showClassificado 
                          ? 'bg-gradient-to-br from-[#eab308]/20 to-[#eab308]/5 border-[#eab308] shadow-[0_0_30px_rgba(234,179,8,0.15)]' 
                          : 'bg-[#1a3a1a] border-[#eab308]/40'
                        }
                      `}>
                        <span className={`text-xl font-extrabold ${showClassificado ? 'text-[#eab308]' : 'text-[#eab308]'}`}>
                          {showClassificado ? '⭐' : item.rodada}
                        </span>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="mt-1">
                      <div className="text-[10px] text-[#8aaa8a] tracking-widest mb-1">
                        {showClassificado ? 'CLASSIFICADO' : `RODADA ${item.rodada}`}
                      </div>
                      <div className={`text-3xl font-extrabold ${showClassificado ? 'text-[#eab308]' : 'text-[#22c55e]'}`}>
                        {showClassificado ? `★ ${classificado}` : item.ativos}
                      </div>
                      <div className="text-[10px] text-[#6a8a6a] mb-1">
                        {showClassificado ? 'classificado' : 'ativos'}
                      </div>
                      {!showClassificado && item.eliminados > 0 && (
                        <div className="text-[11px] text-[#ef4444]">{item.eliminados} elim.</div>
                      )}
                      {!showClassificado && item.variacao < 0 && (
                        <div className="text-[10px] text-[#ef4444] font-semibold mt-1">▼ {Math.abs(item.variacao)}</div>
                      )}
                      {item.rodada === 1 && !showClassificado && (
                        <div className="text-[9px] bg-[#eab308]/15 text-[#eab308] px-3 py-0.5 rounded-full inline-block mt-2">
                          🎯 INÍCIO
                        </div>
                      )}
                      {showClassificado && (
                        <div className="text-[9px] bg-[#eab308]/20 text-[#eab308] px-3 py-0.5 rounded-full inline-block mt-2 border border-[#eab308]/30 animate-pulse">
                          👑 AVANÇOU!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
              <span className="text-[#8aaa8a] text-xs">Participantes Ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]/50"></div>
              <span className="text-[#8aaa8a] text-xs">Eliminados na Rodada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#eab308]/50 to-transparent"></div>
              <span className="text-[#8aaa8a] text-xs">Progressão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.3)]"></div>
              <span className="text-[#8aaa8a] text-xs">⭐ Classificado</span>
            </div>
          </div>
        </div>

        {/* ========== PENDENTES BAR ========== */}
        {pendentes > 0 && (
          <div className="flex items-center justify-center gap-4 flex-wrap p-4 rounded-xl bg-[#22c55e]/5 border border-[#22c55e]/15">
            <span className="text-2xl">⏳</span>
            <span className="text-[#8aaa8a] text-sm">Próxima rodada:</span>
            <span className="text-2xl font-bold text-[#22c55e]">{pendentes}</span>
            <span className="text-[#8aaa8a] text-sm">
              participantes disputam as <span className="text-white font-medium">vagas restantes</span>
            </span>
          </div>
        )}

        {/* ========== FOOTER ========== */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#8aaa8a] hover:text-[#eab308] transition-colors text-sm">
            ← Voltar para o Ranking
          </Link>
        </div>
      </div>
    </div>
  );
}